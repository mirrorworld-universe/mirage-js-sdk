import { AUCTION_HOUSE_PROGRAM_ID, MINT_CONFIG, NFT_STORAGE_API_KEY, WRAPPED_SOL_MINT } from './constants';
import { Metaplex, Nft } from '@metaplex-foundation/js';
import { Commitment, Connection, LAMPORTS_PER_SOL, PublicKey, RpcResponseAndContext, SignatureResult, Transaction } from '@solana/web3.js';
import type { Wallet } from '@project-serum/anchor';
import { AnchorProvider, Program, Provider } from '@project-serum/anchor';
import merge from 'lodash.merge';
import { getNftOwner, getTokenTransactions, processCreatorShares, uploadNFTFileToStorage } from './utils';
import { AuctionHouse, MetadataObject } from './types';
import { AuctionHouseIDL, IDL } from './auctionHouseIdl';
import * as auctionUtils from './auctionUtils';

import { BidReceipt, ListingReceipt, PurchaseReceipt } from '@metaplex-foundation/mpl-auction-house/dist/src/generated/accounts';
import { mintNFT, MintNFTResponse } from './mint';
import { InsufficientBalanceError, programErrorHandler } from './errors';
import {
  createBuyTransaction,
  createCancelListingTransaction,
  createListingTransaction,
  createTransferInstruction,
  createUpdateListingTransaction,
} from './mirage-transactions';

import { throwError } from './errors/errors.interface';
import { createCreateMarketplaceTransaction, CreateMarketplaceActionOptions, CreateMarketplaceOptions } from './mirage-transactions/create-marketplace';
import { createUpdateMarketplaceTransaction, UpdateMarketplaceOptions } from './mirage-transactions/update-marketplace';
import * as AuctionHouseProgram from '@metaplex-foundation/mpl-auction-house';

export interface IMirageOptions {
  connection: Connection;
  wallet: Wallet;
  NFTStorageAPIKey?: string;
  mintConfig?: {
    seller_fee_basis_points: number;
    mintRoyalties: number;
  };
  marketplace: {
    authority: PublicKey;
    /**
     * Marketplace Trading Currency. If not provided, it defaults
     * to SOL.
     */
    treasuryMint?: PublicKey;
  };
}

export type ReceiptType = 'purchase_receipt' | 'listing_receipt' | 'cancel_receipt' | 'cancel_listing_receipt' | 'bid_receipt' | 'cancel_bid_receipt';
export type ReceiptAddress = PublicKey;

export interface TransactionReceipt
  extends Omit<ListingReceipt, 'serialize' | 'pretty'>,
    Omit<BidReceipt, 'serialize' | 'pretty'>,
    Omit<PurchaseReceipt, 'serialize' | 'pretty'> {
  receipt_type: ReceiptType;
  createdAt: number;
  cancelledAt: number;
  price: number;
  tokenSize: number;
}

export type TransactionSignature = string | undefined;

export class Mirage {
  auctionHouseAuthority: PublicKey;
  _treasuryMint: PublicKey = WRAPPED_SOL_MINT;
  auctionHouse?: PublicKey;
  _provider?: Provider;
  program?: Program<AuctionHouseIDL>;
  connection: Connection;
  wallet: Wallet;
  NFTStorageAPIKey: string;
  mintConfig: IMirageOptions['mintConfig'];
  metaplex: Metaplex;
  constructor({ connection, wallet, mintConfig: userMintConfig = MINT_CONFIG, marketplace }: IMirageOptions) {
    this.auctionHouseAuthority = marketplace.authority;
    this._treasuryMint = marketplace.treasuryMint || WRAPPED_SOL_MINT;
    this.connection = connection;
    this.wallet = wallet;
    this.mintConfig = merge(MINT_CONFIG, userMintConfig);
    this.NFTStorageAPIKey = NFT_STORAGE_API_KEY;
    this.metaplex = new Metaplex(connection);
    this.setup().then();
  }

  async setup() {
    this._provider = await this.getProvider('processed');

    console.log({
      wallet: this.wallet.publicKey.toBase58(),
      auctionHouseSigner: this.auctionHouseAuthority!.toBase58(),
    });
    /**
     * 1. Create auctionHouse
     * 2. List token by seller
     * 3. Buy token by buyer
     * 4. Cancel listing
     */

    const [auctionHouse] = await this.getAuctionHouseAddress();
    this.auctionHouse = auctionHouse;
    this.program = await this.loadAuctionHouseProgram();
    console.log('Auctionhouse initialized at address', auctionHouse.toBase58());
    console.log('Mirage SDK ready', {
      wallet: this.wallet.publicKey.toBase58(),
      auctionHouse: auctionHouse.toBase58(),
      auctionHouseSigner: this.auctionHouseAuthority!.toBase58(),
    });
  }

  /** Get user's NFTs */
  async getUserNfts(publicKey: PublicKey): Promise<Nft[]> {
    return this.metaplex.nfts().findAllByOwner(publicKey);
  }

  /** Get single NFT by mint */
  async getNft(mintKey: PublicKey): Promise<Nft> {
    return this.metaplex.nfts().findByMint(mintKey);
  }

  /** Gets the owner of an NFT */
  async getNftOwner(mint: string | PublicKey) {
    return getNftOwner(mint, this.connection);
  }

  /** Determines whether the client is the owner of the auctionhouse */
  get clientIsOwner(): boolean {
    return this.auctionHouseAuthority.toBase58() === this.wallet.publicKey.toBase58();
  }

  /** Get the auction house addresses by the owner */
  async getAuctionHouseAddress(treasuryMint: PublicKey = this._treasuryMint): Promise<[PublicKey, number]> {
    if (!this.auctionHouseAuthority) throw new Error('auctionHouseAuthority not provided');
    return auctionUtils.getAuctionHouseAddress(this.auctionHouseAuthority, treasuryMint);
  }

  /** Loads provider instance */
  async getProvider(commitment: Commitment = 'processed'): Promise<Provider> {
    const wallet = this.wallet;
    return new AnchorProvider(this.connection, wallet, {
      preflightCommitment: commitment,
    });
  }

  /** Loads auctionhouse program */
  async loadAuctionHouseProgram(): Promise<Program<AuctionHouseIDL>> {
    const provider = new AnchorProvider(this.connection!, this.wallet!, {
      preflightCommitment: 'recent',
    });
    return new Program(IDL, AUCTION_HOUSE_PROGRAM_ID, provider);
  }

  /**
   * Fetches an auctionHouse object
   * @param auctionHouse
   */
  async fetchAuctionHouse(auctionHouse: PublicKey) {
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
    if (!this.connection) throwError('PROGRAM_NOT_INITIALIZED');
    const baseObject = (await this.program!.account.auctionHouse.fetch(auctionHouse!)) as any as AuctionHouse;

    const feeAmount = await this.program.provider.connection.getBalance(baseObject.auctionHouseFeeAccount);
    const treasuryAmount = await Mirage.getTokenAmount(this.program, baseObject.auctionHouseTreasury, baseObject.treasuryMint);

    return {
      ...baseObject,
      feeAmount,
      treasuryAmount,
    };
  }

  /**
   * Create listing transaction
   * @param mint
   * @param listingPrice
   * @param sellerPublicKey
   */
  async createListTransaction(mint: PublicKey, listingPrice: number, sellerPublicKey: PublicKey) {
    if (!this.wallet) {
      throwError('WALLET_NOT_INITIALIZED');
    }
    if (!this.auctionHouse) {
      throwError('AUCTION_HOUSE_NOT_INITIALIZED');
    }
    if (!this.auctionHouse) {
      [this.auctionHouse] = await this.getAuctionHouseAddress();
    }
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
    if (!this.program) {
      throwError('PROGRAM_NOT_INITIALIZED');
    }
    return createListingTransaction(mint, listingPrice, sellerPublicKey, this.auctionHouse, this.program);
  }

  /**
   * Lists an NFT for sale.
   * @param mint NFT mint address to be sold
   * @param _listingPrice price at which NFT will be sold
   */
  async listToken(mint: string, _listingPrice: number): Promise<readonly [RpcResponseAndContext<any>, ReceiptAddress, TransactionSignature]> {
    const sellerWallet = this.wallet;
    const [txt, receipt] = await this.createListTransaction(new PublicKey(mint), _listingPrice, sellerWallet.publicKey);

    txt.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    txt.feePayer = sellerWallet.publicKey;

    const estimatedCost = ((await txt.getEstimatedFee(this.connection)) || 0) / LAMPORTS_PER_SOL;
    const { value: _balance } = await this.connection.getBalanceAndContext(this.wallet.publicKey);
    const balance = _balance / LAMPORTS_PER_SOL;
    console.info('Estimated cost of transaction: ', estimatedCost);
    console.info('Wallet Balance', balance, '');

    if (balance < estimatedCost) {
      throw new InsufficientBalanceError('Account balance is not enough to complete this sell transaction');
    }

    let signed: Transaction | undefined = undefined;

    try {
      signed = await sellerWallet.signTransaction(txt);
    } catch (e: any) {
      console.error('Seller cancelled transaction', e);
      throw e;
    }

    let signature = undefined;
    let result: RpcResponseAndContext<SignatureResult>;
    try {
      signature = await this.connection.sendRawTransaction(signed!.serialize());
      result = await this.connection.confirmTransaction(signature, 'confirmed');
    } catch (error) {
      programErrorHandler(error);
    }

    console.debug('result:', result!);
    console.debug('Successfully listed ', mint, ' at ', _listingPrice, ' SOL');
    return [result!, receipt, signature] as const;
  }

  /**
   * Creates Buy transaction Object
   * @param mint
   * @param listingPrice
   * @param buyerPublicKey
   * @param connection
   */
  async createBuyTransaction(mint: PublicKey, listingPrice: number, buyerPublicKey: PublicKey, connection = this.connection) {
    if (!this.wallet) {
      throwError('WALLET_NOT_INITIALIZED');
    }
    if (!this.auctionHouse) {
      throwError('AUCTION_HOUSE_NOT_INITIALIZED');
    }
    if (!this.auctionHouse) {
      [this.auctionHouse] = await this.getAuctionHouseAddress();
    }
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
    if (!this.program) {
      throwError('PROGRAM_NOT_INITIALIZED');
    }

    const [sellerAddressAsString, _sellerPublicKey] = await getNftOwner(mint, connection);

    if (buyerPublicKey.toBase58() === sellerAddressAsString) {
      throw new Error('You cannot buy your own NFT');
    }

    return createBuyTransaction(mint, listingPrice, buyerPublicKey, _sellerPublicKey, this.auctionHouse, this.program, this.connection);
  }

  /**
   * Creates Update Listing transaction Object
   * @param mint
   * @param currentListingPrice
   * @param newListingPrice
   * @param sellerPublicKey
   * @param auctionHouseAuthority
   * @param connection
   */
  async createUpdateListingTransaction(
    mint: PublicKey,
    currentListingPrice: number,
    newListingPrice: number,
    sellerPublicKey: PublicKey,
    auctionHouseAuthority = this.auctionHouseAuthority,
    connection = this.connection
  ) {
    if (!this.wallet) {
      throwError('WALLET_NOT_INITIALIZED');
    }
    if (!this.auctionHouse) {
      throwError('AUCTION_HOUSE_NOT_INITIALIZED');
    }
    if (!this.auctionHouse) {
      [this.auctionHouse] = await this.getAuctionHouseAddress();
    }
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
    if (!this.program) {
      throwError('PROGRAM_NOT_INITIALIZED');
    }
    return createUpdateListingTransaction(mint, currentListingPrice, newListingPrice, sellerPublicKey, this.auctionHouse, this.program, connection);
  }

  /**
   * Purchases an NFT that has been listed on sale
   * @param mint NFT mint address to be bought
   * @param _buyerPrice price at which NFT will be bought. This MUST match the selling price of the NFT
   */
  async buyToken(mint: string, _buyerPrice: number): Promise<readonly [RpcResponseAndContext<any>, ReceiptAddress, TransactionSignature]> {
    const buyerWallet = this.wallet;
    const [buyTxt, purchaseReceipt, signers] = await this.createBuyTransaction(new PublicKey(mint), _buyerPrice, buyerWallet.publicKey);

    buyTxt.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    buyTxt.feePayer = buyerWallet.publicKey;

    if (signers?.length) {
      buyTxt.sign(...signers);
    }

    const estimatedCost = ((await buyTxt.getEstimatedFee(this.connection)) || 0) / LAMPORTS_PER_SOL;
    const { value: _balance } = await this.connection.getBalanceAndContext(this.wallet.publicKey);
    const balance = _balance / LAMPORTS_PER_SOL;
    console.info('Estimated cost of transaction: ', estimatedCost);
    console.info('Wallet Balance', balance);

    if (balance < estimatedCost) {
      throw new InsufficientBalanceError('Account balance is not enough to complete this purchase transaction');
    }

    let signed: Transaction | undefined = undefined;

    try {
      signed = await buyerWallet.signTransaction(buyTxt);
    } catch (e: any) {
      console.error('Buyer cancelled transaction', e.message);
      throw e;
    }

    let signature = undefined;
    let result: RpcResponseAndContext<SignatureResult>;
    try {
      signature = await this.connection.sendRawTransaction(signed!.serialize());
      result = await this.connection.confirmTransaction(signature, 'confirmed');
    } catch (error) {
      programErrorHandler(error);
    }

    console.debug('result', result!);
    console.debug('Successfully purchased ', mint, ' at ', _buyerPrice, ' SOL');
    return [result!, purchaseReceipt, signature] as const;
  }

  /**
   * Updates a current listing
   * @param mint
   * @param currentListingPrice
   * @param newListingPrice
   */
  async updateListing(
    mint: string,
    currentListingPrice: number,
    newListingPrice: number
  ): Promise<readonly [RpcResponseAndContext<any>, ReceiptAddress, TransactionSignature]> {
    const sellerPublicKey = this.wallet.publicKey;

    const [txt, newListingReceipt] = await this.createUpdateListingTransaction(new PublicKey(mint), currentListingPrice, newListingPrice, sellerPublicKey);

    txt.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    txt.feePayer = this.wallet.publicKey;

    const estimatedCost = ((await txt.getEstimatedFee(this.connection)) || 0) / LAMPORTS_PER_SOL;
    const { value: _balance } = await this.connection.getBalanceAndContext(this.wallet.publicKey);
    const balance = _balance / LAMPORTS_PER_SOL;
    console.info('Estimated cost of transaction: ', estimatedCost);
    console.info('Wallet Balance', balance, '');

    if (balance < estimatedCost) {
      throw new InsufficientBalanceError('Account balance is not enough to complete this update listing transaction');
    }

    let signed: Transaction | undefined = undefined;

    try {
      signed = await this.wallet.signTransaction(txt);
    } catch (e) {
      console.error('Seller cancelled transaction', e);
      throw e;
    }

    let signature = undefined;
    let result: RpcResponseAndContext<SignatureResult>;
    try {
      signature = await this.connection.sendRawTransaction(signed!.serialize());
      result = await this.connection.confirmTransaction(signature, 'confirmed');
    } catch (error) {
      programErrorHandler(error);
    }

    console.log('result', result!);
    console.log('Successfully changed listing price for ', mint, ' from ', currentListingPrice, ' SOL ', ' to ', newListingPrice);
    // Get new listing
    return [result!, newListingReceipt, signature] as const;
  }

  /**
   * Creates Cancel Listing transaction Object
   * @param mint
   * @param currentListingPrice
   * @param sellerPublicKey
   * @param auctionHouseAuthority
   * @param connection
   * @param __DANGEROUSLY_INSET_SELLER__
   */
  async createCancelListingTransaction(
    mint: PublicKey,
    currentListingPrice: number,
    sellerPublicKey: PublicKey,
    auctionHouseAuthority = this.auctionHouseAuthority,
    connection = this.connection,
    __DANGEROUSLY_INSET_SELLER__?: string
  ) {
    if (!this.wallet) {
      throwError('WALLET_NOT_INITIALIZED');
    }
    if (!this.auctionHouse) {
      throwError('AUCTION_HOUSE_NOT_INITIALIZED');
    }
    if (!this.auctionHouse) {
      [this.auctionHouse] = await this.getAuctionHouseAddress();
    }
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
    if (!this.program) {
      throwError('PROGRAM_NOT_INITIALIZED');
    }
    const seller = __DANGEROUSLY_INSET_SELLER__ ? new PublicKey(__DANGEROUSLY_INSET_SELLER__) : sellerPublicKey;

    const [_ownerAsString, _ownerPublicKey] = await getNftOwner(mint, connection);
    if (seller.toBase58() !== _ownerPublicKey.toBase58() && sellerPublicKey.toBase58() !== auctionHouseAuthority.toBase58()) {
      throw new Error('You cannot cancel listing of an NFT you do not own.');
    }

    return createCancelListingTransaction(mint, currentListingPrice, seller, this.auctionHouse, this.program, connection);
  }
  /**
   * Cancels a listing for sell or buy instructions for an NFT
   * @param mint NFT mint address whose listing is to be cancelled
   * @param currentListingPrice price at which NFT was listed
   * @param __DANGEROUSLY_INSET_SELLER__
   */
  async cancelListing(
    mint: string,
    currentListingPrice: number,
    __DANGEROUSLY_INSET_SELLER__?: string
  ): Promise<readonly [RpcResponseAndContext<any>, ReceiptAddress, TransactionSignature]> {
    const sellerPublicKey = this.wallet.publicKey;

    const [txt, receipt] = await this.createCancelListingTransaction(
      new PublicKey(mint),
      currentListingPrice,
      sellerPublicKey,
      undefined,
      undefined,
      __DANGEROUSLY_INSET_SELLER__
    );

    txt.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    txt.feePayer = this.wallet.publicKey;

    const estimatedCost = ((await txt.getEstimatedFee(this.connection)) || 0) / LAMPORTS_PER_SOL;
    const { value: _balance } = await this.connection.getBalanceAndContext(this.wallet.publicKey);
    const balance = _balance / LAMPORTS_PER_SOL;
    console.info('Estimated cost of transaction: ', estimatedCost);
    console.info('Wallet Balance', balance, '');

    if (balance < estimatedCost) {
      throw new InsufficientBalanceError('Account balance is not enough to complete this cancel listing transaction');
    }

    let signed: Transaction | undefined = undefined;

    try {
      signed = await this.wallet.signTransaction(txt);
    } catch (e: any) {
      console.error('Seller cancelled transaction', e.message);
      throw e;
    }

    console.info('Sending the transaction to Solana.');

    let signature = undefined;
    let result: RpcResponseAndContext<SignatureResult>;
    try {
      signature = await this.connection.sendRawTransaction(signed!.serialize());
      result = await this.connection.confirmTransaction(signature, 'confirmed');
    } catch (error) {
      programErrorHandler(error);
    }
    console.debug('result', result!);
    console.debug('Successfully cancelled listing for mint ', mint, ' at ', currentListingPrice, ' SOL');

    const ListingReceipt = await AuctionHouseProgram.accountProviders.ListingReceipt.fromAccountAddress(this.connection, receipt);
    console.debug('listingReceiptObj', JSON.stringify(ListingReceipt, null, 2));
    return [result!, receipt, signature] as const;
  }

  /**
   * Creates Transfer transaction Object
   * @param mint
   * @param recipient
   * @param holderPublicKey
   * @param auctionHouseAuthority
   * @param connection
   * @param __DANGEROUSLY_INSET_SELLER__
   */
  async createTransferTransaction(
    mint: PublicKey,
    recipient: PublicKey,
    holderPublicKey: PublicKey,
    auctionHouseAuthority = this.auctionHouseAuthority,
    connection = this.connection,
    __DANGEROUSLY_INSET_SELLER__?: string
  ) {
    if (!this.wallet) {
      throwError('WALLET_NOT_INITIALIZED');
    }
    if (!this.auctionHouse) {
      throwError('AUCTION_HOUSE_NOT_INITIALIZED');
    }
    if (!this.auctionHouse) {
      [this.auctionHouse] = await this.getAuctionHouseAddress();
    }
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
    if (!this.program) {
      throwError('PROGRAM_NOT_INITIALIZED');
    }

    const [_ownerAsString, _ownerPublicKey] = await getNftOwner(mint, connection);
    if (holderPublicKey.toBase58() !== _ownerPublicKey.toBase58()) {
      throw new Error('You cannot transfer NFT you do not own.');
    }

    return createTransferInstruction(mint, recipient, holderPublicKey, connection);
  }

  async createCreateMarketplaceTransaction(
    auctionHouseAuthority: CreateMarketplaceOptions['owner'],
    sellerFeeBasisPoints: CreateMarketplaceOptions['sellerFeeBasisPoints'],
    treasuryMint?: CreateMarketplaceOptions['treasuryMint'],
    feeWithdrawalDestination?: CreateMarketplaceOptions['feeWithdrawalDestination'],
    treasuryWithdrawalDestination?: CreateMarketplaceOptions['treasuryWithdrawalDestination'],
    requiresSignOff?: CreateMarketplaceOptions['requiresSignOff'],
    canChangeSalePrice?: CreateMarketplaceOptions['canChangeSalePrice'],
    storeFrontUrl?: string,
    feePayer?: PublicKey
  ) {
    const optional = {
      treasuryMint,
      feeWithdrawalDestination,
      treasuryWithdrawalDestination,
      requiresSignOff,
      canChangeSalePrice,
    };

    Object.keys(optional).forEach((k) => !optional[k] && delete optional[k]);

    return createCreateMarketplaceTransaction(
      {
        owner: auctionHouseAuthority,
        sellerFeeBasisPoints,
        ...optional,
      },
      storeFrontUrl,
      feePayer
    );
  }

  async createUpdateMarketplaceTransaction(
    authority: UpdateMarketplaceOptions['authority'],
    sellerFeeBasisPoints: UpdateMarketplaceOptions['sellerFeeBasisPoints'],
    newAuthority?: UpdateMarketplaceOptions['newAuthority'],
    treasuryMint?: UpdateMarketplaceOptions['treasuryMint'],
    feeWithdrawalDestination?: UpdateMarketplaceOptions['feeWithdrawalDestination'],
    treasuryWithdrawalDestination?: UpdateMarketplaceOptions['treasuryWithdrawalDestination'],
    requiresSignOff?: UpdateMarketplaceOptions['requiresSignOff'],
    canChangeSalePrice?: UpdateMarketplaceOptions['canChangeSalePrice'],
    storeFrontUrl?: string,
    feePayer?: PublicKey
  ) {
    const optional = {
      newAuthority,
      treasuryMint,
      feeWithdrawalDestination,
      treasuryWithdrawalDestination,
      requiresSignOff,
      canChangeSalePrice,
    };

    Object.keys(optional).forEach((k) => !optional[k] && delete optional[k]);

    return createUpdateMarketplaceTransaction(
      {
        authority,
        sellerFeeBasisPoints,
        ...optional,
      },
      storeFrontUrl,
      feePayer
    );
  }

  /**
   * Sends an NFT to a new user.
   * @param mint NFT mint address to transfer to a new user
   * @param recipient Recipient's publicKey
   */
  async transferNft(mint: string | PublicKey, recipient: string | PublicKey): Promise<[RpcResponseAndContext<SignatureResult>, TransactionSignature]> {
    const _mint = new PublicKey(mint);
    const _recipient = new PublicKey(recipient);

    const holderPublicKey = this.wallet.publicKey;
    const txt = await this.createTransferTransaction(_mint, _recipient, holderPublicKey);

    txt.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    txt.feePayer = this.wallet.publicKey;

    const estimatedCost = ((await txt.getEstimatedFee(this.connection)) || 0) / LAMPORTS_PER_SOL;
    const { value: _balance } = await this.connection.getBalanceAndContext(this.wallet.publicKey);
    const balance = _balance / LAMPORTS_PER_SOL;
    console.info('Estimated cost of transaction: ', estimatedCost);
    console.info('Wallet Balance', balance, '');

    if (balance < estimatedCost) {
      throw new InsufficientBalanceError('Account balance is not enough to complete this transfer NFT transaction');
    }

    let signed: Transaction | undefined = undefined;

    try {
      signed = await this.wallet.signTransaction(txt);
    } catch (e: any) {
      console.error('sender cancelled transaction', e.message);
      throw e;
    }

    console.info('Sending the transaction to Solana.');
    let signature = undefined;
    let result: RpcResponseAndContext<SignatureResult>;
    try {
      signature = await this.connection.sendRawTransaction(signed!.serialize());
      result = await this.connection.confirmTransaction(signature, 'confirmed');
    } catch (error) {
      programErrorHandler(error);
    }

    console.log('result', result!);
    console.log('Successfully transferred nft ', mint, ' from ', this.wallet.publicKey.toBase58(), ' to ', _recipient.toBase58());
    return [result!, signature];
  }

  /**
   * Creates a new marketplace instance for the user.
   * @param options
   */
  async createMarketplace(options: CreateMarketplaceActionOptions) {
    if (!this.wallet) throwError('WALLET_NOT_INITIALIZED');
    const createMarketplaceTransaction = await this.createCreateMarketplaceTransaction(
      this.wallet.publicKey,
      options.sellerFeeBasisPoints,
      options.treasuryMint || this._treasuryMint,
      options.feeWithdrawalDestination,
      options.treasuryWithdrawalDestination,
      options.requiresSignOff,
      options.canChangeSalePrice
    );
    createMarketplaceTransaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    createMarketplaceTransaction.feePayer = this.wallet.publicKey;

    const signed = await this.signTransaction(createMarketplaceTransaction, this.wallet);
    const signature = await this.connection.sendRawTransaction(signed);
    const result = await this.connection.confirmTransaction(signature, 'confirmed');
    return [result, signature];
  }

  async updateMarketplace(options: UpdateMarketplaceOptions) {
    if (!this.wallet) throwError('WALLET_NOT_INITIALIZED');
    const updateMarketplaceTransaction = await this.createUpdateMarketplaceTransaction(
      this.wallet.publicKey,
      options.sellerFeeBasisPoints,
      options.newAuthority,
      options.treasuryMint || this._treasuryMint,
      options.feeWithdrawalDestination,
      options.treasuryWithdrawalDestination,
      options.requiresSignOff,
      options.canChangeSalePrice
    );
    updateMarketplaceTransaction.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    updateMarketplaceTransaction.feePayer = this.wallet.publicKey;

    const signed = await this.signTransaction(updateMarketplaceTransaction, this.wallet);
    const signature = await this.connection.sendRawTransaction(signed);
    const result = await this.connection.confirmTransaction(signature, 'confirmed');
    return [result, signature];
  }

  /**
   * Mints a new NFT on Solana. There are 2 approaches to using this function.
   * 1. If you already have your files uploaded to the blockchain, then there is no
   *    need to perform a new upload. Simply provide the necessary metadata URI / tokenURI.
   * 2. If you choose to provide a file/image/video for your NFT, then it will be uploaded
   *    to a decentralized storage service before minting.
   * @param metadata Object for metadata according to Metaplex NFT standard. @see https://docs.metaplex.com/token-metadata/specification#full-metadata-struct
   * @param metadataLink URL for your token metadata. If provided, then upload is ignored.
   * @param file
   */
  async mintNft(metadata: MetadataObject, metadataLink?: string, file?: File): Promise<Nft> {
    if (!metadata && !metadataLink) throw new Error('Expected metadata object or metadataURL to mint an NFT');

    const creators = processCreatorShares(
      [
        ...merge(
          [
            {
              address: this.wallet.publicKey.toBase58(),
              share: 100,
            },
          ],
          metadata.properties?.creators
        ),
      ],
      this.auctionHouseAuthority
    );

    /**
     * 1. Metadata object
     * 2. wallet instance to sign transaction
     * 3. Upload to NFT.storage.
     */
    let _metadata: MintNFTResponse;
    if (!metadataLink) {
      const finalMetadata = merge(metadata, {
        creators: creators,
        properties: {
          creators,
        },
        seller_fee_basis_points: this.mintConfig!.seller_fee_basis_points,
      });
      // @ts-expect-error
      const [metadataUrl] = await uploadNFTFileToStorage(null, finalMetadata, undefined, this.NFTStorageAPIKey);
      console.log('Uploaded metadata to:', metadataUrl);
      // const tokenAccount = await getAtaForMint()
      _metadata = await mintNFT({
        connection: this.connection,
        wallet: this.wallet,
        uri: metadataUrl,
        maxSupply: 1,
        updateAuthority: this.auctionHouseAuthority!,
      });
    } else {
      _metadata = await mintNFT({
        connection: this.connection,
        wallet: this.wallet,
        uri: metadataLink,
        maxSupply: 1,
        updateAuthority: this.auctionHouseAuthority!,
      });
    }

    /** Wait for one more second before loading new metadata */

    return this.getNft(_metadata.mint);
  }

  /**
   * Get token transactions
   * @param mint
   * @param auctionHouseAddress
   */
  async getTokenTransactions(
    mint: string | PublicKey,
    auctionHouseAddress: string | PublicKey = this.auctionHouse!
  ): Promise<(TransactionReceipt | undefined)[]> {
    return getTokenTransactions(new PublicKey(mint), new PublicKey(auctionHouseAddress), this.connection);
  }

  /**
   * Signs a transaction object
   * @param txt
   * @param wallet
   */
  async signTransaction(txt: Transaction, wallet: Wallet) {
    const signedTransaction = await wallet.signTransaction(txt);
    return signedTransaction.serialize();
  }

  static async getTokenAmount(anchorProgram: Program<AuctionHouseIDL>, account: PublicKey, mint: PublicKey): Promise<number> {
    let amount = 0;
    if (!mint.equals(WRAPPED_SOL_MINT)) {
      try {
        const token = await anchorProgram.provider.connection.getTokenAccountBalance(account)!;
        amount = token!.value!.uiAmount! * Math.pow(10, token.value.decimals);
      } catch (e) {
        console.error(e);
        console.info('Account ', account.toBase58(), 'didnt return value. Assuming 0 tokens.');
      }
    } else {
      amount = await anchorProgram.provider.connection.getBalance(account);
    }
    return amount;
  }
}

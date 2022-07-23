import { AUCTION_HOUSE_PROGRAM_ID, MINT_CONFIG } from './constants';
import { Metaplex, Nft } from '@metaplex-foundation/js';
import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house';
import { Commitment, Connection, PublicKey, Transaction, RpcResponseAndContext, SignatureResult, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { Program, Provider } from '@project-serum/anchor';
import type { Wallet } from '@project-serum/anchor';
import merge from 'lodash.merge';
import { getTokenTransactions, processCreatorShares, uploadNFTFileToStorage } from './utils';
import { MetadataObject } from './types';
import { AuctionHouseIDL, AuctionHouseProgramIDL } from './idl';

import { BidReceipt, ListingReceipt, PurchaseReceipt } from '@metaplex-foundation/mpl-auction-house/dist/src/generated/accounts';
import { mintNFT, MintNFTResponse } from './mint';
import { InsufficientBalanceError, programErrorHandler } from './errors';
import {
  createListingTransaction,
  createBuyTransaction,
  createCancelListingTransaction,
  createUpdateListingTransaction,
  createTransferInstruction,
} from './mirage-transactions';

import { throwError } from './errors/errors.interface';
import { getNftOwner } from './utils';

export interface IMirageOptions {
  auctionHouseAuthority: PublicKey;
  connection: Connection;
  wallet: Wallet;
  NFTStorageAPIKey: string;
  mintConfig?: {
    seller_fee_basis_points: number;
    mintRoyalties: number;
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
  auctionHouse?: PublicKey;
  _provider?: Provider;
  program?: Program<AuctionHouseProgramIDL>;
  connection: Connection;
  wallet: Wallet;
  NFTStorageAPIKey: string;
  mintConfig: IMirageOptions['mintConfig'];
  metaplex: Metaplex;
  constructor({ auctionHouseAuthority, connection, wallet, NFTStorageAPIKey, mintConfig: userMintConfig = MINT_CONFIG }: IMirageOptions) {
    this.auctionHouseAuthority = auctionHouseAuthority;
    this.connection = connection;
    this.wallet = wallet;
    this.mintConfig = merge(MINT_CONFIG, userMintConfig);
    this.NFTStorageAPIKey = NFTStorageAPIKey;
    this.metaplex = new Metaplex(connection);
    this.setup();
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
  async getAuctionHouseAddress(): Promise<[PublicKey, number]> {
    if (!this.auctionHouseAuthority) throw new Error('auctionHouseAuthority not provided');
    return AuctionHouseProgram.findAuctionHouseAddress(this.auctionHouseAuthority, new PublicKey('So11111111111111111111111111111111111111112'));
  }

  /** Loads provider instance */
  async getProvider(commitment: Commitment = 'processed'): Promise<Provider> {
    const wallet = this.wallet;
    return new Provider(this.connection, wallet, {
      preflightCommitment: commitment,
    });
  }

  /** Loads auctionhouse program */
  async loadAuctionHouseProgram(): Promise<Program<AuctionHouseProgramIDL>> {
    const provider = new Provider(this.connection!, this.wallet!, {
      preflightCommitment: 'recent',
    });
    return new Program(AuctionHouseIDL, AUCTION_HOUSE_PROGRAM_ID, provider);
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

    const estimatedCost = (await txt.getEstimatedFee(this.connection)) / LAMPORTS_PER_SOL;
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
    return createBuyTransaction(mint, listingPrice, buyerPublicKey, this.auctionHouse, this.program, connection);
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
    return createUpdateListingTransaction(
      mint,
      currentListingPrice,
      newListingPrice,
      sellerPublicKey,
      this.auctionHouse,
      this.program,
      auctionHouseAuthority,
      connection
    );
  }

  /**
   * Purchases an NFT that has been listed on sale
   * @param mint NFT mint address to be bought
   * @param _buyerPrice price at which NFT will be bought. This MUST match the selling price of the NFT
   */
  async buyToken(mint: string, _buyerPrice: number): Promise<readonly [RpcResponseAndContext<any>, ReceiptAddress, TransactionSignature]> {
    const buyerWallet = this.wallet;
    const [buyTxt, purchaseReceipt] = await this.createBuyTransaction(new PublicKey(mint), _buyerPrice, buyerWallet.publicKey);

    buyTxt.recentBlockhash = (await this.connection.getLatestBlockhash()).blockhash;
    buyTxt.feePayer = buyerWallet.publicKey;

    const estimatedCost = (await buyTxt.getEstimatedFee(this.connection)) / LAMPORTS_PER_SOL + Number(_buyerPrice);
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

    const estimatedCost = (await txt.getEstimatedFee(this.connection)) / LAMPORTS_PER_SOL;
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
    return createCancelListingTransaction(
      mint,
      currentListingPrice,
      sellerPublicKey,
      this.auctionHouse,
      this.program,
      auctionHouseAuthority,
      connection,
      __DANGEROUSLY_INSET_SELLER__
    );
  }
  /**
   * Cancels a listing for sell or buy instructions for an NFT
   * @param mint NFT mint address whose listing is to be cancelled
   * @param currentListingPrice price at which NFT was listed
   * @param tradeState optional: trade state address to cancel
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

    const estimatedCost = (await txt.getEstimatedFee(this.connection)) / LAMPORTS_PER_SOL;
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

    const ListingReceipt = await AuctionHouseProgram.accounts.ListingReceipt.fromAccountAddress(this.connection, receipt);
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
    return createTransferInstruction(mint, recipient, holderPublicKey, this.auctionHouse, auctionHouseAuthority, this.program, connection);
  }

  /**
   * Sends an NFT to a enw user.
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

    const estimatedCost = (await txt.getEstimatedFee(this.connection)) / LAMPORTS_PER_SOL;
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
   */
  async getTokenTransactions(mint: string | PublicKey): Promise<(TransactionReceipt | undefined)[]> {
    return getTokenTransactions(new PublicKey(mint), this.auctionHouse!, this.connection);
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
}

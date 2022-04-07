import {
  AUCTION_HOUSE_PROGRAM_ID,
  MINT_CONFIG,
  NFT_STORAGE_API_KEY,
} from './constants';
import { programs } from '@metaplex/js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token } from '@solana/spl-token';
import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house';
import {
  Commitment,
  Connection,
  Keypair,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
  TransactionInstruction,
  RpcResponseAndContext,
  SignatureResult,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { Program, Provider } from '@project-serum/anchor';
import type { Wallet } from '@project-serum/anchor';
import merge from 'lodash.merge';
import { decodeMetadata, Metadata as MetadataSchema } from './schema';
import {
  getAccountInfo,
  getAtaForMint,
  getMetadata,
  processCreatorShares,
  uploadNFTFileToStorage,
} from './utils';
import dayjs from 'dayjs';
import { SolanaNetwork, MetadataObject, AuctionHouse } from './types';
import { writeFileSync } from 'fs';
import { resolve } from 'path';

const {
  metadata: { Metadata },
} = programs;

import {
  CancelInstructionAccounts,
  CancelInstructionArgs,
  CancelListingReceiptInstructionAccounts,
  createCancelInstruction,
  createCancelListingReceiptInstruction,
  createExecuteSaleInstruction,
  ExecuteSaleInstructionAccounts,
  ExecuteSaleInstructionArgs,
  PrintBidReceiptInstructionAccounts,
  PrintBidReceiptInstructionArgs,
  PrintListingReceiptInstructionAccounts,
  PrintListingReceiptInstructionArgs,
  PrintPurchaseReceiptInstructionAccounts,
  PrintPurchaseReceiptInstructionArgs,
  PublicBuyInstructionAccounts,
  PublicBuyInstructionArgs,
  SellInstructionAccounts,
  SellInstructionArgs,
} from '@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions';

import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  BidReceipt,
  ListingReceipt,
  PurchaseReceipt,
} from '@metaplex-foundation/mpl-auction-house/dist/src/generated/accounts';
import { mintNFT, MintNFTResponse } from './mint';

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

export type ReceiptType =
  | 'purchase_receipt'
  | 'listing_receipt'
  | 'cancel_receipt'
  | 'cancel_listing_receipt'
  | 'bid_receipt'
  | 'cancel_bid_receipt';

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

const {
  createPrintBidReceiptInstruction,
  createPrintListingReceiptInstruction,
  createPrintPurchaseReceiptInstruction,
  createSellInstruction,
  createPublicBuyInstruction,
} = AuctionHouseProgram.instructions;

export class Mirage {
  auctionHouseAuthority: PublicKey;
  auctionHouse?: PublicKey;
  _provider?: Provider;
  program?: Program;
  connection: Connection;
  wallet: Wallet;
  NFTStorageAPIKey: string;
  mintConfig: IMirageOptions['mintConfig'];
  constructor({
    auctionHouseAuthority,
    connection,
    wallet,
    NFTStorageAPIKey,
    mintConfig: userMintConfig = MINT_CONFIG,
  }: IMirageOptions) {
    this.auctionHouseAuthority = auctionHouseAuthority;
    this.connection = connection;
    this.wallet = wallet;
    this.mintConfig = merge(MINT_CONFIG, userMintConfig);
    this.NFTStorageAPIKey = NFTStorageAPIKey;
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
  async getUserNfts(publicKey: PublicKey) {
    const nftsmetadata = await Metadata.findDataByOwner(
      this.connection,
      publicKey
    );
    return nftsmetadata;
  }

  /** Get single NFT by mint */
  async getNft(mintKey: PublicKey) {
    // const nftsmetadata = await Metadata.findByMint(this.connection, mintKey);
    const metadataPDA = await Metadata.getPDA(mintKey);
    const tokenMetadata = await Metadata.load(this.connection, metadataPDA);
    return tokenMetadata;
  }

  /** Gets the owner of an NFT */
  async getNftOwner(mint: string | PublicKey) {
    const largestAccounts = await this.connection.getTokenLargestAccounts(
      new PublicKey(mint)
    );
    const largestAccountInfo = await this.connection.getParsedAccountInfo(
      largestAccounts.value[0].address
    );
    /** @ts-expect-error "ParsedAccountInfo | Buffer" not typed correctly */
    const owner = largestAccountInfo.value.data.parsed.info.owner as string;
    console.log(`Owner of token ${mint.toString()} is ${owner}`);
    return [
      owner,
      new PublicKey(owner),
      largestAccountInfo.value!.data,
    ] as const;
  }

  /** Determines whether the client is the owner of the auctionhouse */
  get clientIsOwner() {
    return (
      this.auctionHouseAuthority.toBase58() === this.wallet.publicKey.toBase58()
    );
  }

  /** Get the auction house addresses by the owner */
  async getAuctionHouseAddress() {
    if (!this.auctionHouseAuthority)
      throw new Error('auctionHouseAuthority not provided');
    const result = await AuctionHouseProgram.findAuctionHouseAddress(
      this.auctionHouseAuthority,
      new PublicKey('So11111111111111111111111111111111111111112')
    );
    return result;
  }

  /** Loads provider instance */
  async getProvider(commitment: Commitment = 'processed') {
    const wallet = this.wallet;
    const provider = new Provider(this.connection, wallet, {
      preflightCommitment: commitment,
    });
    return provider;
  }

  /** Loads auctionhouse program */
  async loadAuctionHouseProgram() {
    const provider = new Provider(this.connection!, this.wallet!, {
      preflightCommitment: 'recent',
    });
    const idl = await Program.fetchIdl(AUCTION_HOUSE_PROGRAM_ID, provider);
    return new Program(idl!, AUCTION_HOUSE_PROGRAM_ID, provider);
  }

  /**
   * Lists an NFT for sale.
   * @param mint NFT mint address to be sold
   * @param listingPrice price at which NFT will be sold
   */
  async listToken(mint: string, _listingPrice: number) {
    const listingPrice = Number(_listingPrice) * LAMPORTS_PER_SOL;
    const sellerWallet = this.wallet;
    const _sellerPublicKey = sellerWallet.publicKey;

    // TODO: In the future may support NFT packs
    const tokenSize = 1;

    const _mint = new PublicKey(mint);

    if (this.wallet.publicKey.toBase58() !== _sellerPublicKey.toBase58()) {
      throw new Error('You cannot list an NFT you do not own');
    }

    console.log({
      _mint: _mint.toBase58(),
      _sellerPublicKey: _sellerPublicKey.toBase58(),
      listingPrice,
    });

    const auctionHouseObj = (await this.program!.account.auctionHouse.fetch(
      this.auctionHouse!
    )) as any as AuctionHouse;

    const nftMetadataAccount = await getMetadata(_mint);
    const [associatedTokenAccount] = await getAtaForMint(
      _mint,
      sellerWallet.publicKey
    );

    const [sellerTradeState, tradeStateBump] =
      await AuctionHouseProgram.findTradeStateAddress(
        sellerWallet.publicKey,
        this.auctionHouse!,
        associatedTokenAccount,
        auctionHouseObj.treasuryMint,
        _mint,
        listingPrice,
        1
      );

    const [freeTradeState, freeTradeBump] =
      await AuctionHouseProgram.findTradeStateAddress(
        sellerWallet.publicKey,
        this.auctionHouse!,
        associatedTokenAccount,
        auctionHouseObj.treasuryMint,
        _mint,
        0,
        1
      );

    const [receipt, receiptBump] =
      await AuctionHouseProgram.findListingReceiptAddress(sellerTradeState);

    console.log('[sellerTradeState, receipt]', [
      sellerTradeState.toBase58(),
      receipt.toBase58(),
    ]);

    const [programAsSigner, programAsSignerBump] =
      await AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress();

    const sellInstructionAccounts: SellInstructionAccounts = {
      auctionHouse: this.auctionHouse!,
      auctionHouseFeeAccount: new PublicKey(
        auctionHouseObj.auctionHouseFeeAccount
      ),
      authority: new PublicKey(auctionHouseObj.authority),
      wallet: sellerWallet.publicKey,
      metadata: nftMetadataAccount,
      tokenAccount: associatedTokenAccount,
      freeSellerTradeState: freeTradeState,
      sellerTradeState: sellerTradeState,
      programAsSigner,
    };

    const sellInstructionArgs: SellInstructionArgs = {
      buyerPrice: listingPrice,
      freeTradeStateBump: freeTradeBump,
      tradeStateBump,
      programAsSignerBump,
      tokenSize,
    };

    const sellInstruction = await createSellInstruction(
      sellInstructionAccounts,
      sellInstructionArgs
    );

    const printListingReceiptInstructionAccounts: PrintListingReceiptInstructionAccounts =
      {
        receipt,
        bookkeeper: sellerWallet.publicKey,
        instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
      };
    const printListingReceiptInstructionArgs: PrintListingReceiptInstructionArgs =
      {
        receiptBump,
      };

    const printListingReceiptInstruction = createPrintListingReceiptInstruction(
      printListingReceiptInstructionAccounts,
      printListingReceiptInstructionArgs
    );

    const txt = new Transaction();
    txt.add(sellInstruction).add(printListingReceiptInstruction);

    txt.recentBlockhash = (
      await this.connection.getLatestBlockhash()
    ).blockhash;
    txt.feePayer = sellerWallet.publicKey;

    let signed: Transaction | undefined = undefined;

    try {
      signed = await sellerWallet.signTransaction(txt);
    } catch (e: any) {
      console.error(e.message);
      return;
    }

    let signature: string | undefined = undefined;
    signature = await this.connection.sendRawTransaction(signed!.serialize());
    const result = await this.connection.confirmTransaction(
      signature,
      'confirmed'
    );

    console.log('result', result);
    console.log(
      'Successfully listed ',
      mint,
      ' at ',
      listingPrice / LAMPORTS_PER_SOL,
      ' SOL'
    );
    const ListingReceipt =
      await AuctionHouseProgram.accounts.ListingReceipt.fromAccountAddress(
        this.connection,
        receipt
      );
    return [result, ListingReceipt] as const;
  }

  /**
   * Purchases an NFT that has been listed on sale
   * @param mint NFT mint address to be bought
   * @param buyerPrice price at chich NFT will be bought. This MUST match the selling price of the NFT
   */
  async buyToken(mint: string, _buyerPrice: number) {
    const buyerPrice = Number(_buyerPrice) * LAMPORTS_PER_SOL;
    const _mint = new PublicKey(mint);
    const _buyerPublicKey = this.wallet.publicKey;
    const [sellerAddressAsString, _sellerPublicKey] = await this.getNftOwner(
      mint
    );

    if (this.wallet.publicKey.toBase58() === sellerAddressAsString) {
      throw new Error('You cannot buy your own NFT');
    }

    /** Limit token size to 1 */
    const tokenSize = 1;

    // User wallet.
    const buyerWallet = this.wallet;

    console.log({
      _mint: _mint.toBase58(),
      _sellerPublicKey: _buyerPublicKey.toBase58(),
      buyingPrice: buyerPrice,
    });

    const auctionHouseObj = (await this.program!.account.auctionHouse.fetch(
      this.auctionHouse!
    )) as any as AuctionHouse;

    const [escrowPaymentAccount, escrowPaymentBump] =
      await AuctionHouseProgram.findEscrowPaymentAccountAddress(
        this.auctionHouse!,
        buyerWallet.publicKey
      );

    const results =
      await this.program!.provider.connection.getTokenLargestAccounts(_mint);

    const metadata = await getMetadata(_mint);
    /**
     * Token account of the token to purchase,
     * This will default to finding the one with
     * highest balance (of NFTs)
     * */
    const tokenAccount = results.value[0].address;

    const [buyerTradeState, tradeStateBump] =
      await AuctionHouseProgram.findPublicBidTradeStateAddress(
        buyerWallet.publicKey,
        this.auctionHouse!,
        auctionHouseObj.treasuryMint,
        _mint,
        buyerPrice,
        tokenSize
      );

    const publicBuyInstructionAccounts: PublicBuyInstructionAccounts = {
      wallet: buyerWallet.publicKey,
      transferAuthority: buyerWallet.publicKey,
      paymentAccount: buyerWallet.publicKey,
      treasuryMint: auctionHouseObj.treasuryMint,
      tokenAccount,
      metadata,
      escrowPaymentAccount,
      authority: new PublicKey(auctionHouseObj.authority),
      auctionHouse: this.auctionHouse!,
      auctionHouseFeeAccount: new PublicKey(
        auctionHouseObj.auctionHouseFeeAccount
      ),
      buyerTradeState,
    };

    const publicBuyInstructionArgs: PublicBuyInstructionArgs = {
      buyerPrice,
      escrowPaymentBump,
      tokenSize,
      tradeStateBump,
    };

    const publicBuyInstruction = createPublicBuyInstruction(
      publicBuyInstructionAccounts,
      publicBuyInstructionArgs
    );

    const [associatedTokenAccount] = await getAtaForMint(
      _mint,
      _sellerPublicKey
    );

    const [sellerTradeState] = await AuctionHouseProgram.findTradeStateAddress(
      _sellerPublicKey,
      this.auctionHouse!,
      associatedTokenAccount,
      auctionHouseObj.treasuryMint,
      _mint,
      buyerPrice,
      1
    );

    const [freeTradeState, freeTradeStateBump] =
      await AuctionHouseProgram.findTradeStateAddress(
        _sellerPublicKey,
        this.auctionHouse!,
        tokenAccount,
        auctionHouseObj.treasuryMint,
        _mint,
        0,
        1
      );

    const [programAsSigner, programAsSignerBump] =
      await AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress();

    const [buyerReceiptTokenAccount] =
      await AuctionHouseProgram.findAssociatedTokenAccountAddress(
        _mint,
        buyerWallet.publicKey
      );

    const metadataObj = await this.program!.provider.connection.getAccountInfo(
      metadata
    );
    const metadataDecoded: MetadataSchema = decodeMetadata(
      Buffer.from(metadataObj!.data)
    );

    const creatorAccounts = metadataDecoded.data.creators!.map((c) => ({
      pubkey: new PublicKey(c.address),
      isWritable: true,
      isSigner: false,
    }));

    const executeSaleInstructionAccounts: ExecuteSaleInstructionAccounts = {
      buyer: buyerWallet.publicKey,
      seller: _sellerPublicKey,
      tokenAccount,
      tokenMint: _mint,
      metadata,
      auctionHouse: this.auctionHouse!,
      treasuryMint: auctionHouseObj.treasuryMint,
      authority: new PublicKey(auctionHouseObj.authority),
      auctionHouseFeeAccount: new PublicKey(
        auctionHouseObj.auctionHouseFeeAccount
      ),
      auctionHouseTreasury: new PublicKey(auctionHouseObj.auctionHouseTreasury),
      escrowPaymentAccount,
      programAsSigner,
      sellerPaymentReceiptAccount: _sellerPublicKey,
      buyerReceiptTokenAccount,
      buyerTradeState,
      sellerTradeState,
      freeTradeState,
    };

    const createExecuteSaleInstructionArgs: ExecuteSaleInstructionArgs = {
      escrowPaymentBump,
      freeTradeStateBump,
      programAsSignerBump,
      buyerPrice,
      tokenSize,
    };

    const _executeSaleInstruction = await createExecuteSaleInstruction(
      executeSaleInstructionAccounts,
      createExecuteSaleInstructionArgs
    );

    const [bidReceipt, bidReceiptBump] =
      await AuctionHouseProgram.findBidReceiptAddress(buyerTradeState);

    // Executing sale:
    console.log('===== EXECUTING SALE =====');

    console.log('[buyerTradeState, bidReceipt]', [
      buyerTradeState.toBase58(),
      bidReceipt.toBase58(),
    ]);
    const [purchaseReceipt, purchaseReceiptBump] =
      await AuctionHouseProgram.findPurchaseReceiptAddress(
        sellerTradeState,
        buyerTradeState
      );
    const [listingReceipt] =
      await AuctionHouseProgram.findListingReceiptAddress(sellerTradeState);

    console.log('[sellerTradeState, listingReceipt]', [
      sellerTradeState.toBase58(),
      listingReceipt.toBase58(),
    ]);

    const printBidReceiptInstructionAccounts: PrintBidReceiptInstructionAccounts =
      {
        bookkeeper: buyerWallet.publicKey,
        receipt: bidReceipt,
        instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
      };
    const printBidReceiptInstructionArgs: PrintBidReceiptInstructionArgs = {
      receiptBump: bidReceiptBump,
    };

    const printPurchaseReceiptInstructionAccounts: PrintPurchaseReceiptInstructionAccounts =
      {
        bookkeeper: buyerWallet.publicKey,
        purchaseReceipt,
        bidReceipt,
        listingReceipt,
        instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
      };
    const printPurchaseReceiptInstructionArgs: PrintPurchaseReceiptInstructionArgs =
      {
        purchaseReceiptBump,
      };

    const printBidReceiptInstruction = createPrintBidReceiptInstruction(
      printBidReceiptInstructionAccounts,
      printBidReceiptInstructionArgs
    );

    const printPurchaseReceiptInstruction =
      createPrintPurchaseReceiptInstruction(
        printPurchaseReceiptInstructionAccounts,
        printPurchaseReceiptInstructionArgs
      );

    const executeSaleInstruction = new TransactionInstruction({
      programId: AuctionHouseProgram.PUBKEY,
      data: _executeSaleInstruction.data,
      // @ts-ignore
      keys: [..._executeSaleInstruction.keys, ...creatorAccounts],
    });

    const buyTxt = new Transaction();
    buyTxt
      .add(publicBuyInstruction)
      .add(printBidReceiptInstruction)
      .add(executeSaleInstruction)
      .add(printPurchaseReceiptInstruction);

    buyTxt.recentBlockhash = (
      await this.connection.getLatestBlockhash()
    ).blockhash;
    buyTxt.feePayer = buyerWallet.publicKey;

    let signed: Transaction | undefined = undefined;

    try {
      signed = await buyerWallet.signTransaction(buyTxt);
    } catch (e: any) {
      console.error(e.message);
      return;
    }

    let signature: string | undefined = undefined;
    signature = await this.connection.sendRawTransaction(signed!.serialize());

    const result = await this.connection.confirmTransaction(
      signature,
      'confirmed'
    );

    console.log('result', result);
    console.log(
      'Successfully purchased ',
      mint,
      ' at ',
      buyerPrice / LAMPORTS_PER_SOL,
      ' SOL'
    );
    const PurchaseReceipt =
      await AuctionHouseProgram.accounts.PurchaseReceipt.fromAccountAddress(
        this.connection,
        purchaseReceipt
      );
    return [result, PurchaseReceipt] as const;
  }

  /**
   * Cancels a listing for sell or buy instructions for an NFT
   * @param mint NFT mint address whose listing is to be cancelled
   * @param buyerPrice price at which NFT was lsited
   */
  async cancelListing(mint: string, _buyerPrice: number) {
    const buyerPrice = Number(_buyerPrice) * LAMPORTS_PER_SOL;
    const _mint = new PublicKey(mint);
    const [sellerAddressAsString, _sellerPublicKey] = await this.getNftOwner(
      _mint
    );

    if (this.wallet.publicKey.toBase58() !== sellerAddressAsString) {
      throw new Error('You cannot cancel listing of an NFT you do not own');
    }

    const auctionHouseObj = (await this.program!.account.auctionHouse.fetch(
      this.auctionHouse!
    )) as any as AuctionHouse;

    const [associatedTokenAccount] = await getAtaForMint(
      _mint,
      _sellerPublicKey
    );

    const [sellerTradeState] = await AuctionHouseProgram.findTradeStateAddress(
      _sellerPublicKey,
      this.auctionHouse!,
      associatedTokenAccount,
      auctionHouseObj.treasuryMint,
      _mint,
      buyerPrice,
      1
    );

    const [listingReceipt] =
      await AuctionHouseProgram.findListingReceiptAddress(sellerTradeState);

    const auctionHouse = this.auctionHouse!;
    const authority = this.auctionHouseAuthority;
    const auctionHouseFeeAccount = new PublicKey(
      auctionHouseObj.auctionHouseFeeAccount
    );
    const treasuryMint = new PublicKey(auctionHouseObj.treasuryMint);
    const receipt = listingReceipt;

    const [tradeState] = await AuctionHouseProgram.findTradeStateAddress(
      this.wallet.publicKey,
      auctionHouse,
      associatedTokenAccount,
      treasuryMint,
      _mint,
      buyerPrice,
      1
    );

    const cancelInstructionAccounts: CancelInstructionAccounts = {
      wallet: this.wallet.publicKey,
      tokenAccount: associatedTokenAccount,
      tokenMint: _mint,
      authority,
      auctionHouse,
      auctionHouseFeeAccount,
      tradeState,
    };
    const cancelInstructionArgs: CancelInstructionArgs = {
      buyerPrice,
      tokenSize: 1,
    };

    const cancelListingReceiptAccounts: CancelListingReceiptInstructionAccounts =
      {
        receipt,
        instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
      };

    const cancelInstruction = await createCancelInstruction(
      cancelInstructionAccounts,
      cancelInstructionArgs
    );

    const cancelListingReceiptInstruction =
      createCancelListingReceiptInstruction(cancelListingReceiptAccounts);

    const txt = new Transaction();
    txt.add(cancelInstruction).add(cancelListingReceiptInstruction);

    txt.recentBlockhash = (
      await this.connection.getLatestBlockhash()
    ).blockhash;
    txt.feePayer = this.wallet.publicKey;

    let signed: Transaction | undefined = undefined;

    try {
      signed = await this.wallet.signTransaction(txt);
    } catch (e: any) {
      console.error(e.message);
      return;
    }

    let signature: string | undefined = undefined;
    console.info('Sending the transaction to Solana.');
    signature = await this.connection.sendRawTransaction(signed!.serialize());
    const result = await this.connection.confirmTransaction(
      signature,
      'confirmed'
    );

    console.log('result', result);
    console.log(
      'Successfully cancelled listing for mint ',
      mint,
      ' at ',
      buyerPrice / LAMPORTS_PER_SOL,
      ' SOL'
    );

    const ListingReceipt =
      await AuctionHouseProgram.accounts.ListingReceipt.fromAccountAddress(
        this.connection,
        receipt
      );
    console.log('listingReceiptObj', JSON.stringify(ListingReceipt, null, 2));
    return [result, ListingReceipt] as const;
  }

  /**
   * Sends an NFT to a enw user.
   * @param mint NFT mint address to transfer to a new user
   * @param recipient Recipient's publicKey
   */
  async transferNft(
    mint: string | PublicKey,
    recipient: string | PublicKey
  ): Promise<RpcResponseAndContext<SignatureResult>> {
    const _mint = new PublicKey(mint);
    const _recipient = new PublicKey(recipient);

    const txt = new Transaction();

    const [senderAddress, sender, nft] = await this.getNftOwner(mint);

    if (this.wallet.publicKey.toBase58() !== senderAddress) {
      throw new Error('You cannot list an NFT you do not own');
    }

    const senderAta = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      _mint,
      sender
    );

    const recipientAta = await Token.getAssociatedTokenAddress(
      ASSOCIATED_TOKEN_PROGRAM_ID,
      TOKEN_PROGRAM_ID,
      _mint,
      _recipient
    );

    console.log('recipient  Associated Token Account', recipientAta);

    try {
      // Here we attempt to get the account information
      // for the user's ATA. If the account information
      // is retrievable, we do nothing. However if it is not
      // it will throw a "TokenAccountNotFoundError".
      // This means that the recipient's token account has not
      // yet been initialized on-chain.
      await getAccountInfo(this.connection, recipientAta);
    } catch (error: any) {
      if (error.message === 'TokenAccountNotFoundError') {
        console.log(
          'Token Account not previously initialized. Creating Associated Token Account Instruction'
        );
        const createAtaInstruction =
          await Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            _mint,
            recipientAta,
            _recipient,
            this.wallet.publicKey
          );

        txt.add(createAtaInstruction);
      }
    }
    const transferNftInstruction = await Token.createTransferInstruction(
      TOKEN_PROGRAM_ID,
      senderAta,
      recipientAta,
      sender,
      [],
      1
    );

    txt.add(transferNftInstruction);

    txt.recentBlockhash = (
      await this.connection.getLatestBlockhash()
    ).blockhash;
    txt.feePayer = this.wallet.publicKey;

    let signed: Transaction | undefined = undefined;

    try {
      signed = await this.wallet.signTransaction(txt);
    } catch (e: any) {
      console.error(e.message);
    }

    let signature: string | undefined = undefined;
    console.info('Sending the transaction to Solana.');
    signature = await this.connection.sendRawTransaction(signed!.serialize());
    const result = await this.connection.confirmTransaction(
      signature,
      'confirmed'
    );

    console.log('result', result);
    console.log(
      'Successfully transferred nft ',
      mint,
      ' from ',
      this.wallet.publicKey.toBase58(),
      ' to ',
      _recipient.toBase58()
    );
    return result;
  }

  /**
   * Mints a new NFT on Solana. There are 2 approaches to using this function.
   * 1. If you already have your files uploaded to the blockchain, then there is no
   *    need to perform a new upload. Simply provide the necessary metadata URI / tokenURI.
   * 2. If you choose to provide a file/image/video for your NFT, then it will be uploaded
   *    to a decentralized storage service before minting.
   * @param metadata Object for metadata according to Metaplex NFT standard. @see https://docs.metaplex.com/token-metadata/specification#full-metadata-struct
   * @param metadataLink URL for your token metadata. If provided, then upload is ignored.
   */
  async mintNft(metadata: MetadataObject, metadataLink?: string, file?: File) {
    if (!metadata && !metadataLink)
      throw new Error('Expected metadata object or metadataURL to mint an NFT');

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
      const [metadataUrl] = await uploadNFTFileToStorage(
        null,
        finalMetadata,
        undefined,
        this.NFTStorageAPIKey
      );
      console.log('Uploaded metadata to:', metadataUrl);
      // const tokenAccount = await getAtaForMint()
      const mintNftResponse = await mintNFT({
        connection: this.connection,
        wallet: this.wallet,
        uri: metadataUrl,
        maxSupply: 1,
        updateAuthority: this.auctionHouseAuthority!,
      });
      _metadata = mintNftResponse;
    } else {
      const mintNftResponse = await mintNFT({
        connection: this.connection,
        wallet: this.wallet,
        uri: metadataLink,
        maxSupply: 1,
        updateAuthority: this.auctionHouseAuthority!,
      });
      _metadata = mintNftResponse;
    }

    /** Wait for one more second before loading new metadata */

    const nftMetadata = await Metadata.findByMint(
      this.connection,
      _metadata.mint
    );
    return nftMetadata;
  }

  async getTokenTransactions(
    mint: string | PublicKey
  ): Promise<(TransactionReceipt | undefined)[]> {
    const _mint = new PublicKey(mint);
    const metadata = await Metadata.findByMint(this.connection, _mint);
    /**
     * Allocated data size on auction_house program per PDA type
     * CreateAuctionHouse: 459
     * PrintListingReceipt: 236
     * PrintBidReceipt: 269
     * PrintPurchaseReceipt: 193
     */

    const PrintListingReceiptSize = 236;
    const PrintBidReceiptSize = 269;
    const PrintPurchaseReceiptSize = 193;

    const ReceiptAccountSizes = [
      PrintListingReceiptSize,
      PrintBidReceiptSize,
      PrintPurchaseReceiptSize,
    ] as const;

    const ReceiptAccounts = await ReceiptAccountSizes.map(async (size) => {
      const accounts = await this.connection.getProgramAccounts(
        AUCTION_HOUSE_PROGRAM_ID,
        {
          commitment: 'confirmed',
          filters: [
            {
              dataSize: size,
            },
          ],
        }
      );
      const parsedAccounts = await accounts.map(async (account) => {
        switch (size) {
          case PrintListingReceiptSize:
            const [ListingReceipt] =
              await AuctionHouseProgram.accounts.ListingReceipt.fromAccountInfo(
                account.account
              );
            return {
              ...ListingReceipt,
              receipt_type: ListingReceipt.canceledAt
                ? 'cancel_listing_receipt'
                : 'listing_receipt',
            } as TransactionReceipt;
            break;
          case PrintBidReceiptSize:
            const [BidReceipt] =
              await AuctionHouseProgram.accounts.BidReceipt.fromAccountInfo(
                account.account
              );
            return {
              ...BidReceipt,
              receipt_type: 'bid_receipt',
            } as TransactionReceipt;
            break;
          case PrintPurchaseReceiptSize:
            const [PurchaseReceipt] =
              await AuctionHouseProgram.accounts.PurchaseReceipt.fromAccountInfo(
                account.account
              );
            return {
              ...PurchaseReceipt,
              receipt_type: 'purchase_receipt',
            } as TransactionReceipt;
          default:
            return undefined;
            break;
        }
      });
      return await Promise.all(parsedAccounts);
    });

    const result = await (
      await Promise.all(ReceiptAccounts)
    )
      .flat()
      .filter(
        (receipt) =>
          !!receipt &&
          receipt.metadata.toBase58() === metadata.pubkey.toBase58()
      )
      .map((receipt) => ({
        ...receipt!,
        /** @ts-ignore */
        tokenSize: receipt.tokenSize.toNumber(),
        /** @ts-ignore */
        price: receipt.price.toNumber() / LAMPORTS_PER_SOL,
        /** @ts-ignore */
        createdAt: dayjs.unix(receipt.createdAt.toNumber()).toDate().getTime(),
        cancelledAt: dayjs
          /** @ts-ignore */
          .unix(receipt.canceledAt?.toNumber?.())
          .toDate()
          .getTime(),
      }))
      .filter(
        (receipt) =>
          receipt.auctionHouse.toBase58() === this.auctionHouse!.toBase58()
      )
      .sort((a, b) => {
        if (
          (a.receipt_type === 'bid_receipt',
          b.receipt_type === 'purchase_receipt')
        ) {
          return 1;
        } else if (
          (a.receipt_type === 'purchase_receipt',
          b.receipt_type === 'bid_receipt')
        ) {
          return -1;
        } else {
          return 0;
        }
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    console.log('result', result);
    return result;
  }
}

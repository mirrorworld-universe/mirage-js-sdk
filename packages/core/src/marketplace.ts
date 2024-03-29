import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@project-serum/anchor';
import { AUCTION_HOUSE_PROGRAM_ID } from './constants';
import { throwError } from './errors/errors.interface';
import {
  createBuyTransaction,
  createCancelListingTransaction,
  createListingTransaction,
  createTransferInstruction,
  createUpdateListingTransaction,
} from './mirage-transactions';
import { NATIVE_MINT } from '@solana/spl-token';
import { AuctionHouse } from './types';
import { Mirage } from './mirage';
import { createCreateMarketplaceTransaction, CreateMarketplaceOptions } from './mirage-transactions/create-marketplace';
import { createUpdateMarketplaceTransaction, UpdateMarketplaceOptions } from './mirage-transactions/update-marketplace';
import { getStoreFrontConfig, StoreFrontOptions } from './mirage-transactions/store-front';
import { getAuctionHouseBalance, withdrawFees } from './mirage-transactions/treasury';
import { AuctionHouseIDL, IDL } from './auctionHouseIdl';
import * as auctionUtils from './auctionUtils';

export type IAuctionOptions = {
  connection: Connection;
  wallet: Wallet;
};

export type Receipt = PublicKey;

export class Marketplace {
  connection: Connection;
  wallet: Wallet;
  program?: Program<AuctionHouseIDL>;

  constructor({ connection, wallet }: IAuctionOptions) {
    this.wallet = wallet;
    this.connection = connection;
    this.setup().then();
  }

  async setup() {
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
  }

  /** Loads Auction House program */
  async loadAuctionHouseProgram(): Promise<Program<AuctionHouseIDL>> {
    const provider = new AnchorProvider(this.connection!, this.wallet!, {
      preflightCommitment: 'recent',
    });
    return new Program(IDL, AUCTION_HOUSE_PROGRAM_ID, provider);
  }

  async getAuctionHouseAddress(authority: PublicKey, treasuryMint?: PublicKey) {
    return auctionUtils.getAuctionHouseAddress(authority, treasuryMint || NATIVE_MINT);
  }

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

  async getStoreFrontConfiguration(
    auctionHouseAuthority: CreateMarketplaceOptions['owner'],
    storeFrontOptions: StoreFrontOptions,
    treasuryMints: CreateMarketplaceOptions['treasuryMint'][]
  ) {
    return getStoreFrontConfig(auctionHouseAuthority, storeFrontOptions, treasuryMints);
  }

  async createCreateMarketplaceTransaction(
    auctionHouseAuthority: CreateMarketplaceOptions['owner'],
    sellerFeeBasisPoints: CreateMarketplaceOptions['sellerFeeBasisPoints'],
    treasuryMint?: CreateMarketplaceOptions['treasuryMint'],
    feeWithdrawalDestination?: CreateMarketplaceOptions['feeWithdrawalDestination'],
    treasuryWithdrawalDestination?: CreateMarketplaceOptions['treasuryWithdrawalDestination'],
    requiresSignOff?: CreateMarketplaceOptions['requiresSignOff'],
    canChangeSalePrice?: CreateMarketplaceOptions['canChangeSalePrice'],
    feePayer?: PublicKey,
    storeFrontUrl?: string
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

  async getMarketplaceFeeBalance(auctionHouseAddress: PublicKey): Promise<number> {
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
    if (!this.program) {
      throwError('PROGRAM_NOT_INITIALIZED');
    }

    return getAuctionHouseBalance(auctionHouseAddress, this.program, this.connection);
  }

  async withdrawMarketplaceFees(amount: number, auctionHouseAddress: PublicKey, royaltyBasePoints: number, royaltyReceiver: PublicKey): Promise<Transaction> {
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
    if (!this.program) {
      throwError('PROGRAM_NOT_INITIALIZED');
    }

    return withdrawFees(amount, auctionHouseAddress, royaltyBasePoints, royaltyReceiver, this.program, this.connection);
  }

  async createTransferTransaction(userWallet: PublicKey, mint: PublicKey, recipient: PublicKey): Promise<Transaction> {
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
    if (!this.program) {
      throwError('PROGRAM_NOT_INITIALIZED');
    }

    return createTransferInstruction(mint, recipient, userWallet, this.connection);
  }

  async createListTransaction(
    userWallet: PublicKey,
    mint: PublicKey,
    listingPrice: number,
    auctionHouseAddress: PublicKey
  ): Promise<readonly [Transaction, Receipt]> {
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
    if (!this.program) {
      throwError('PROGRAM_NOT_INITIALIZED');
    }

    return createListingTransaction(mint, listingPrice, userWallet, auctionHouseAddress, this.program);
  }

  async createBuyTransaction(
    userWallet: PublicKey,
    mint: PublicKey,
    listingPrice: number,
    seller: PublicKey,
    auctionHouseAddress: PublicKey
  ): Promise<readonly [Transaction, Receipt, Keypair[]]> {
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
    if (!this.program) {
      throwError('PROGRAM_NOT_INITIALIZED');
    }

    return createBuyTransaction(mint, listingPrice, userWallet, seller, auctionHouseAddress, this.program, this.connection);
  }

  async createUpdateListingTransaction(
    userWallet: PublicKey,
    mint: PublicKey,
    currentListingPrice: number,
    newListingPrice: number,
    auctionHouseAddress: PublicKey
  ): Promise<readonly [Transaction, Receipt]> {
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
    if (!this.program) {
      throwError('PROGRAM_NOT_INITIALIZED');
    }

    return createUpdateListingTransaction(mint, currentListingPrice, newListingPrice, userWallet, auctionHouseAddress, this.program, this.connection);
  }

  async createCancelListingTransaction(
    userWallet: PublicKey,
    mint: PublicKey,
    currentListingPrice: number,
    auctionHouseAddress: PublicKey
  ): Promise<readonly [Transaction, Receipt]> {
    if (!this.program) {
      this.program = await this.loadAuctionHouseProgram();
    }
    if (!this.program) {
      throwError('PROGRAM_NOT_INITIALIZED');
    }

    return createCancelListingTransaction(mint, currentListingPrice, userWallet, auctionHouseAddress, this.program, this.connection);
  }
}

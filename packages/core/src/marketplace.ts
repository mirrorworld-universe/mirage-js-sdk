import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { Program, Provider, Wallet } from '@project-serum/anchor';
import { AuctionHouseIDL, AuctionHouseProgramIDL } from './idl';
import { AUCTION_HOUSE_PROGRAM_ID } from './constants';
import { throwError } from './errors/errors.interface';
import {
  createBuyTransaction,
  createCancelListingTransaction,
  createListingTransaction,
  createTransferInstruction,
  createUpdateListingTransaction,
} from './mirage-transactions';
import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house';
import { NATIVE_MINT } from '@solana/spl-token';
import { AuctionHouse } from './types';
import { Mirage } from './mirage';

export type IAuctionOptions = {
  connection: Connection;
  wallet: Wallet;
};

export type Receipt = PublicKey;

export class Marketplace {
  connection: Connection;
  wallet: Wallet;
  program?: Program<AuctionHouseProgramIDL>;

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

  /** Loads auctionhouse program */
  async loadAuctionHouseProgram(): Promise<Program<AuctionHouseProgramIDL>> {
    const provider = new Provider(this.connection!, this.wallet!, {
      preflightCommitment: 'recent',
    });
    return new Program(AuctionHouseIDL, AUCTION_HOUSE_PROGRAM_ID, provider);
  }

  async getAuctionHouseAddress(authority: PublicKey, treasuryMint?: PublicKey) {
    return AuctionHouseProgram.findAuctionHouseAddress(authority, treasuryMint || NATIVE_MINT);
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
  ): Promise<readonly [Transaction, Receipt]> {
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

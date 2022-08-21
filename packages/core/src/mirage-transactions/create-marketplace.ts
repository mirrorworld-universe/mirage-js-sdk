import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house';
import {
  CreateAuctionHouseInstructionAccounts,
  CreateAuctionHouseInstructionArgs,
} from '@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions';
import { PublicKey, Transaction } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { WRAPPED_SOL_MINT } from '../constants';
import merge from 'lodash.merge';

export interface CreateMarketplaceOptions {
  /**
   * The public address that is the owner
   * of the marketplace/auction-house.
   *
   * This account also serves as the marketplace authority.
   */
  owner: PublicKey;
  /**
   * Trading currency of the marketplace. If this is not provided,
   * then we default to SOL.
   *
   * @default new PublicKey("So11111111111111111111111111111111111111112")
   */
  treasuryMint?: PublicKey;
  /**
   * This public key is the account to which withdrawal funds will be
   * transferred to when the marketplace owner withdraws the funds.
   *
   * If this is not provided, it defaults to the marketplace owner
   */
  feeWithdrawalDestination?: PublicKey;
  /**
   * This is the marketplace commission defined by the marketplace. For every transaction,
   * a percentage equal to the seller fee basis points of the transaction value will
   * be transferred to the marketplace fee account.
   * @required
   */
  sellerFeeBasisPoints: number;
  treasuryWithdrawalDestination?: PublicKey;
  /**
   * Determines whether the marketplace authority can change the
   * sale price or not.
   *
   * @default false
   */
  requiresSignOff?: boolean;
  /**
   * Determines whether a marketplace authority can change the
   * sale price or not.
   *
   * @default false
   */
  canChangeSalePrice?: boolean;
}

export interface CreateMarketplaceActionOptions extends Omit<CreateMarketplaceOptions, 'owner'> {}

const createMarketplaceDefaultOptions: Pick<CreateMarketplaceOptions, 'treasuryMint' | 'requiresSignOff' | 'canChangeSalePrice'> = {
  treasuryMint: WRAPPED_SOL_MINT,
  requiresSignOff: false,
  canChangeSalePrice: true,
};

export async function createCreateMarketplaceTransaction(createMarketplaceOptions: CreateMarketplaceOptions, feePayer?: PublicKey) {
  const txt = new Transaction();

  const mergedOptions = merge(createMarketplaceDefaultOptions, createMarketplaceOptions) as CreateMarketplaceOptions & {
    treasuryMint: PublicKey;
    requiresSignOff: boolean;
    canChangeSalePrice: boolean;
  };
  const treasuryMint = mergedOptions.treasuryMint;
  const feeWithdrawalDestination = mergedOptions.feeWithdrawalDestination || mergedOptions.owner;
  const treasuryWithdrawalDestinationOwner = mergedOptions.treasuryWithdrawalDestination || mergedOptions.owner;
  const [auctionHouse, auctionHouseBump] = await AuctionHouseProgram.findAuctionHouseAddress(mergedOptions.owner, mergedOptions.treasuryMint);
  const [auctionHouseFeeAccount, auctionHouseFeeAccountBump] = await AuctionHouseProgram.findAuctionHouseFeeAddress(auctionHouse);
  const [auctionHouseTreasury, auctionHouseTreasuryBump] = await AuctionHouseProgram.findAuctionHouseTreasuryAddress(auctionHouse);

  // If the treasuryMint is SOL, we shall set the destination account as the
  // user provided account.
  //
  // Otherwise we should compute the ATA for the treasuryMint
  // for the destination account.
  const treasuryWithdrawalDestination = treasuryMint.equals(WRAPPED_SOL_MINT)
    ? treasuryWithdrawalDestinationOwner
    : await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mergedOptions.treasuryMint, treasuryWithdrawalDestinationOwner);

  const accounts: CreateAuctionHouseInstructionAccounts = {
    auctionHouse,
    auctionHouseFeeAccount,
    treasuryMint,
    auctionHouseTreasury,
    feeWithdrawalDestination,
    authority: mergedOptions.owner,
    payer: feePayer || mergedOptions.owner,
    treasuryWithdrawalDestination,
    treasuryWithdrawalDestinationOwner,
  };
  const args: CreateAuctionHouseInstructionArgs = {
    bump: auctionHouseBump,
    feePayerBump: auctionHouseFeeAccountBump,
    treasuryBump: auctionHouseTreasuryBump,
    requiresSignOff: mergedOptions.requiresSignOff,
    canChangeSalePrice: mergedOptions.canChangeSalePrice,
    sellerFeeBasisPoints: mergedOptions.sellerFeeBasisPoints,
  };
  const createAuctionHouseInstruction = await AuctionHouseProgram.instructions.createCreateAuctionHouseInstruction(accounts, args);
  txt.add(createAuctionHouseInstruction);
  return txt;
}

import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house';
import {
  UpdateAuctionHouseInstructionAccounts,
  UpdateAuctionHouseInstructionArgs,
} from '@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions';
import { PublicKey, Transaction } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { WRAPPED_SOL_MINT } from '../constants';
import merge from 'lodash.merge';

export interface UpdateMarketplaceOptions {
  /**
   * The public address that is the owner
   * of the marketplace/auction-house.
   *
   * This account also serves as the marketplace authority.
   */
  authority: PublicKey;
  /**
   * The public address of the new marketplace authority
   * Transferring this will transfer the authority of the marketplace to this address.
   */
  newAuthority?: PublicKey;
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

export interface CreateMarketplaceActionOptions extends Omit<UpdateMarketplaceOptions, 'authority'> {}

const createMarketplaceDefaultOptions: Pick<UpdateMarketplaceOptions, 'treasuryMint' | 'requiresSignOff' | 'canChangeSalePrice'> = {
  treasuryMint: WRAPPED_SOL_MINT,
  requiresSignOff: false,
  canChangeSalePrice: true,
};

export async function createUpdateMarketplaceTransaction(updateMarketplaceOptions: UpdateMarketplaceOptions, feePayer?: PublicKey) {
  const txt = new Transaction();

  const mergedOptions = merge(createMarketplaceDefaultOptions, updateMarketplaceOptions) as UpdateMarketplaceOptions & {
    treasuryMint: PublicKey;
    requiresSignOff: boolean;
    canChangeSalePrice: boolean;
  };
  const treasuryMint = mergedOptions.treasuryMint;
  const feeWithdrawalDestination = mergedOptions.feeWithdrawalDestination || mergedOptions.authority;
  const treasuryWithdrawalDestinationOwner = mergedOptions.treasuryWithdrawalDestination || mergedOptions.authority;
  const [auctionHouse] = await AuctionHouseProgram.findAuctionHouseAddress(mergedOptions.authority, mergedOptions.treasuryMint);

  // If the treasuryMint is SOL, we shall set the destination account as the
  // user provided account.
  //
  // Otherwise we should compute the ATA for the treasuryMint
  // for the destination account.
  const treasuryWithdrawalDestination = treasuryMint.equals(WRAPPED_SOL_MINT)
    ? treasuryWithdrawalDestinationOwner
    : await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, mergedOptions.treasuryMint, treasuryWithdrawalDestinationOwner);
  const newAuthority = mergedOptions.newAuthority || mergedOptions.authority;

  const accounts: UpdateAuctionHouseInstructionAccounts = {
    auctionHouse,
    newAuthority,
    treasuryMint,
    feeWithdrawalDestination,
    authority: mergedOptions.authority,
    payer: feePayer || mergedOptions.authority,
    treasuryWithdrawalDestination,
    treasuryWithdrawalDestinationOwner,
  };

  const args: UpdateAuctionHouseInstructionArgs = {
    requiresSignOff: mergedOptions.requiresSignOff,
    canChangeSalePrice: mergedOptions.canChangeSalePrice,
    sellerFeeBasisPoints: mergedOptions.sellerFeeBasisPoints,
  };
  const createAuctionHouseInstruction = await AuctionHouseProgram.instructions.createUpdateAuctionHouseInstruction(accounts, args);
  txt.add(createAuctionHouseInstruction);
  return txt;
}

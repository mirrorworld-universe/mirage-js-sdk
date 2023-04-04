import { Connection, LAMPORTS_PER_SOL, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction } from '@solana/web3.js';
import { AuctionHouse } from '../types';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  CancelInstructionAccounts,
  CancelInstructionArgs,
  CancelListingReceiptInstructionAccounts,
  createCancelInstruction,
  createCancelListingReceiptInstruction,
} from '@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions';

import type { Program } from '@project-serum/anchor';
import { AuctionHouseIDL } from '../auctionHouseIdl';
import { getListReceiptAddress, getSellerTradeState } from '../auctionUtils';

/**
 * Create Cancel Listing Transaction
 * @param mint
 * @param currentListingPrice
 * @param sellerPublicKey
 * @param auctionHouse
 * @param connection
 * @param program
 */
export async function createCancelListingTransaction(
  mint: PublicKey,
  currentListingPrice: number,
  sellerPublicKey: PublicKey,
  auctionHouse: PublicKey,
  program: Program<AuctionHouseIDL>,
  connection: Connection
) {
  const buyerPrice = Number(currentListingPrice) * LAMPORTS_PER_SOL;
  const _mint = new PublicKey(mint);

  const auctionHouseObj = (await program.account.auctionHouse.fetch(auctionHouse)) as any as AuctionHouse;

  console.log('Processing cancel listing');
  let sellerTradeState;
  const associatedTokenAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, _mint, sellerPublicKey);
  [sellerTradeState] = getSellerTradeState(auctionHouse, sellerPublicKey, associatedTokenAccount, auctionHouseObj.treasuryMint, _mint, buyerPrice, 1);
  const [listingReceipt] = getListReceiptAddress(sellerTradeState);

  const authority = new PublicKey(auctionHouseObj.authority);
  const auctionHouseFeeAccount = new PublicKey(auctionHouseObj.auctionHouseFeeAccount);
  const receipt = listingReceipt;

  const cancelInstructionAccounts: CancelInstructionAccounts = {
    wallet: sellerPublicKey,
    tokenAccount: associatedTokenAccount,
    tokenMint: _mint,
    authority,
    auctionHouse,
    auctionHouseFeeAccount,
    tradeState: sellerTradeState,
  };
  const cancelInstructionArgs: CancelInstructionArgs = {
    buyerPrice,
    tokenSize: 1,
  };

  const cancelListingReceiptAccounts: CancelListingReceiptInstructionAccounts = {
    receipt,
    instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
  };

  const cancelInstruction = await createCancelInstruction(cancelInstructionAccounts, cancelInstructionArgs);

  const cancelListingReceiptInstruction = createCancelListingReceiptInstruction(cancelListingReceiptAccounts);

  const transaction = new Transaction();
  transaction.add(cancelInstruction).add(cancelListingReceiptInstruction);

  return [transaction, receipt] as const;
}

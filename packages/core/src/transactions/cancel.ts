import { Connection, LAMPORTS_PER_SOL, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction } from '@solana/web3.js';
import { AuctionHouse } from '../types';
import { getAtaForMint } from '../utils';
import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house';
import {
  CancelInstructionAccounts,
  CancelInstructionArgs,
  CancelListingReceiptInstructionAccounts,
  createCancelInstruction,
  createCancelListingReceiptInstruction,
} from '@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions';

import type { Program } from '@project-serum/anchor';
import { AuctionHouseProgramIDL } from '../idl';

import { getNftOwner } from '../utils';

/**
 * Create Cancel Listing Transaction
 * @param mint
 * @param currentListingPrice
 * @param sellerPublicKey
 * @param auctionHouse
 * @param connection
 * @param auctionHouseAuthority
 * @param program
 * @param __DANGEROUSLY_INSET_SELLER__
 */
export async function createCancelListingTransaction(
  mint: PublicKey,
  currentListingPrice: number,
  sellerPublicKey: PublicKey,
  auctionHouse: PublicKey,
  program: Program<AuctionHouseProgramIDL>,
  auctionHouseAuthority: PublicKey,
  connection: Connection,
  __DANGEROUSLY_INSET_SELLER__?: string
) {
  const buyerPrice = Number(currentListingPrice) * LAMPORTS_PER_SOL;
  const _mint = new PublicKey(mint);
  const [sellerAddressAsString, _sellerPublicKey] = await getNftOwner(_mint, connection);

  if (sellerPublicKey.toBase58() !== sellerAddressAsString) {
    throw new Error('You cannot cancel listing of an NFT you do not own.');
  }

  const auctionHouseObj = (await program.account.auctionHouse.fetch(auctionHouse!)) as any as AuctionHouse;

  let sellerTradeState;
  let associatedTokenAccount;
  if (__DANGEROUSLY_INSET_SELLER__) {
    console.warn('DANGEROUSLY INSETTING SELLER', __DANGEROUSLY_INSET_SELLER__);
    // Only for manual cancellations of listings by the
    // auctionhouse authority
    // !!! DANGEROUS !!! This action should only be performed by the auctionhouse authority
    const DANGEROUS_SELLER = new PublicKey(__DANGEROUSLY_INSET_SELLER__);
    [associatedTokenAccount] = await getAtaForMint(_mint, DANGEROUS_SELLER);
    [sellerTradeState] = await AuctionHouseProgram.findTradeStateAddress(
      DANGEROUS_SELLER,
      auctionHouse,
      associatedTokenAccount,
      auctionHouseObj.treasuryMint,
      _mint,
      buyerPrice,
      1
    );
  } else {
    console.log('Processing cancel listing');
    [associatedTokenAccount] = await getAtaForMint(_mint, _sellerPublicKey);
    [sellerTradeState] = await AuctionHouseProgram.findTradeStateAddress(
      _sellerPublicKey,
      auctionHouse!,
      associatedTokenAccount,
      auctionHouseObj.treasuryMint,
      _mint,
      buyerPrice,
      1
    );
  }

  const [listingReceipt] = await AuctionHouseProgram.findListingReceiptAddress(sellerTradeState);

  const authority = auctionHouseAuthority;
  const auctionHouseFeeAccount = new PublicKey(auctionHouseObj.auctionHouseFeeAccount);
  const receipt = listingReceipt;

  const cancelInstructionAccounts: CancelInstructionAccounts = {
    wallet: __DANGEROUSLY_INSET_SELLER__ ? new PublicKey(__DANGEROUSLY_INSET_SELLER__) : sellerPublicKey,
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

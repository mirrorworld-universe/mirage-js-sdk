import { Keypair, LAMPORTS_PER_SOL, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction } from '@solana/web3.js';
import { AuctionHouse } from '../types';
import { getAtaForMint, getMetadata } from '../utils';
import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house';
import {
  PrintListingReceiptInstructionAccounts,
  PrintListingReceiptInstructionArgs,
  SellInstructionAccounts,
  SellInstructionArgs,
} from '@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions';

import type { Program, Wallet } from '@project-serum/anchor';
import { AuctionHouseProgramIDL } from '../idl';

const { createPrintListingReceiptInstruction, createSellInstruction } = AuctionHouseProgram.instructions;

/**
 * Create List Transaction
 * @param mint
 * @param listingPrice
 * @param sellerPublicKey
 * @param auctionHouse
 * @param program
 */
export async function createListTransaction(
  mint: PublicKey,
  listingPrice: number,
  sellerPublicKey: PublicKey,
  auctionHouse: PublicKey,
  program: Program<AuctionHouseProgramIDL>
) {
  const _listingPrice = Number(listingPrice) * LAMPORTS_PER_SOL;
  const tokenSize = 1;
  const auctionHouseObj = (await program!.account.auctionHouse.fetch(auctionHouse!)) as any as AuctionHouse;

  const nftMetadataAccount = await getMetadata(mint);
  const [associatedTokenAccount] = await getAtaForMint(mint, sellerPublicKey);

  const [sellerTradeState, tradeStateBump] = await AuctionHouseProgram.findTradeStateAddress(
    sellerPublicKey,
    auctionHouse!,
    associatedTokenAccount,
    auctionHouseObj.treasuryMint,
    mint,
    _listingPrice,
    1
  );

  const [freeTradeState, freeTradeBump] = await AuctionHouseProgram.findTradeStateAddress(
    sellerPublicKey,
    auctionHouse!,
    associatedTokenAccount,
    auctionHouseObj.treasuryMint,
    mint,
    0,
    1
  );

  const [receipt, receiptBump] = await AuctionHouseProgram.findListingReceiptAddress(sellerTradeState);

  console.debug('[sellerTradeState, receipt]', [sellerTradeState.toBase58(), receipt.toBase58()]);

  const [programAsSigner, programAsSignerBump] = await AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress();

  const sellInstructionAccounts: SellInstructionAccounts = {
    auctionHouse: auctionHouse!,
    auctionHouseFeeAccount: new PublicKey(auctionHouseObj.auctionHouseFeeAccount),
    authority: new PublicKey(auctionHouseObj.authority),
    wallet: sellerPublicKey,
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

  const sellInstruction = await createSellInstruction(sellInstructionAccounts, sellInstructionArgs);

  const printListingReceiptInstructionAccounts: PrintListingReceiptInstructionAccounts = {
    receipt,
    bookkeeper: sellerPublicKey,
    instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
  };
  const printListingReceiptInstructionArgs: PrintListingReceiptInstructionArgs = {
    receiptBump,
  };

  const printListingReceiptInstruction = createPrintListingReceiptInstruction(printListingReceiptInstructionAccounts, printListingReceiptInstructionArgs);

  const transaction = new Transaction();
  transaction.add(sellInstruction).add(printListingReceiptInstruction);

  return [transaction, receipt] as const;
}
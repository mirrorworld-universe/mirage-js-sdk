import { LAMPORTS_PER_SOL, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction } from '@solana/web3.js';
import { AuctionHouse } from '../types';
import { getAtaForMint, getMetadata } from '../utils';
import {
  createSellInstruction,
  createPrintListingReceiptInstruction,
  PrintListingReceiptInstructionAccounts,
  PrintListingReceiptInstructionArgs,
  SellInstructionAccounts,
  SellInstructionArgs,
} from '@metaplex-foundation/mpl-auction-house';

import type { Program } from '@project-serum/anchor';
import { AuctionHouseIDL } from '../auctionHouseIdl';
import { getAuctionHouseProgramAsSignerAddress, getListReceiptAddress, getSellerTradeState } from '../auctionUtils';

/**
 * Create List Transaction
 * @param mint
 * @param listingPrice
 * @param sellerPublicKey
 * @param auctionHouse
 * @param program
 */
export async function createListingTransaction(
  mint: PublicKey,
  listingPrice: number,
  sellerPublicKey: PublicKey,
  auctionHouse: PublicKey,
  program: Program<AuctionHouseIDL>
) {
  const _listingPrice = Number(listingPrice) * LAMPORTS_PER_SOL;
  const tokenSize = 1;
  const auctionHouseObj = (await program.account.auctionHouse.fetch(auctionHouse)) as any as AuctionHouse;

  const nftMetadataAccount = await getMetadata(mint);
  const [associatedTokenAccount] = getAtaForMint(mint, sellerPublicKey);

  console.log('listing', {
    auctionHouse: auctionHouse.toBase58(),
    sellerPublicKey: sellerPublicKey.toBase58(),
    associatedTokenAccountL: associatedTokenAccount.toBase58(),
    treasuryMint: auctionHouseObj.treasuryMint.toBase58(),
    mint: mint.toBase58(),
    price: _listingPrice,
    tokenAmount: 1,
  });

  const [sellerTradeState, tradeStateBump] = getSellerTradeState(
    auctionHouse,
    sellerPublicKey,
    associatedTokenAccount,
    auctionHouseObj.treasuryMint,
    mint,
    _listingPrice,
    1
  );

  const [freeTradeState, freeTradeBump] = getSellerTradeState(auctionHouse, sellerPublicKey, associatedTokenAccount, auctionHouseObj.treasuryMint, mint, 0, 1);

  const [receipt, receiptBump] = getListReceiptAddress(sellerTradeState);

  console.debug('[sellerTradeState, receipt]', [sellerTradeState.toBase58(), receipt.toBase58()]);

  const [programAsSigner, programAsSignerBump] = getAuctionHouseProgramAsSignerAddress();

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
    buyerPrice: _listingPrice,
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

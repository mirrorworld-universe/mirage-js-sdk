import { Connection, LAMPORTS_PER_SOL, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction } from '@solana/web3.js';
import { AuctionHouse } from '../types';
import { getMetadata } from '../utils';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house';
import {
  CancelInstructionAccounts,
  CancelInstructionArgs,
  CancelListingReceiptInstructionAccounts,
  createCancelInstruction,
  createSellInstruction,
  createPrintListingReceiptInstruction,
  createCancelListingReceiptInstruction,
  PrintListingReceiptInstructionAccounts,
  PrintListingReceiptInstructionArgs,
  SellInstructionAccounts,
  SellInstructionArgs,
} from '@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions';

import type { Program } from '@project-serum/anchor';
import { AuctionHouseProgramIDL } from '../idl';

import { getNftOwner } from '../utils';
import { ListingAlreadyExistsError } from '../errors';

/**
 * Create Update Listing Transaction
 * @param mint
 * @param currentListingPrice
 * @param newListingPrice
 * @param sellerPublicKey
 * @param auctionHouse
 * @param connection
 * @param auctionHouseAuthority
 * @param program
 */
export async function createUpdateListingTransaction(
  mint: PublicKey,
  currentListingPrice: number,
  newListingPrice: number,
  sellerPublicKey: PublicKey,
  auctionHouse: PublicKey,
  program: Program<AuctionHouseProgramIDL>,
  auctionHouseAuthority: PublicKey,
  connection: Connection
) {
  const _currentListingPrice = Number(currentListingPrice) * LAMPORTS_PER_SOL;
  const _newListingPrice = Number(newListingPrice) * LAMPORTS_PER_SOL;
  const _mint = new PublicKey(mint);
  const [sellerAddressAsString, _sellerPublicKey] = await getNftOwner(_mint, connection);

  if (sellerPublicKey.toBase58() !== sellerAddressAsString && sellerPublicKey.toBase58() !== auctionHouseAuthority.toBase58()) {
    throw new Error('You cannot cancel listing of an NFT you do not own.');
  }

  const auctionHouseObj = (await program.account.auctionHouse.fetch(auctionHouse)) as any as AuctionHouse;
  const [programAsSigner, programAsSignerBump] = await AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress();
  const associatedTokenAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, _mint, _sellerPublicKey);
  const [sellerTradeState] = await AuctionHouseProgram.findTradeStateAddress(
    _sellerPublicKey,
    auctionHouse,
    associatedTokenAccount,
    auctionHouseObj.treasuryMint,
    _mint,
    _currentListingPrice,
    1
  );

  const [listingReceipt] = await AuctionHouseProgram.findListingReceiptAddress(sellerTradeState);

  const authority = auctionHouseAuthority;
  const auctionHouseFeeAccount = new PublicKey(auctionHouseObj.auctionHouseFeeAccount);
  const receipt = listingReceipt;

  // Cancel listing transactions
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
    buyerPrice: _currentListingPrice,
    tokenSize: 1,
  };

  const cancelListingReceiptAccounts: CancelListingReceiptInstructionAccounts = {
    receipt,
    instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
  };

  // Create new listing transactions
  const listingPrice = _newListingPrice;
  const nftMetadataAccount = await getMetadata(_mint);
  const [newSellerTradeState, newTradeStateBump] = await AuctionHouseProgram.findTradeStateAddress(
    sellerPublicKey,
    auctionHouse,
    associatedTokenAccount,
    auctionHouseObj.treasuryMint,
    _mint,
    listingPrice,
    1
  );

  // There is an edge case in which the user
  // tries to update the listing to a value of the same
  // previous price. If this occurs, we prevent the user
  // from updating a listing to the same price as the previous one
  console.log('newSellerTradeState.toBase58() === sellerTradeState.toBase58()', newSellerTradeState.toBase58() === sellerTradeState.toBase58());
  if (newSellerTradeState.toBase58() === sellerTradeState.toBase58()) {
    throw new ListingAlreadyExistsError();
  }

  const [newFreeTradeState, newFreeTradeBump] = await AuctionHouseProgram.findTradeStateAddress(
    sellerPublicKey,
    auctionHouse,
    associatedTokenAccount,
    auctionHouseObj.treasuryMint,
    _mint,
    0,
    1
  );
  const [newListingReceipt, newListingReceiptBump] = await AuctionHouseProgram.findListingReceiptAddress(newSellerTradeState);
  console.log('[newSellerTradeState, newListingReceipt]', [newSellerTradeState.toBase58(), newListingReceipt.toBase58()]);

  // Create sell instruction accounts
  const sellInstructionAccounts: SellInstructionAccounts = {
    auctionHouse,
    auctionHouseFeeAccount: new PublicKey(auctionHouseObj.auctionHouseFeeAccount),
    authority: new PublicKey(auctionHouseObj.authority),
    wallet: sellerPublicKey,
    metadata: nftMetadataAccount,
    tokenAccount: associatedTokenAccount,
    freeSellerTradeState: newFreeTradeState,
    sellerTradeState: newSellerTradeState,
    programAsSigner,
  };
  const sellInstructionArgs: SellInstructionArgs = {
    buyerPrice: listingPrice,
    freeTradeStateBump: newFreeTradeBump,
    tradeStateBump: newTradeStateBump,
    programAsSignerBump,
    tokenSize: 1,
  };

  // Create listing receipt accounts
  const printListingReceiptInstructionAccounts: PrintListingReceiptInstructionAccounts = {
    receipt: newListingReceipt,
    bookkeeper: sellerPublicKey,
    instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
  };
  const printListingReceiptInstructionArgs: PrintListingReceiptInstructionArgs = {
    receiptBump: newListingReceiptBump,
  };

  const cancelInstruction = await createCancelInstruction(cancelInstructionAccounts, cancelInstructionArgs);
  const cancelListingReceiptInstruction = createCancelListingReceiptInstruction(cancelListingReceiptAccounts);
  const sellInstruction = await createSellInstruction(sellInstructionAccounts, sellInstructionArgs);
  const printListingReceiptInstruction = createPrintListingReceiptInstruction(printListingReceiptInstructionAccounts, printListingReceiptInstructionArgs);

  const transaction = new Transaction();
  transaction.add(cancelInstruction).add(cancelListingReceiptInstruction).add(sellInstruction).add(printListingReceiptInstruction);

  return [transaction, receipt] as const;
}

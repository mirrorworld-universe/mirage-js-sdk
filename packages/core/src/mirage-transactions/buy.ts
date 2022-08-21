import { Connection, LAMPORTS_PER_SOL, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction, TransactionInstruction } from '@solana/web3.js';
import { AuctionHouse } from '../types';
import { getMetadata } from '../utils';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house';
import {
  ExecuteSaleInstructionAccounts,
  ExecuteSaleInstructionArgs,
  PrintBidReceiptInstructionAccounts,
  PrintBidReceiptInstructionArgs,
  PrintPurchaseReceiptInstructionAccounts,
  PrintPurchaseReceiptInstructionArgs,
  PublicBuyInstructionAccounts,
  PublicBuyInstructionArgs,
} from '@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions';

import type { Program, Wallet } from '@project-serum/anchor';
import { AuctionHouseProgramIDL } from '../idl';
import { decodeMetadata, Metadata as MetadataSchema } from '../schema';
import { getNftOwner } from '../utils';

const { createPrintPurchaseReceiptInstruction, createPublicBuyInstruction, createExecuteSaleInstruction, createPrintBidReceiptInstruction } =
  AuctionHouseProgram.instructions;

/**
 * Create Buy Transaction object
 * @param mint
 * @param buyerPrice
 * @param buyer
 * @param auctionHouse
 * @param program
 * @param connection
 */
export async function createBuyTransaction(
  mint: PublicKey,
  buyerPrice: number,
  buyer: PublicKey,
  auctionHouse: PublicKey,
  program: Program<AuctionHouseProgramIDL>,
  connection: Connection
) {
  const _buyerPrice = Number(buyerPrice) * LAMPORTS_PER_SOL;
  const _mint = new PublicKey(mint);
  const [sellerAddressAsString, _sellerPublicKey] = await getNftOwner(mint, connection);

  if (buyer.toBase58() === sellerAddressAsString) {
    throw new Error('You cannot buy your own NFT');
  }

  /** Limit token size to 1 */
  const tokenSize = 1;

  // User wallet.
  const buyerWallet = buyer;

  console.log({
    _mint: _mint.toBase58(),
    _sellerPublicKey: buyer.toBase58(),
    buyingPrice: buyerPrice,
  });

  const auctionHouseObj = (await program!.account.auctionHouse.fetch(auctionHouse!)) as any as AuctionHouse;

  const [escrowPaymentAccount, escrowPaymentBump] = await AuctionHouseProgram.findEscrowPaymentAccountAddress(auctionHouse!, buyerWallet);

  const results = await program!.provider.connection.getTokenLargestAccounts(_mint);

  const metadata = await getMetadata(_mint);
  /**
   * Token account of the token to purchase,
   * This will default to finding the one with
   * highest balance (of NFTs)
   * */
  const tokenAccount = results.value[0].address;

  const [buyerTradeState, tradeStateBump] = await AuctionHouseProgram.findPublicBidTradeStateAddress(
    buyerWallet,
    auctionHouse!,
    auctionHouseObj.treasuryMint,
    _mint,
    _buyerPrice,
    tokenSize
  );

  const publicBuyInstructionAccounts: PublicBuyInstructionAccounts = {
    wallet: buyerWallet,
    transferAuthority: buyerWallet,
    paymentAccount: buyerWallet,
    treasuryMint: auctionHouseObj.treasuryMint,
    tokenAccount,
    metadata,
    escrowPaymentAccount,
    authority: new PublicKey(auctionHouseObj.authority),
    auctionHouse: auctionHouse!,
    auctionHouseFeeAccount: new PublicKey(auctionHouseObj.auctionHouseFeeAccount),
    buyerTradeState,
  };

  const publicBuyInstructionArgs: PublicBuyInstructionArgs = {
    buyerPrice: _buyerPrice,
    escrowPaymentBump,
    tokenSize,
    tradeStateBump,
  };

  const publicBuyInstruction = createPublicBuyInstruction(publicBuyInstructionAccounts, publicBuyInstructionArgs);

  const associatedTokenAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, _mint, _sellerPublicKey);

  const [sellerTradeState] = await AuctionHouseProgram.findTradeStateAddress(
    _sellerPublicKey,
    auctionHouse!,
    associatedTokenAccount,
    auctionHouseObj.treasuryMint,
    _mint,
    _buyerPrice,
    1
  );

  const [freeTradeState, freeTradeStateBump] = await AuctionHouseProgram.findTradeStateAddress(
    _sellerPublicKey,
    auctionHouse!,
    tokenAccount,
    auctionHouseObj.treasuryMint,
    _mint,
    0,
    1
  );

  const [programAsSigner, programAsSignerBump] = await AuctionHouseProgram.findAuctionHouseProgramAsSignerAddress();

  const [buyerReceiptTokenAccount] = await AuctionHouseProgram.findAssociatedTokenAccountAddress(_mint, buyerWallet);

  const metadataObj = await program!.provider.connection.getAccountInfo(metadata);
  const metadataDecoded: MetadataSchema = decodeMetadata(Buffer.from(metadataObj!.data));

  const creatorAccounts = metadataDecoded.data.creators!.map((c) => ({
    pubkey: new PublicKey(c.address),
    isWritable: true,
    isSigner: false,
  }));

  const executeSaleInstructionAccounts: ExecuteSaleInstructionAccounts = {
    buyer: buyerWallet,
    seller: _sellerPublicKey,
    tokenAccount,
    tokenMint: _mint,
    metadata,
    auctionHouse: auctionHouse!,
    treasuryMint: auctionHouseObj.treasuryMint,
    authority: new PublicKey(auctionHouseObj.authority),
    auctionHouseFeeAccount: new PublicKey(auctionHouseObj.auctionHouseFeeAccount),
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
    buyerPrice: _buyerPrice,
    tokenSize,
    // @ts-ignore
    partialOrderSize: null,
    partialOrderPrice: null,
  };

  const _executeSaleInstruction = await createExecuteSaleInstruction(executeSaleInstructionAccounts, createExecuteSaleInstructionArgs);

  const [bidReceipt, bidReceiptBump] = await AuctionHouseProgram.findBidReceiptAddress(buyerTradeState);

  // Executing sale:
  console.log('===== EXECUTING SALE =====');

  console.log('[buyerTradeState, bidReceipt]', [buyerTradeState.toBase58(), bidReceipt.toBase58()]);
  const [purchaseReceipt, purchaseReceiptBump] = await AuctionHouseProgram.findPurchaseReceiptAddress(sellerTradeState, buyerTradeState);
  const [listingReceipt] = await AuctionHouseProgram.findListingReceiptAddress(sellerTradeState);

  console.log('[sellerTradeState, listingReceipt]', [sellerTradeState.toBase58(), listingReceipt.toBase58()]);

  const printBidReceiptInstructionAccounts: PrintBidReceiptInstructionAccounts = {
    bookkeeper: buyerWallet,
    receipt: bidReceipt,
    instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
  };
  const printBidReceiptInstructionArgs: PrintBidReceiptInstructionArgs = {
    receiptBump: bidReceiptBump,
  };

  const printPurchaseReceiptInstructionAccounts: PrintPurchaseReceiptInstructionAccounts = {
    bookkeeper: buyerWallet,
    purchaseReceipt,
    bidReceipt,
    listingReceipt,
    instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
  };
  const printPurchaseReceiptInstructionArgs: PrintPurchaseReceiptInstructionArgs = {
    purchaseReceiptBump,
  };

  const printBidReceiptInstruction = createPrintBidReceiptInstruction(printBidReceiptInstructionAccounts, printBidReceiptInstructionArgs);

  const printPurchaseReceiptInstruction = createPrintPurchaseReceiptInstruction(printPurchaseReceiptInstructionAccounts, printPurchaseReceiptInstructionArgs);

  const executeSaleInstruction = new TransactionInstruction({
    programId: AuctionHouseProgram.PUBKEY,
    data: _executeSaleInstruction.data,
    // @ts-ignore
    keys: [..._executeSaleInstruction.keys, ...creatorAccounts],
  });

  const transaction = new Transaction();
  transaction.add(publicBuyInstruction).add(printBidReceiptInstruction).add(executeSaleInstruction).add(printPurchaseReceiptInstruction);

  return [transaction, purchaseReceipt] as const;
}

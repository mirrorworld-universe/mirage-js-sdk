import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction, TransactionInstruction } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, NATIVE_MINT, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import {
  createExecuteSaleInstruction,
  createPublicBuyInstruction,
  createPrintBidReceiptInstruction,
  createPrintPurchaseReceiptInstruction,
} from '@metaplex-foundation/mpl-auction-house';
import { Program } from '@project-serum/anchor';
import { AuctionHouseIDL } from '../auctionHouseIdl';
import { getAtaForMint, getMetadata, isPdaAddressInitialize } from '../utils';
import { AuctionHouse } from '../types';
import {
  ExecuteSaleInstructionAccounts,
  ExecuteSaleInstructionArgs,
  PrintPurchaseReceiptInstructionAccounts,
  PrintPurchaseReceiptInstructionArgs,
} from '@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions';
import { decodeMetadata, Metadata as MetadataSchema } from '../schema';
import {
  getAuctionHouseBuyerEscrow,
  getAuctionHouseProgramAsSignerAddress,
  getBuyerTradeState,
  getListReceiptAddress,
  getPrintBidReceiptAddress,
  getPurchaseReceiptAddress,
  getSellerTradeState,
} from '../auctionUtils';
import { AUCTION_HOUSE_PROGRAM_ID } from '../constants';

export const createBuyTransaction = async (
  tokenMint: PublicKey,
  price: number,
  buyer: PublicKey,
  seller: PublicKey,
  auctionHouse: PublicKey,
  program: Program<AuctionHouseIDL>,
  connection: Connection
) => {
  const ah = (await program.account.auctionHouse.fetch(auctionHouse)) as any as AuctionHouse;
  const buyerPrice = Number(price) * LAMPORTS_PER_SOL;
  const authority = new PublicKey(ah.authority);
  const auctionHouseFeeAccount = new PublicKey(ah.auctionHouseFeeAccount);
  const treasuryMint = new PublicKey(ah.treasuryMint);
  const [sellerAssociateTokenAccountAddress] = getAtaForMint(tokenMint, seller);
  const tokenAccount = sellerAssociateTokenAccountAddress;
  const metadata = await getMetadata(tokenMint);
  const isSplMint = !treasuryMint.equals(NATIVE_MINT);

  let splTokenTransferAuthority = Keypair.generate();
  let transferAuthority = buyer;
  let paymentAccount = buyer;
  let signers: Keypair[] = [];

  console.log({
    type: 'buy',
    tokenMint: tokenMint.toBase58(),
    buyer: buyer.toBase58(),
    seller: seller.toBase58(),
    sellerAssociateTokenAccountAddress: sellerAssociateTokenAccountAddress.toBase58(),
    auctionHouse: auctionHouse.toBase58(),
    treasuryMint: treasuryMint.toBase58(),
    metadata: metadata.toBase58(),
    isSplMint,
    buyerPrice,
  });

  const [sellerTradeState] = getSellerTradeState(auctionHouse, seller, tokenAccount, treasuryMint, tokenMint, buyerPrice, 1);
  const tradeStateInitialized = await isPdaAddressInitialize(connection, sellerTradeState);

  if (!tradeStateInitialized) {
    throw new Error('Trade state account not found. Listing either does not exist or has already been closed.');
  }

  if (isSplMint) {
    transferAuthority = splTokenTransferAuthority.publicKey;
    signers = [...signers, splTokenTransferAuthority];

    paymentAccount = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, treasuryMint, buyer);
  }

  const [escrowPaymentAccount, escrowPaymentBump] = getAuctionHouseBuyerEscrow(auctionHouse, buyer);
  const [buyerTradeState, tradeStateBump] = getBuyerTradeState(auctionHouse, buyer, treasuryMint, tokenMint, buyerPrice, 1);

  let publicBuyInstruction = createPublicBuyInstruction(
    {
      wallet: buyer,
      paymentAccount: buyer,
      transferAuthority: buyer,
      treasuryMint,
      tokenAccount,
      metadata,
      escrowPaymentAccount,
      authority,
      auctionHouse,
      auctionHouseFeeAccount,
      buyerTradeState,
    },
    {
      escrowPaymentBump,
      tradeStateBump,
      tokenSize: 1,
      buyerPrice,
    }
  );

  if (isSplMint) {
    publicBuyInstruction.keys.map((key) => {
      if (key.pubkey.equals(transferAuthority)) {
        key.isSigner = true;
      }

      return key;
    });
  }

  const [receipt, receiptBump] = getPrintBidReceiptAddress(buyerTradeState);

  const printBidReceiptInstruction = createPrintBidReceiptInstruction(
    {
      receipt,
      bookkeeper: buyer,
      instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
    },
    {
      receiptBump,
    }
  );

  let transaction = new Transaction();

  if (isSplMint) {
    const createApproveInstruction = Token.createApproveInstruction(TOKEN_PROGRAM_ID, paymentAccount, transferAuthority, buyer, [], buyerPrice);

    transaction.add(createApproveInstruction);
  }

  transaction.add(publicBuyInstruction).add(printBidReceiptInstruction);

  if (isSplMint) {
    const createRevokeInstruction = Token.createRevokeInstruction(TOKEN_PROGRAM_ID, paymentAccount, buyer, []);

    transaction.add(createRevokeInstruction);
  }

  const executeSaleInstruction = await createExecuteSaleInstructions(
    buyer,
    seller,
    buyerPrice,
    tokenAccount,
    tokenMint,
    metadata,
    auctionHouse,
    ah,
    escrowPaymentAccount,
    escrowPaymentBump,
    buyerTradeState,
    sellerTradeState,
    program
  );
  transaction.add(executeSaleInstruction);

  const [purchaseReceipt, purchaseReceiptBump] = getPurchaseReceiptAddress(sellerTradeState, buyerTradeState);
  const printPurchaseReceiptInstruction = await createPrintPurchaseInstruction(buyer, sellerTradeState, buyerTradeState, purchaseReceipt, purchaseReceiptBump);
  transaction.add(printPurchaseReceiptInstruction);

  return [transaction, purchaseReceipt, signers] as const;
};

const createPrintPurchaseInstruction = async (
  buyer: PublicKey,
  sellerTradeState: PublicKey,
  buyerTradeState: PublicKey,
  purchaseReceipt: PublicKey,
  purchaseReceiptBump: number
): Promise<TransactionInstruction> => {
  const [bidReceipt, _bidReceiptBump] = getPrintBidReceiptAddress(buyerTradeState);
  const [listingReceipt] = getListReceiptAddress(sellerTradeState);

  const printPurchaseReceiptInstructionAccounts: PrintPurchaseReceiptInstructionAccounts = {
    bookkeeper: buyer,
    purchaseReceipt,
    bidReceipt,
    listingReceipt,
    instruction: SYSVAR_INSTRUCTIONS_PUBKEY,
  };
  const printPurchaseReceiptInstructionArgs: PrintPurchaseReceiptInstructionArgs = {
    purchaseReceiptBump,
  };

  return createPrintPurchaseReceiptInstruction(printPurchaseReceiptInstructionAccounts, printPurchaseReceiptInstructionArgs);
};

const createExecuteSaleInstructions = async (
  buyer: PublicKey,
  seller: PublicKey,
  buyerPrice: number,
  tokenAccount: PublicKey,
  tokenMint: PublicKey,
  metadata: PublicKey,
  auctionHouse: PublicKey,
  ah: AuctionHouse,
  escrowPaymentAccount: PublicKey,
  escrowPaymentBump: number,
  buyerTradeState: PublicKey,
  sellerTradeState: PublicKey,
  program: Program<AuctionHouseIDL>
): Promise<TransactionInstruction> => {
  const [programAsSigner, programAsSignerBump] = getAuctionHouseProgramAsSignerAddress();
  const [buyerReceiptTokenAccount] = getAtaForMint(tokenMint, buyer);

  const [freeTradeState, freeTradeStateBump] = getSellerTradeState(auctionHouse, seller, tokenAccount, ah.treasuryMint, tokenMint, 0, 1);

  const metadataObj = await program.provider.connection.getAccountInfo(metadata);
  const metadataDecoded: MetadataSchema = decodeMetadata(Buffer.from(metadataObj!.data));

  const creatorAccounts = metadataDecoded.data.creators!.map((c) => ({
    pubkey: new PublicKey(c.address),
    isWritable: true,
    isSigner: false,
  }));

  const executeSaleInstructionAccounts: ExecuteSaleInstructionAccounts = {
    buyer,
    seller,
    tokenAccount,
    tokenMint,
    metadata,
    auctionHouse,
    treasuryMint: ah.treasuryMint,
    authority: new PublicKey(ah.authority),
    auctionHouseFeeAccount: new PublicKey(ah.auctionHouseFeeAccount),
    auctionHouseTreasury: new PublicKey(ah.auctionHouseTreasury),
    escrowPaymentAccount,
    programAsSigner,
    sellerPaymentReceiptAccount: seller,
    buyerReceiptTokenAccount,
    buyerTradeState,
    sellerTradeState,
    freeTradeState,
  };

  const createExecuteSaleInstructionArgs: ExecuteSaleInstructionArgs = {
    escrowPaymentBump,
    freeTradeStateBump,
    programAsSignerBump,
    buyerPrice,
    tokenSize: 1,
  };

  const _executeSaleInstruction = await createExecuteSaleInstruction(executeSaleInstructionAccounts, createExecuteSaleInstructionArgs);

  return new TransactionInstruction({
    programId: AUCTION_HOUSE_PROGRAM_ID,
    data: _executeSaleInstruction.data,
    keys: [..._executeSaleInstruction.keys, ...creatorAccounts],
  });
};

import { PublicKey } from '@solana/web3.js';
import { AUCTION_HOUSE, AUCTION_HOUSE_PROGRAM_ID, SIGNER } from './constants';

const BID_RECEIPT_PREFIX = 'bid_receipt';
const PURCHASE_RECEIPT_PREFIX = 'purchase_receipt';
const LISTING_RECEIPT_PREFIX = 'listing_receipt';

const FEE_PAYER = 'fee_payer';
const TREASURY = 'treasury';

export const getAuctionHouseBuyerEscrow = (auctionHouse: PublicKey, wallet: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync([Buffer.from(AUCTION_HOUSE), auctionHouse.toBuffer(), wallet.toBuffer()], AUCTION_HOUSE_PROGRAM_ID);
};

export const getAuctionHouseAddress = (creator: PublicKey, treasuryMint: PublicKey) => {
  return PublicKey.findProgramAddressSync([Buffer.from(AUCTION_HOUSE), creator.toBuffer(), treasuryMint.toBuffer()], AUCTION_HOUSE_PROGRAM_ID);
};

export const getAuctionHouseFeeAddress = (auctionHouse: PublicKey) => {
  return PublicKey.findProgramAddressSync([Buffer.from(AUCTION_HOUSE), auctionHouse.toBuffer(), Buffer.from(FEE_PAYER)], AUCTION_HOUSE_PROGRAM_ID);
};

export const getAuctionHouseTreasuryAddress = (auctionHouse: PublicKey) => {
  return PublicKey.findProgramAddressSync([Buffer.from(AUCTION_HOUSE), auctionHouse.toBuffer(), Buffer.from(TREASURY)], AUCTION_HOUSE_PROGRAM_ID);
};

export const getBuyerTradeState = (
  auctionHouse: PublicKey,
  wallet: PublicKey,
  tokenAccount: PublicKey,
  treasuryMint: PublicKey,
  tokenMint: PublicKey,
  price: number,
  tokenSize: number
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(AUCTION_HOUSE),
      wallet.toBuffer(),
      auctionHouse.toBuffer(),
      tokenAccount.toBuffer(),
      treasuryMint.toBuffer(),
      tokenMint.toBuffer(),
      Buffer.from(price.toString()),
      Buffer.from(tokenSize.toString()),
    ],
    AUCTION_HOUSE_PROGRAM_ID
  );
};

export const getSellerTradeState = (
  auctionHouse: PublicKey,
  wallet: PublicKey,
  tokenAccount: PublicKey,
  treasuryMint: PublicKey,
  tokenMint: PublicKey,
  price: number,
  tokenSize: number
): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from(AUCTION_HOUSE),
      wallet.toBuffer(),
      auctionHouse.toBuffer(),
      tokenAccount.toBuffer(),
      treasuryMint.toBuffer(),
      tokenMint.toBuffer(),
      Buffer.from(price.toString()),
      Buffer.from(tokenSize.toString()),
    ],
    AUCTION_HOUSE_PROGRAM_ID
  );
};

export const getAuctionHouseProgramAsSignerAddress = () => {
  return PublicKey.findProgramAddressSync([Buffer.from(AUCTION_HOUSE), Buffer.from(SIGNER)], AUCTION_HOUSE_PROGRAM_ID);
};

export const getPrintBidReceiptAddress = (buyerTradeState: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync([Buffer.from(BID_RECEIPT_PREFIX), buyerTradeState.toBuffer()], AUCTION_HOUSE_PROGRAM_ID);
};

export const getPurchaseReceiptAddress = (sellerTradeState: PublicKey, buyerTradeState: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(PURCHASE_RECEIPT_PREFIX), sellerTradeState.toBuffer(), buyerTradeState.toBuffer()],
    AUCTION_HOUSE_PROGRAM_ID
  );
};

export const getListReceiptAddress = (sellerTradeState: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync([Buffer.from(LISTING_RECEIPT_PREFIX), sellerTradeState.toBuffer()], AUCTION_HOUSE_PROGRAM_ID);
};

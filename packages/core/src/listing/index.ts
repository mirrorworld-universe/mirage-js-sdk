import { AuctionState, createAuction } from '@mirrorworld/mirage.utils';

// With Metaplex, you can create multiple auction
// categories. In this case, we shall currently only support
// single/instant auctions. We may be able to support this
// in the future.
export enum AuctionCategory {
  InstantSale,
  Single,
  DutchAuction,
  Limited,
  Open,
  Tiered,
}

enum InstantSaleType {
  Limited,
  Single,
  Open,
}

const DEFAULT_ACTION: AuctionState = {
  reservationPrice: 0,
  items: [],
  category: AuctionCategory.Single,
  auctionDurationType: 'minutes',
  auctionDuration: 1440,
  gapTime: 0,
  gapTimeType: 'minutes',
  winnersCount: 1,
  startSaleTS: undefined,
  startListTS: undefined,
  quoteMintAddress: QUOTE_MINT.toBase58(),
  quoteMintInfo: mint!,
  quoteMintInfoExtended: tokenMap.get(QUOTE_MINT.toBase58())!,
  instantSalePrice: 0,
  priceFloor: 0,
  tickSizeEndingPhase: 0,
}

export function createListing() {
  return createAuction() {

  }
}

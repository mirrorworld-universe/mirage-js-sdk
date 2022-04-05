import { MetaState } from '../types';

export const getEmptyMetaState = (): MetaState => ({
  metadata: [],
  metadataByMetadata: {},
  metadataByMint: {},
  metadataByAuction: {},
  masterEditions: {},
  masterEditionsByPrintingMint: {},
  masterEditionsByOneTimeAuthMint: {},
  metadataByMasterEdition: {},
  editions: {},
  auctionManagersByAuction: {},
  bidRedemptions: {},
  auctions: {},
  auctionDataExtended: {},
  vaults: {},
  payoutTickets: {},
  store: null,
  whitelistedCreatorsByCreator: {},
  bidderMetadataByAuctionAndBidder: {},
  bidderPotsByAuctionAndBidder: {},
  safetyDepositBoxesByVaultAndIndex: {},
  prizeTrackingTickets: {},
  safetyDepositConfigsByAuctionManagerAndIndex: {},
  bidRedemptionV2sByAuctionManagerAndWinningIndex: {},
  auctionCaches: {},
  storeIndexer: [],
  packs: {},
});
export const getMetaState = () => __state__;
export const mergeState = (state: Partial<MetaState>) => {
  __state__ = Object.assign(__state__, state);
  return __state__;
};

export let __state__ = getEmptyMetaState();
export let __loadedMetadataLength__ = 0;

import { MintInfo } from '@solana/spl-token';
import { TokenInfo } from '@solana/spl-token-registry';
import { InstantSaleType, Tier } from '../../types';
import { SafetyDepositDraft } from '../createAuctionManager';

export enum AuctionCategory {
  InstantSale,
  Single,
  DutchAuction,
  Limited,
  Open,
  Tiered,
}

export interface AuctionState {
  // Min price required for the item to sell
  reservationPrice: number;

  // listed NFTs
  items: SafetyDepositDraft[];
  participationNFT?: SafetyDepositDraft;
  participationFixedPrice?: number;
  // number of editions for this auction (only applicable to limited edition)
  editions?: number;

  // date time when auction should start UTC+0
  startDate?: Date;

  // suggested date time when auction should end UTC+0
  endDate?: Date;

  //////////////////
  category: AuctionCategory;

  price?: number;
  priceFloor?: number;
  priceTick?: number;

  startSaleTS?: number;
  startListTS?: number;
  endTS?: number;

  auctionDuration?: number;
  auctionDurationType?: 'days' | 'hours' | 'minutes';
  gapTime?: number;
  gapTimeType?: 'days' | 'hours' | 'minutes';
  tickSizeEndingPhase?: number;

  spots?: number;
  tiers?: Array<Tier>;

  winnersCount: number;

  instantSalePrice?: number;
  instantSaleType?: InstantSaleType;

  quoteMintAddress: string;
  quoteMintInfo: MintInfo;
  quoteMintInfoExtended: TokenInfo;
}

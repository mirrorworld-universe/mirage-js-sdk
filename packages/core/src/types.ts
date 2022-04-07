import { PublicKey } from '@solana/web3.js';
import { Borsh } from '@metaplex-foundation/mpl-core';

export enum MetadataKey {
  Uninitialized = 0,
  MetadataV1 = 4,
  EditionV1 = 1,
  MasterEditionV1 = 2,
  MasterEditionV2 = 6,
  EditionMarker = 7,
  UseAuthorityRecord = 8,
  CollectionAuthorityRecord = 9,
}

export enum UseMethod {
  Burn = 0,
  Single = 1,
  Multiple = 2,
}

type UsesArgs = { useMethod: UseMethod; total: number; remaining: number };
export class Uses extends Borsh.Data<UsesArgs> {
  // @ts-ignore
  static readonly SCHEMA = Uses.struct([
    ['useMethod', 'u8'],
    ['total', 'u64'],
    ['remaining', 'u64'],
  ]);
  useMethod: UseMethod;
  total: number;
  remaining: number;

  constructor(args: UsesArgs) {
    super(args);
    this.useMethod = args.useMethod;
    this.total = args.total;
    this.remaining = args.remaining;
  }
}

export interface AuctionHouse {
  auctionHouseFeeAccount: PublicKey;
  auctionHouseTreasury: PublicKey;
  treasuryWithdrawalDestination: PublicKey;
  feeWithdrawalDestination: PublicKey;
  treasuryMint: PublicKey;
  authority: PublicKey;
  creator: PublicKey;
  bump: number;
  treasuryBump: number;
  feePayerBump: number;
  sellerFeeBasisPoints: number;
  requiresSignOff: boolean;
  canChangeSalePrice: boolean;
}

export enum SolanaNetwork {
  mainnet = 'mainnet-beta',
  devnet = 'devnet',
}

export interface INFTStorageResponse {
  ok: boolean;
  value: Value;
}
export interface Value {
  cid: string;
  size: number;
  created: string;
  type: string;
  scope: string;
  pin: Pin;
  files?: FilesEntity[] | null;
  deals?: DealsEntity[] | null;
}
export interface Pin {
  cid: string;
  name: string;
  meta: Meta;
  status: string;
  created: string;
  size: number;
}
export interface Meta {}
export interface FilesEntity {
  name: string;
  type: string;
}
export interface DealsEntity {
  batchRootCid: string;
  lastChange: string;
  miner: string;
  network: string;
  pieceCid: string;
  status: string;
  statusText: string;
  chainDealID: number;
  dealActivation: string;
  dealExpiration: string;
}

export interface IMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string | undefined;
  animation_url: string | undefined;
  attributes: Attribute[] | undefined;
  external_url: string;
  properties: any;
  creators: Creator[] | null;
  seller_fee_basis_points: number;
  collection?: string;
  uses?: Uses;
}
export interface MetadataObject {
  name: string;
  symbol: string;
  description: string;
  image: string | undefined;
  animation_url: string | undefined;
  attributes: Attribute[] | undefined;
  external_url: string;
  properties: any;
  seller_fee_basis_points: number;
  collection?: string;
  uses?: Uses;
}

export type Attribute = {
  trait_type?: string;
  display_type?: string;
  value: string | number;
};

export class Creator {
  address: string;
  verified: boolean;
  share: number;

  constructor(args: { address: string; verified: boolean; share: number }) {
    this.address = args.address;
    this.verified = args.verified;
    this.share = args.share;
  }
}

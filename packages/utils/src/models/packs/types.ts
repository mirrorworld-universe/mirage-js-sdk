import { AccountInfo } from '@solana/web3.js';

export enum PackDistributionType {
  MaxSupply,
  Fixed,
  Unlimited,
}

export type AccountAndPubkey = {
  pubkey: string;
  account: AccountInfo<Buffer>;
};

export enum PackKey {
  Uninitialized,
  PackSet,
  PackCard,
  PackVoucher,
  ProvingProcess,
}

export enum PackSetState {
  NotActivated,
  Activated,
  Deactivated,
  Ended,
}

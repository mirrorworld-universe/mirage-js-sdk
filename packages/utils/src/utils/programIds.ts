import { PublicKey } from '@solana/web3.js';
import { findProgramAddress } from '../utils';

import {
  METADATA_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
  METAPLEX_ID,
  BPF_UPGRADE_LOADER_ID,
  SYSTEM,
  MEMO_ID,
  VAULT_ID,
  AUCTION_ID,
  COLLECTION_ID,
  PACK_CREATE_ID,
  ORACLE_ID,
  toPublicKey,
} from './ids';

export const getStoreID = async (storeOwnerAddress?: string) => {
  if (!storeOwnerAddress) {
    return undefined;
  }

  const programs = await findProgramAddress(
    [
      Buffer.from('metaplex'),
      toPublicKey(METAPLEX_ID).toBuffer(),
      toPublicKey(storeOwnerAddress).toBuffer(),
    ],
    toPublicKey(METAPLEX_ID)
  );
  const storeAddress = programs[0];

  return storeAddress;
};

export const setProgramIds = async (store?: string) => {
  STORE = store ? toPublicKey(store) : undefined;
};

let STORE: PublicKey | undefined = toPublicKey(
  '4xpSF5aEEqpyHTFSHGbQs5wGFzFHtX86dtXz5QWndYJo'
);

export const programIds = () => {
  return {
    token: TOKEN_PROGRAM_ID,
    associatedToken: SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID,
    bpf_upgrade_loader: BPF_UPGRADE_LOADER_ID,
    system: SYSTEM,
    metadata: METADATA_PROGRAM_ID,
    memo: MEMO_ID,
    vault: VAULT_ID,
    auction: AUCTION_ID,
    metaplex: METAPLEX_ID,
    collection: COLLECTION_ID,
    pack_create: PACK_CREATE_ID,
    oracle: ORACLE_ID,
    store: STORE,
    tokenMints: [
      'kinXdEcpDQeHPEuQnqmUgtYykqKGVFq6CeVX5iAHJq6',
      'ETAtLmCmsoiEEKfNrHKJ2kYy3MoABhU6NQvpSfij5tDs',
      'BLwTnYKqf7u4qjgZrrsKeNs2EzWkMLqVCu6j8iHyrNA3',
      'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    ],
  };
};

import { PublicKey, AccountInfo } from '@solana/web3.js';

export type StringPublicKey = string;

export class LazyAccountInfoProxy<T> {
  executable: boolean = false;
  owner: StringPublicKey = '';
  lamports: number = 0;

  get data() {
    //
    return undefined as unknown as T;
  }
}

export interface LazyAccountInfo {
  executable: boolean;
  owner: StringPublicKey;
  lamports: number;
  data: [string, string];
}

const PubKeysInternedMap = new Map<string, PublicKey>();

export const toPublicKey = (key: string | PublicKey) => {
  if (typeof key !== 'string') {
    return key;
  }

  let result = PubKeysInternedMap.get(key);
  if (!result) {
    result = new PublicKey(key);
    PubKeysInternedMap.set(key, result);
  }

  return result;
};

export const pubkeyToString = (key: PublicKey | null | string = '') => {
  return typeof key === 'string' ? key : key?.toBase58() || '';
};

export interface PublicKeyStringAndAccount<T> {
  pubkey: string;
  account: AccountInfo<T>;
}

export const WRAPPED_SOL_MINT = new PublicKey(
  'So11111111111111111111111111111111111111112'
);

export const TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
);

export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey(
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'
);

export const BPF_UPGRADE_LOADER_ID = new PublicKey(
  'BPFLoaderUpgradeab1e11111111111111111111111'
);

export const MEMO_ID = new PublicKey(
  'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr'
);

export const METADATA_PROGRAM_ID =
  'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' as StringPublicKey;

export const VAULT_ID =
  'vau1zxA2LbssAUEF7Gpw91zMM1LvXrvpzJtmZ58rPsn' as StringPublicKey;

export const AUCTION_ID =
  'auctxRXPeJoc4817jDhf4HbjnhEcr1cCXenosMhK5R8' as StringPublicKey;

export const METAPLEX_ID =
  'p1exdMJcjVao65QdewkaZRUnU6VPSXhus9n2GzWfh98' as StringPublicKey;

// export const METADATA_PROGRAM_ID =
//   'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s' as StringPublicKey;
// // export const METADATA_PROGRAM_ID =
// //   'FFNkyCwG4aJqQhuM9ucz1Tp8k2g6LYBi83vJXhs1cnQo' as StringPublicKey;

// export const VAULT_ID =
//   'knNyuDpFBkk6zRpTrKTUpuRS3EfzhYgimD9tFDi4LT7' as StringPublicKey;
// // export const VAULT_ID =
// //   'ENw52X18cvSKebzZ836AjYKWFJnsZggXFR5i8oGQ1kYg' as StringPublicKey;

// export const AUCTION_ID =
//   '72BGobTt82sFietRQGPW7F6jT4G9hV6uArGwGELmqg6q' as StringPublicKey;
// // export const AUCTION_ID =
// //   '7JhozZUGwWsXPT6R1LPHsFH2dUyxcEnuREvTu3Ur8FiE' as StringPublicKey;

// export const METAPLEX_ID =
//   '2g6EkQRyypPSD3nv76Cet6M5xFTACCYmyyjToQwbjE5a' as StringPublicKey;
// // export const METAPLEX_ID =
// //   '2bHpQM2CX9Qc7gDVW38Y7RzkM637vhZkmoiUMQKwVV47' as StringPublicKey;

export const COLLECTION_ID =
  'dZc6E8quno4Z2nTnEt9jCp8k6TJhVqrJFMn4YVHw4C5' as StringPublicKey;

export const PACK_CREATE_ID = new PublicKey(
  'packFeFNZzMfD9aVWL7QbGz1WcU7R9zpf6pvNsw2BLu'
);

export const SYSTEM = new PublicKey('11111111111111111111111111111111');

// TODO: generate key ---
export const AR_SOL_HOLDER_ID = new PublicKey(
  '6FKvsq4ydWFci6nGq9ckbjYMtnmaqAoatz5c9XWjiDuS'
);

export const ORACLE_ID = new PublicKey(
  'rndshKFf48HhGaPbaCd3WQYtgCNKzRgVQ3U2we4Cvf9'
);

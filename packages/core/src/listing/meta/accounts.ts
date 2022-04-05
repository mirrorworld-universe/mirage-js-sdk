import {
  cache,
  genericCache,
  StringPublicKey,
  TokenAccount,
  TokenAccountParser,
  u64,
  WRAPPED_SOL_MINT,
} from '@mirrorworld/mirage.utils';
import { Account, AccountInfo, Connection, PublicKey } from '@solana/web3.js';

function wrapNativeAccount(
  pubkey: StringPublicKey,
  account?: AccountInfo<Buffer>
): TokenAccount | undefined {
  if (!account) {
    return undefined;
  }

  const key = new PublicKey(pubkey);

  return {
    pubkey: pubkey,
    account,
    info: {
      address: key,
      mint: WRAPPED_SOL_MINT,
      owner: key,
      amount: new u64(account.lamports),
      delegate: null,
      delegatedAmount: new u64(0),
      isInitialized: true,
      isFrozen: false,
      isNative: true,
      rentExemptReserve: null,
      closeAuthority: null,
    },
  };
}

export async function setupNativeAccount(
  connection: Connection,
  publicKey: PublicKey
) {
  let nativeAccount: AccountInfo<Buffer>;
  function updateCache(account: AccountInfo<Buffer>) {
    if (publicKey) {
      const wrapped = wrapNativeAccount(publicKey.toBase58(), account);
      if (wrapped !== undefined) {
        const id = publicKey.toBase58();
        cache.registerParser(id, TokenAccountParser);
        genericCache.set(id, wrapped as TokenAccount);
        cache.emitter.raiseCacheUpdated(id, false, TokenAccountParser, true);
      }
    }
  }

  let subId = 0;
  const updateAccount = (account: AccountInfo<Buffer> | null) => {
    if (account) {
      updateCache(account);
      nativeAccount = account;
    }
  };

  (async () => {
    if (!connection || !publicKey) {
      return;
    }

    const account = await connection.getAccountInfo(publicKey);
    updateAccount(account);

    subId = connection.onAccountChange(publicKey, updateAccount);
  })();

  return () => {
    if (subId) {
      connection.removeAccountChangeListener(subId);
    }
  };
}

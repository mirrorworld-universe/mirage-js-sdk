import { Connection } from '@solana/web3.js';
import {
  // loadAccounts,
  // MetaState,
  // pullPages,
  getAuctionCache,
  MetaplexKey,
  ParsedAccount,
  programIds,
  SafetyDepositBox,
  sendTransactions,
  SequenceType,
  WalletSigner,
} from '@mirrorworld/mirage.utils';
import { cacheAuctionIndexer } from './cacheAuctionInIndexer';
import { buildListWhileNonZero, getEmptyMetaState } from './helpers';
import BN from 'bn.js';
import { MetaState } from './types';
import { loadAccounts } from '../queries/load-accounts';
import { pullPages } from '../queries/get-store';
// import { getEmptyMetaState } from '@mirrorworld/mirage.utils';

// This command caches an auction at position 0, page 0, and moves everything up
export async function cacheAllAuctions(
  wallet: WalletSigner,
  connection: Connection,
  tempCache: MetaState
) {
  if (!programIds().store) {
    return false;
  }
  const store = programIds().store?.toBase58();

  if (tempCache.storeIndexer.length) {
    // well now we need to pull first.
    const state = getEmptyMetaState();
    tempCache = await loadAccounts(connection, state);
  }

  let auctionManagersToCache = Object.values(tempCache.auctionManagersByAuction)
    .filter((a) => a.info.store == store)
    .sort((a, b) =>
      (
        tempCache.auctions[b.info.auction].info.endedAt ||
        new BN(Date.now() / 1000)
      )
        .sub(
          tempCache.auctions[a.info.auction].info.endedAt ||
            new BN(Date.now() / 1000)
        )
        .toNumber()
    );

  const indexedInStoreIndexer = {};

  tempCache.storeIndexer.forEach((s) => {
    s.info.auctionCaches.forEach((a) => (indexedInStoreIndexer[a] = true));
  });

  const alreadyIndexed = Object.values(tempCache.auctionCaches).reduce(
    (hash, val) => {
      hash[val.info.auctionManager] = indexedInStoreIndexer[val.pubkey];

      return hash;
    },
    {}
  );
  auctionManagersToCache = auctionManagersToCache.filter(
    (a) => !alreadyIndexed[a.pubkey]
  );

  let storeIndex = tempCache.storeIndexer;
  for (let i = 0; i < auctionManagersToCache.length; i++) {
    const auctionManager = auctionManagersToCache[i];
    const boxes: ParsedAccount<SafetyDepositBox>[] = buildListWhileNonZero(
      tempCache.safetyDepositBoxesByVaultAndIndex,
      auctionManager.info.vault
    );
    if (auctionManager.info.key === MetaplexKey.AuctionManagerV2) {
      storeIndex = await pullPages(connection);

      const { instructions, signers } = await cacheAuctionIndexer(
        wallet,
        auctionManager.info.vault,
        auctionManager.info.auction,
        auctionManager.pubkey,
        boxes.map((a) => a.info.tokenMint),
        storeIndex,
        !!tempCache.auctionCaches[
          await getAuctionCache(auctionManager.info.auction)
        ]
      );

      await sendTransactions(
        connection,
        wallet,
        instructions,
        signers,
        SequenceType.StopOnFailure,
        'max'
      );
    }
  }
}

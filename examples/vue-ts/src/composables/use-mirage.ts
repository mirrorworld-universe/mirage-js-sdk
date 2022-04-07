import { Connection } from '@solana/web3.js';
import { ComputedRef } from 'vue';
import { createContext } from './context';
import {
  Mirage,
  MIRAGE_AUCTION_HOUSE_AUTHORITY,
  NFT_STORAGE_API_KEY,
} from '@mirrorworld/mirage.core';
import type { Wallet } from '@project-serum/anchor';

const [MirageContextProvider, useMirage, MirageInjectionKey] = createContext<
  ComputedRef<Mirage>
>({
  name: 'MirageContext',
  strict: true,
  errorMessage: 'useMirage requires you to provide the connection hook',
});

export function initializeMirage(clusterUrl: string, wallet: Wallet) {
  try {
    const connection = new Connection(clusterUrl, 'recent');
    const mirage = new Mirage({
      connection,
      wallet,
      NFTStorageAPIKey: NFT_STORAGE_API_KEY,
      auctionHouseAuthority: MIRAGE_AUCTION_HOUSE_AUTHORITY,
    });

    console.log('mirage initialized', mirage);

    return mirage;
  } catch (error) {
    console.error('There was a problem initializing mirage', error);
  }
}

export { MirageContextProvider, useMirage, MirageInjectionKey };

import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

import { queryExtendedMetadata } from './queryExtendedMetadata';
import { getEmptyMetaState } from './getEmptyMetaState';
import {
  limitedLoadAccounts,
  loadAccounts,
  pullYourMetadata,
  USE_SPEED_RUN,
} from './loadAccounts';
import { MetaContextState, MetaState } from './types';
import { useConnection } from '../connection';
import { useStore } from '../store';
import {
  AuctionData,
  BidderMetadata,
  BidderPot,
  StringPublicKey,
  TokenAccount,
} from '@mirrorworld/mirage.utils';
import {
  pullAuctionSubaccounts,
  pullPage,
  pullPayoutTickets,
  pullStoreMetadata,
} from '.';
import { useUserAccounts } from '../../hooks';

const MetaContext = React.createContext<MetaContextState>({
  ...getEmptyMetaState(),
  isLoading: false,
  isFetching: false,
  // @ts-ignore
  update: () => [AuctionData, BidderMetadata, BidderPot],
});

export function MetaProvider({ children = null as any }) {
  const connection = useConnection();
  const { isReady, storeAddress } = useStore();
  const wallet = useWallet();

  const [state, setState] = useState<MetaState>(getEmptyMetaState());
  const [page, setPage] = useState(0);
  const [lastLength, setLastLength] = useState(0);
  const { userAccounts } = useUserAccounts();

  const [isLoading, setIsLoading] = useState(false);
  const updateRequestsInQueue = useRef(0);

  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const loadedMetadataLength = useRef(0);

  const updateMints = useCallback(
    async (metadataByMint) => {
      try {
        const { metadata, mintToMetadata } = await queryExtendedMetadata(
          connection,
          metadataByMint
        );
        setState((current) => ({
          ...current,
          metadata,
          metadataByMint: mintToMetadata,
        }));
      } catch (er) {
        console.error(er);
      }
    },
    [setState]
  );
  async function pullAllMetadata() {
    if (isLoading) return false;
    if (!storeAddress) {
      if (isReady) {
        setIsLoading(false);
      }
      return;
    } else if (!state.store) {
      setIsLoading(true);
    }
    setIsLoading(true);

    const nextState = await pullStoreMetadata(connection, state);

    setIsLoading(false);
    setState(nextState);
    await updateMints(nextState.metadataByMint);
    return [];
  }

  async function pullBillingPage(auctionAddress: StringPublicKey) {
    if (isLoading) return false;
    if (!storeAddress) {
      if (isReady) {
        setIsLoading(false);
      }
      return;
    } else if (!state.store) {
      setIsLoading(true);
    }
    const nextState = await pullAuctionSubaccounts(
      connection,
      auctionAddress,
      state
    );

    await pullPayoutTickets(connection, nextState);

    setState(nextState);
    await updateMints(nextState.metadataByMint);
    return [];
  }

  async function pullAuctionPage(auctionAddress: StringPublicKey) {
    if (isLoading) return state;
    if (!storeAddress) {
      if (isReady) {
        setIsLoading(false);
      }
      return state;
    } else if (!state.store) {
      setIsLoading(true);
    }
    const nextState = await pullAuctionSubaccounts(
      connection,
      auctionAddress,
      state
    );
    setState(nextState);
    await updateMints(nextState.metadataByMint);
    return nextState;
  }

  async function pullItemsPage(
    userTokenAccounts: TokenAccount[]
  ): Promise<void> {
    if (isFetching) {
      return;
    }

    await pullUserMetadata(userTokenAccounts, state);
  }

  async function pullUserMetadata(
    userTokenAccounts: TokenAccount[],
    tempState?: MetaState
  ): Promise<void> {
    setIsLoadingMetadata(true);
    loadedMetadataLength.current = userTokenAccounts.length;

    const nextState = await pullYourMetadata(
      connection,
      userTokenAccounts,
      tempState || state
    );
    await updateMints(nextState.metadataByMint);

    setState(nextState);
    setIsLoadingMetadata(false);
  }

  async function pullAllSiteData() {
    if (isLoading) return state;
    if (!storeAddress) {
      if (isReady) {
        setIsLoading(false);
      }
      return state;
    } else if (!state.store) {
      setIsLoading(true);
    }
    const nextState = await loadAccounts(connection, state);

    setState(nextState);
    return;
  }

  async function update(auctionAddress?: any, bidderAddress?: any) {
    if (!storeAddress) {
      if (isReady) {
        //@ts-ignore
        window.loadingData = false;
        setIsLoading(false);
      }
      return;
    } else if (!state.store) {
      //@ts-ignore
      window.loadingData = true;
      setIsLoading(true);
    }

    let nextState = await pullPage(connection, page, state, wallet?.publicKey);

    const auction = window.location.href.match(/#\/auction\/(\w+)/);
    const billing = window.location.href.match(/#\/auction\/(\w+)/);
    if (auction && page === 0) {
      nextState = await pullAuctionSubaccounts(
        connection,
        auction[1],
        nextState
      );

      if (billing) {
        await pullPayoutTickets(connection, nextState);
      }
    }

    let currLastLength;
    setLastLength((last) => {
      currLastLength = last;
      return last;
    });
    if (nextState.storeIndexer.length != currLastLength) {
      setPage((page) => page + 1);
    }
    setLastLength(nextState.storeIndexer.length);

    //@ts-ignore
    window.loadingData = false;
    setIsLoading(false);
    setState(nextState);

    if (auctionAddress) {
      nextState = await pullAuctionSubaccounts(
        connection,
        auctionAddress,
        nextState
      );
      setState(nextState);
      //@ts-ignore
      window.loadingData = false;
      setIsLoading(false);
    }

    if (auctionAddress && bidderAddress) {
      const auctionBidderKey = auctionAddress + '-' + bidderAddress;
      return [
        nextState.auctions[auctionAddress],
        nextState.bidderPotsByAuctionAndBidder[auctionBidderKey],
        nextState.bidderMetadataByAuctionAndBidder[auctionBidderKey],
      ];
    }
  }

  useEffect(() => {
    //@ts-ignore
    if (window.loadingData) {
      updateRequestsInQueue.current += 1;
      const interval = setInterval(() => {
        //@ts-ignore
        if (window.loadingData) {
        } else {
          update(undefined, undefined);
          updateRequestsInQueue.current -= 1;
          clearInterval(interval);
        }
      }, 3000);
    } else {
      update(undefined, undefined);
      updateRequestsInQueue.current = 0;
    }
  }, [connection, setState, updateMints, storeAddress, isReady, page]);

  useEffect(() => {
    const shouldFetch =
      !isLoading &&
      !isLoadingMetadata &&
      loadedMetadataLength.current !== userAccounts.length;

    if (shouldFetch) {
      pullUserMetadata(userAccounts);
    }
  }, [
    isLoading,
    isLoadingMetadata,
    loadedMetadataLength.current,
    userAccounts.length,
  ]);

  const isFetching = isLoading || updateRequestsInQueue.current > 0;

  return (
    <MetaContext.Provider
      value={{
        ...state,
        // @ts-ignore
        update,
        pullAuctionPage,
        pullAllMetadata,
        pullBillingPage,
        // @ts-ignore
        pullAllSiteData,
        pullItemsPage,
        pullUserMetadata,
        isLoading,
        isFetching,
      }}
    >
      {children}
    </MetaContext.Provider>
  );
}

export const useMeta = () => {
  const context = useContext(MetaContext);
  return context;
};

import {
  AccountAndPubkey,
  AUCTION_ID,
  getProgramAccounts,
  MAX_WHITELISTED_CREATOR_SIZE,
  METAPLEX_ID,
  ParsedAccount,
  VAULT_ID,
} from '@mirrorworld/mirage.utils';
import { Connection } from '@solana/web3.js';
import uniqWith from 'lodash.uniqwith';
import { MetaState } from '../listing/types';
import { Metadata, ProcessAccountsFunc } from '../types';
import {
  makeSetter,
  processingAccounts,
  pullEditions,
  pullMetadataByCreators,
} from '../utils';
import { processAuctions } from './processors/auctions';
import { processMetaplexAccounts } from './processors/metaplex-accounts';
import { processVaultData } from './processors/vault';

export const loadAccounts = async (
  connection: Connection,
  state: MetaState
) => {
  const updateState = makeSetter(state);
  const forEachAccount = processingAccounts(updateState);

  const forEach =
    (fn: ProcessAccountsFunc) => async (accounts: AccountAndPubkey[]) => {
      for (const account of accounts) {
        await fn(account, updateState);
      }
    };

  const loadVaults = () =>
    getProgramAccounts(connection, VAULT_ID).then(
      forEachAccount(processVaultData)
    );
  const loadAuctions = () =>
    getProgramAccounts(connection, AUCTION_ID).then(
      forEachAccount(processAuctions)
    );
  const loadMetaplex = () =>
    getProgramAccounts(connection, METAPLEX_ID).then(
      forEachAccount(processMetaplexAccounts)
    );
  const loadCreators = () =>
    getProgramAccounts(connection, METAPLEX_ID, {
      filters: [
        {
          dataSize: MAX_WHITELISTED_CREATOR_SIZE,
        },
      ],
    }).then(forEach(processMetaplexAccounts));
  const loadMetadata = () =>
    pullMetadataByCreators(connection, state, updateState);
  const loadEditions = () =>
    pullEditions(connection, updateState, state, state.metadata);

  const loading = [
    loadCreators().then(loadMetadata).then(loadEditions),
    loadVaults(),
    loadAuctions(),
    loadMetaplex(),
  ];

  await Promise.all(loading);

  state.metadata = uniqWith(
    state.metadata,
    (a: ParsedAccount<Metadata>, b: ParsedAccount<Metadata>) =>
      a.pubkey === b.pubkey
  );

  return state;
};

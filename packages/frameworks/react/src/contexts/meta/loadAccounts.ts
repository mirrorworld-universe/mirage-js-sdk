import {
  AUCTION_ID,
  METADATA_PROGRAM_ID,
  METAPLEX_ID,
  StringPublicKey,
  toPublicKey,
  VAULT_ID,
  MAX_WHITELISTED_CREATOR_SIZE,
  TokenAccount,
  getEdition,
  Metadata,
  MAX_CREATOR_LEN,
  MAX_CREATOR_LIMIT,
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_URI_LENGTH,
  decodeMetadata,
  getAuctionExtended,
  getMetadata,
  decodeStoreIndexer,
  getAuctionCache,
  getStoreIndexer,
  MAX_PAYOUT_TICKET_SIZE,
  StoreIndexer,
  WhitelistedCreator,
  createPipelineExecutor,
  programIds,
} from '@mirrorworld/mirage.utils';

import { uniqWith } from 'lodash';
import { Connection, PublicKey } from '@solana/web3.js';
import {
  AccountAndPubkey,
  MetaState,
  ProcessAccountsFunc,
  UpdateStateValueFunc,
  UnPromise,
} from './types';
import { isMetadataPartOfStore } from './isMetadataPartOfStore';
import { processAuctions } from './processAuctions';
import { processMetaplexAccounts } from './processMetaplexAccounts';
import { processMetaData } from './processMetaData';
import { processVaultData } from './processVaultData';
import { ParsedAccount } from '../accounts/types';
import { getEmptyMetaState } from './getEmptyMetaState';
import { getMultipleAccounts } from '../accounts/getMultipleAccounts';
import { getProgramAccounts } from './web3';
import { pullAuctions } from './pullAuctions';
const MULTIPLE_ACCOUNT_BATCH_SIZE = 100;

export const USE_SPEED_RUN = false;
const WHITELISTED_METADATA = ['98vYFjBYS9TguUMWQRPjy2SZuxKuUMcqR4vnQiLjZbte'];
const WHITELISTED_AUCTION = ['D8wMB5iLZnsV7XQjpwqXaDynUtFuDs7cRXvEGNj1NF1e'];
const AUCTION_TO_METADATA: Record<string, string[]> = {
  D8wMB5iLZnsV7XQjpwqXaDynUtFuDs7cRXvEGNj1NF1e: [
    '98vYFjBYS9TguUMWQRPjy2SZuxKuUMcqR4vnQiLjZbte',
  ],
};
const AUCTION_TO_VAULT: Record<string, string> = {
  D8wMB5iLZnsV7XQjpwqXaDynUtFuDs7cRXvEGNj1NF1e:
    '3wHCBd3fYRPWjd5GqzrXanLJUKRyU3nECKbTPKfVwcFX',
};
const WHITELISTED_AUCTION_MANAGER = [
  '3HD2C8oCL8dpqbXo8hq3CMw6tRSZDZJGajLxnrZ3ZkYx',
];
const WHITELISTED_VAULT = ['3wHCBd3fYRPWjd5GqzrXanLJUKRyU3nECKbTPKfVwcFX'];

export const pullStoreMetadata = async (
  connection: Connection,
  tempCache: MetaState
) => {
  const updateTemp = makeSetter(tempCache);

  const loadMetadata = () =>
    pullMetadataByCreators(connection, tempCache, updateTemp);
  const loadEditions = () =>
    pullEditions(connection, updateTemp, tempCache, tempCache.metadata);

  await loadMetadata();
  await loadEditions();

  await postProcessMetadata(tempCache);
  return tempCache;
};

export const pullYourMetadata = async (
  connection: Connection,
  userTokenAccounts: TokenAccount[],
  tempCache: MetaState
) => {
  const updateTemp = makeSetter(tempCache);

  let currBatch: string[] = [];
  let batches: Array<Array<string>> = [];
  const editions: Array<string> = [];
  for (let i = 0; i < userTokenAccounts.length; i++) {
    if (userTokenAccounts[i].info.amount.toNumber() == 1) {
      if (2 + currBatch.length > MULTIPLE_ACCOUNT_BATCH_SIZE) {
        batches.push(currBatch);
        currBatch = [];
      } else {
        const edition = await getEdition(
          userTokenAccounts[i].info.mint.toBase58()
        );
        const newAdd = [
          await getMetadata(userTokenAccounts[i].info.mint.toBase58()),
          edition,
        ];
        editions.push(edition);
        currBatch = currBatch.concat(newAdd);
      }
    }
  }

  if (currBatch.length > 0 && currBatch.length <= MULTIPLE_ACCOUNT_BATCH_SIZE) {
    batches.push(currBatch);
  }

  for (let i = 0; i < batches.length; i++) {
    const accounts = await getMultipleAccounts(
      connection,
      batches[i],
      'single'
    );
    if (accounts) {
      for (let j = 0; j < accounts.keys.length; j++) {
        const pubkey = accounts.keys[j];
        await processMetaData(
          {
            pubkey,
            account: accounts.array[j],
          },
          updateTemp
        );
      }
    } else {
    }
  }

  currBatch = [];
  batches = [];
  for (let i = 0; i < editions.length; i++) {
    if (1 + currBatch.length > MULTIPLE_ACCOUNT_BATCH_SIZE) {
      batches.push(currBatch);
      currBatch = [];
    } else if (tempCache.editions[editions[i]]) {
      currBatch.push(tempCache.editions[editions[i]].info.parent);
    }
  }

  if (currBatch.length > 0 && currBatch.length <= MULTIPLE_ACCOUNT_BATCH_SIZE) {
    batches.push(currBatch);
  }

  for (let i = 0; i < batches.length; i++) {
    const accounts = await getMultipleAccounts(
      connection,
      batches[i],
      'single'
    );
    if (accounts) {
      for (let j = 0; j < accounts.keys.length; j++) {
        const pubkey = accounts.keys[j];
        await processMetaData(
          {
            pubkey,
            account: accounts.array[j],
          },
          updateTemp
        );
      }
    } else {
    }
  }

  await postProcessMetadata(tempCache);

  return tempCache;
};

export const pullPayoutTickets = async (
  connection: Connection,
  tempCache: MetaState
) => {
  const updateTemp = makeSetter(tempCache);

  const forEach =
    (fn: ProcessAccountsFunc) => async (accounts: AccountAndPubkey[]) => {
      for (const account of accounts) {
        await fn(account, updateTemp);
      }
    };
  getProgramAccounts(connection, METAPLEX_ID, {
    filters: [
      {
        dataSize: MAX_PAYOUT_TICKET_SIZE,
      },
    ],
  }).then(forEach(processMetaplexAccounts));

  return tempCache;
};

export const pullAuctionSubaccounts = async (
  connection: Connection,
  auction: StringPublicKey,
  tempCache: MetaState
) => {
  const updateTemp = makeSetter(tempCache);
  let cacheKey;
  try {
    cacheKey = await getAuctionCache(auction);
  } catch (e) {
    console.log(e);
    return tempCache;
  }
  const cache = tempCache.auctionCaches[cacheKey]?.info;
  if (!cache) {
    return tempCache;
  }
  const forEach =
    (fn: ProcessAccountsFunc) => async (accounts: AccountAndPubkey[]) => {
      for (const account of accounts) {
        await fn(account, updateTemp);
      }
    };
  const auctionExtKey = await getAuctionExtended({
    auctionProgramId: AUCTION_ID,
    resource: cache.vault,
  });
  const promises = [
    // pull editions
    pullEditions(
      connection,
      updateTemp,
      tempCache,
      cache.metadata.map((m: any) => tempCache.metadataByMetadata[m])
    ),
    // pull auction data ext
    connection
      .getAccountInfo(toPublicKey(auctionExtKey))
      .then((a) =>
        a
          ? processAuctions({ pubkey: auctionExtKey, account: a }, updateTemp)
          : null
      ),
    // bidder metadata pull
    getProgramAccounts(connection, AUCTION_ID, {
      filters: [
        {
          memcmp: {
            offset: 32,
            bytes: auction,
          },
        },
      ],
    }).then(forEach(processAuctions)),

    // bidder pot pull
    getProgramAccounts(connection, AUCTION_ID, {
      filters: [
        {
          memcmp: {
            offset: 64,
            bytes: auction,
          },
        },
      ],
    }).then(forEach(processAuctions)),
    // safety deposit pull
    getProgramAccounts(connection, VAULT_ID, {
      filters: [
        {
          memcmp: {
            offset: 1,
            bytes: cache.vault,
          },
        },
      ],
    }).then(forEach(processVaultData)),

    // bid redemptions
    getProgramAccounts(connection, METAPLEX_ID, {
      filters: [
        {
          memcmp: {
            offset: 10,
            bytes: cache.auctionManager,
          },
        },
      ],
    }).then(forEach(processMetaplexAccounts)),
    // bdis where you arent winner
    getProgramAccounts(connection, METAPLEX_ID, {
      filters: [
        {
          memcmp: {
            offset: 2,
            bytes: cache.auctionManager,
          },
        },
      ],
    }).then(forEach(processMetaplexAccounts)),
    // safety deposit configs
    getProgramAccounts(connection, METAPLEX_ID, {
      filters: [
        {
          memcmp: {
            offset: 1,
            bytes: cache.auctionManager,
          },
        },
      ],
    }).then(forEach(processMetaplexAccounts)),
    // prize tracking tickets
    ...cache.metadata
      .map((md: any) =>
        getProgramAccounts(connection, METAPLEX_ID, {
          filters: [
            {
              memcmp: {
                offset: 1,
                bytes: md,
              },
            },
          ],
        }).then(forEach(processMetaplexAccounts))
      )
      .flat(),
  ];
  await Promise.all(promises);
  return tempCache;
};

export const pullPages = async (
  connection: Connection
): Promise<ParsedAccount<StoreIndexer>[]> => {
  let i = 0;

  let pageKey = await getStoreIndexer(i);
  let account = await connection.getAccountInfo(new PublicKey(pageKey));
  const pages: ParsedAccount<StoreIndexer>[] = [];
  while (account) {
    pages.push({
      info: decodeStoreIndexer(account.data),
      pubkey: pageKey,
      account,
    });
    i++;

    pageKey = await getStoreIndexer(i);
    account = await connection.getAccountInfo(new PublicKey(pageKey));
  }
  return pages;
};

export const pullPage = async (
  connection: Connection,
  page: number,
  tempCache: MetaState,
  walletKey?: PublicKey | null
) => {
  const updateTemp = makeSetter(tempCache);
  const forEach =
    (fn: ProcessAccountsFunc) => async (accounts: AccountAndPubkey[]) => {
      for (const account of accounts) {
        await fn(account, updateTemp);
      }
    };
  const pageKey = await getStoreIndexer(page);
  const account = await connection.getAccountInfo(new PublicKey(pageKey));

  if (account) {
    processMetaplexAccounts(
      {
        pubkey: pageKey,
        account,
      },
      updateTemp
    );

    const newPage = tempCache.storeIndexer.find((s) => s.pubkey == pageKey);

    const auctionCaches = await getMultipleAccounts(
      connection,
      newPage?.info.auctionCaches || [],
      'single'
    );

    if (auctionCaches && auctionCaches.keys.length) {
      auctionCaches.keys.map((pubkey, i) => {
        processMetaplexAccounts(
          {
            pubkey,
            account: auctionCaches.array[i],
          },
          updateTemp
        );
      });

      const batches: Array<StringPublicKey[]> = [];

      let currBatch: StringPublicKey[] = [];
      for (let i = 0; i < auctionCaches.keys.length; i++) {
        const cache = tempCache.auctionCaches[auctionCaches.keys[i]];

        const totalNewAccountsToAdd = cache.info.metadata.length + 3;

        if (
          totalNewAccountsToAdd + currBatch.length >
          MULTIPLE_ACCOUNT_BATCH_SIZE
        ) {
          batches.push(currBatch);
          currBatch = [];
        } else {
          const newAdd = [
            ...cache.info.metadata,
            cache.info.auction,
            cache.info.auctionManager,
            cache.info.vault,
          ];
          currBatch = currBatch.concat(newAdd);
        }
      }

      if (
        currBatch.length > 0 &&
        currBatch.length <= MULTIPLE_ACCOUNT_BATCH_SIZE
      ) {
        batches.push(currBatch);
      }
      for (let i = 0; i < batches.length; i++) {
        const accounts = await getMultipleAccounts(
          connection,
          batches[i],
          'single'
        );
        if (accounts) {
          for (let i = 0; i < accounts.keys.length; i++) {
            const pubkey = accounts.keys[i];
            await processMetaplexAccounts(
              {
                pubkey,
                account: accounts.array[i],
              },
              updateTemp
            );
            await processVaultData(
              {
                pubkey,
                account: accounts.array[i],
              },
              updateTemp
            );
            await processMetaData(
              {
                pubkey,
                account: accounts.array[i],
              },
              updateTemp
            );
            await processAuctions(
              {
                pubkey,
                account: accounts.array[i],
              },
              updateTemp
            );
          }
        } else {
        }
      }

      for (let i = 0; i < auctionCaches.keys.length; i++) {
        const auctionCache = tempCache.auctionCaches[auctionCaches.keys[i]];

        const metadata = auctionCache.info.metadata.map(
          (s: any) => tempCache.metadataByMetadata[s]
        );
        tempCache.metadataByAuction[auctionCache.info.auction] = metadata;
      }
    }

    if (page == 0) {
      await getProgramAccounts(connection, METAPLEX_ID, {
        filters: [
          {
            dataSize: MAX_WHITELISTED_CREATOR_SIZE,
          },
        ],
      }).then(forEach(processMetaplexAccounts));
      await pullAuctions({
        connection,
        auctionManagersByAuction: tempCache.auctionManagersByAuction,
      }).then((accounts) => accounts.forEach(forEach(processAuctions)));

      const store = programIds().store;
      if (store) {
        const storeAcc = await connection.getAccountInfo(store);
        if (storeAcc) {
          await processMetaplexAccounts(
            { pubkey: store.toBase58(), account: storeAcc },
            updateTemp
          );
        }
      }
    }

    await postProcessMetadata(tempCache);
  }

  return tempCache;
};

export const limitedLoadAccounts = async (connection: Connection) => {
  const tempCache: MetaState = getEmptyMetaState();
  const updateTemp = makeSetter(tempCache);

  const forEach =
    (fn: ProcessAccountsFunc) => async (accounts: AccountAndPubkey[]) => {
      for (const account of accounts) {
        await fn(account, updateTemp);
      }
    };

  const pullMetadata = async (metadata: string) => {
    const mdKey = new PublicKey(metadata);
    const md = await connection.getAccountInfo(mdKey);
    const mdObject = decodeMetadata(
      Buffer.from(md?.data || new Uint8Array([]))
    );
    const editionKey = await getEdition(mdObject.mint);
    const editionData = await connection.getAccountInfo(
      new PublicKey(editionKey)
    );
    if (md) {
      //@ts-ignore
      md.owner = md.owner.toBase58();
      processMetaData(
        {
          pubkey: metadata,
          account: md,
        },
        updateTemp
      );
      if (editionData) {
        //@ts-ignore
        editionData.owner = editionData.owner.toBase58();
        processMetaData(
          {
            pubkey: editionKey,
            account: editionData,
          },
          updateTemp
        );
      }
    }
  };

  const pullAuction = async (auction: string) => {
    const auctionExtendedKey = await getAuctionExtended({
      auctionProgramId: AUCTION_ID,
      resource: AUCTION_TO_VAULT[auction],
    });

    const auctionData = await getMultipleAccounts(
      connection,
      [auction, auctionExtendedKey],
      'single'
    );

    if (auctionData) {
      auctionData.keys.map((pubkey, i) => {
        processAuctions(
          {
            pubkey,
            account: auctionData.array[i],
          },
          updateTemp
        );
      });
    }
  };

  const pullAuctionManager = async (auctionManager: string) => {
    const auctionManagerKey = new PublicKey(auctionManager);
    const auctionManagerData = await connection.getAccountInfo(
      auctionManagerKey
    );
    if (auctionManagerData) {
      //@ts-ignore
      auctionManagerData.owner = auctionManagerData.owner.toBase58();
      processMetaplexAccounts(
        {
          pubkey: auctionManager,
          account: auctionManagerData,
        },
        updateTemp
      );
    }
  };

  const pullVault = async (vault: string) => {
    const vaultKey = new PublicKey(vault);
    const vaultData = await connection.getAccountInfo(vaultKey);
    if (vaultData) {
      //@ts-ignore
      vaultData.owner = vaultData.owner.toBase58();
      processVaultData(
        {
          pubkey: vault,
          account: vaultData,
        },
        updateTemp
      );
    }
  };

  const promises = [
    ...WHITELISTED_METADATA.map((md) => pullMetadata(md)),
    ...WHITELISTED_AUCTION.map((a) => pullAuction(a)),
    ...WHITELISTED_AUCTION_MANAGER.map((a) => pullAuctionManager(a)),
    ...WHITELISTED_VAULT.map((a) => pullVault(a)),
    // bidder metadata pull
    ...WHITELISTED_AUCTION.map((a) =>
      getProgramAccounts(connection, AUCTION_ID, {
        filters: [
          {
            memcmp: {
              offset: 32,
              bytes: a,
            },
          },
        ],
      }).then(forEach(processAuctions))
    ),
    // bidder pot pull
    ...WHITELISTED_AUCTION.map((a) =>
      getProgramAccounts(connection, AUCTION_ID, {
        filters: [
          {
            memcmp: {
              offset: 64,
              bytes: a,
            },
          },
        ],
      }).then(forEach(processAuctions))
    ),
    // safety deposit pull
    ...WHITELISTED_VAULT.map((v) =>
      getProgramAccounts(connection, VAULT_ID, {
        filters: [
          {
            memcmp: {
              offset: 1,
              bytes: v,
            },
          },
        ],
      }).then(forEach(processVaultData))
    ),
    // bid redemptions
    ...WHITELISTED_AUCTION_MANAGER.map((a) =>
      getProgramAccounts(connection, METAPLEX_ID, {
        filters: [
          {
            memcmp: {
              offset: 9,
              bytes: a,
            },
          },
        ],
      }).then(forEach(processMetaplexAccounts))
    ),
    // safety deposit configs
    ...WHITELISTED_AUCTION_MANAGER.map((a) =>
      getProgramAccounts(connection, METAPLEX_ID, {
        filters: [
          {
            memcmp: {
              offset: 1,
              bytes: a,
            },
          },
        ],
      }).then(forEach(processMetaplexAccounts))
    ),
    // prize tracking tickets
    ...Object.keys(AUCTION_TO_METADATA)
      .map((key) =>
        AUCTION_TO_METADATA[key]
          .map((md) =>
            getProgramAccounts(connection, METAPLEX_ID, {
              filters: [
                {
                  memcmp: {
                    offset: 1,
                    bytes: md,
                  },
                },
              ],
            }).then(forEach(processMetaplexAccounts))
          )
          .flat()
      )
      .flat(),
    // whitelisted creators
    getProgramAccounts(connection, METAPLEX_ID, {
      filters: [
        {
          dataSize: MAX_WHITELISTED_CREATOR_SIZE,
        },
      ],
    }).then(forEach(processMetaplexAccounts)),
  ];

  await Promise.all(promises);

  await postProcessMetadata(tempCache);

  return tempCache;
};

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

const pullEditions = async (
  connection: Connection,
  updater: UpdateStateValueFunc,
  state: MetaState,
  metadataArr: ParsedAccount<Metadata>[]
) => {
  type MultipleAccounts = UnPromise<ReturnType<typeof getMultipleAccounts>>;
  let setOf100MetadataEditionKeys: string[] = [];
  const editionPromises: Promise<void>[] = [];

  const loadBatch = () => {
    editionPromises.push(
      getMultipleAccounts(
        connection,
        setOf100MetadataEditionKeys,
        'recent'
      ).then(processEditions)
    );
    setOf100MetadataEditionKeys = [];
  };

  const processEditions = (returnedAccounts: MultipleAccounts) => {
    for (let j = 0; j < returnedAccounts.array.length; j++) {
      processMetaData(
        {
          pubkey: returnedAccounts.keys[j],
          account: returnedAccounts.array[j],
        },
        updater
      );
    }
  };

  for (const metadata of metadataArr) {
    // let editionKey: StringPublicKey;
    // TODO the nonce builder isnt working here, figure out why
    //if (metadata.info.editionNonce === null) {
    const editionKey = await getEdition(metadata.info.mint);
    /*} else {
      editionKey = (
        await PublicKey.createProgramAddress(
          [
            Buffer.from(METADATA_PREFIX),
            toPublicKey(METADATA_PROGRAM_ID).toBuffer(),
            toPublicKey(metadata.info.mint).toBuffer(),
            new Uint8Array([metadata.info.editionNonce || 0]),
          ],
          toPublicKey(METADATA_PROGRAM_ID),
        )
      ).toBase58();
    }*/

    setOf100MetadataEditionKeys.push(editionKey);

    if (setOf100MetadataEditionKeys.length >= 100) {
      loadBatch();
    }
  }

  if (setOf100MetadataEditionKeys.length >= 0) {
    loadBatch();
  }

  await Promise.all(editionPromises);
};

const pullMetadataByCreators = (
  connection: Connection,
  state: MetaState,
  updater: UpdateStateValueFunc
): Promise<any> => {
  const whitelistedCreators = Object.values(state.whitelistedCreatorsByCreator);

  const setter: UpdateStateValueFunc = async (prop, key, value) => {
    if (prop === 'metadataByMint') {
      await initMetadata(value, state.whitelistedCreatorsByCreator, updater);
    } else {
      updater(prop, key, value);
    }
  };
  const forEachAccount = processingAccounts(setter);

  const additionalPromises: Promise<void>[] = [];
  for (const creator of whitelistedCreators) {
    for (let i = 0; i < MAX_CREATOR_LIMIT; i++) {
      const promise = getProgramAccounts(connection, METADATA_PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset:
                1 + // key
                32 + // update auth
                32 + // mint
                4 + // name string length
                MAX_NAME_LENGTH + // name
                4 + // uri string length
                MAX_URI_LENGTH + // uri
                4 + // symbol string length
                MAX_SYMBOL_LENGTH + // symbol
                2 + // seller fee basis points
                1 + // whether or not there is a creators vec
                4 + // creators vec length
                i * MAX_CREATOR_LEN,
              bytes: creator.info.address,
            },
          },
        ],
      }).then(forEachAccount(processMetaData));
      additionalPromises.push(promise);
    }
  }

  return Promise.all(additionalPromises);
};

export const pullMetadataByKeys = async (
  connection: Connection,
  state: MetaState,
  metadataKeys: StringPublicKey[]
): Promise<MetaState> => {
  const updateState = makeSetter(state);

  let setOf100MetadataEditionKeys: string[] = [];
  const metadataPromises: Promise<void>[] = [];

  const loadBatch = () => {
    metadataPromises.push(
      getMultipleAccounts(
        connection,
        setOf100MetadataEditionKeys,
        'recent'
      ).then(({ keys, array }) => {
        keys.forEach((key, index) =>
          processMetaData({ pubkey: key, account: array[index] }, updateState)
        );
      })
    );
    setOf100MetadataEditionKeys = [];
  };

  for (const metadata of metadataKeys) {
    setOf100MetadataEditionKeys.push(metadata);

    if (setOf100MetadataEditionKeys.length >= 100) {
      loadBatch();
    }
  }

  if (setOf100MetadataEditionKeys.length >= 0) {
    loadBatch();
  }

  await Promise.all(metadataPromises);
  return state;
};

export const makeSetter =
  (state: MetaState): UpdateStateValueFunc<MetaState> =>
  (prop, key, value) => {
    if (prop === 'store') {
      state[prop] = value;
    } else if (prop === 'metadata') {
      state.metadata.push(value);
    } else if (prop === 'storeIndexer') {
      state.storeIndexer = state.storeIndexer.filter(
        (p) => p.info.page.toNumber() != value.info.page.toNumber()
      );
      state.storeIndexer.push(value);
      state.storeIndexer = state.storeIndexer.sort((a, b) =>
        a.info.page.sub(b.info.page).toNumber()
      );
    } else {
      state[prop][key] = value;
    }
    return state;
  };

export const processingAccounts =
  (updater: UpdateStateValueFunc) =>
  (fn: ProcessAccountsFunc) =>
  async (accounts: AccountAndPubkey[]) => {
    await createPipelineExecutor(
      accounts.values(),
      (account) => fn(account, updater),
      {
        sequence: 10,
        delay: 1,
        jobsCount: 3,
      }
    );
  };

const postProcessMetadata = async (state: MetaState) => {
  const values = Object.values(state.metadataByMint);

  for (const metadata of values) {
    await metadataByMintUpdater(metadata, state);
  }
};

export const metadataByMintUpdater = async (
  metadata: ParsedAccount<Metadata>,
  state: MetaState
) => {
  const key = metadata.info.mint;
  if (isMetadataPartOfStore(metadata, state.whitelistedCreatorsByCreator)) {
    await metadata.info.init();
    const masterEditionKey = metadata.info?.masterEdition;
    if (masterEditionKey) {
      state.metadataByMasterEdition[masterEditionKey] = metadata;
    }
    if (
      !state.metadata.some(
        ({ pubkey }) => metadata && metadata.pubkey === pubkey
      )
    ) {
      state.metadata.push(metadata);
    }
    state.metadataByMint[key] = metadata;
  } else {
    delete state.metadataByMint[key];
  }
  return state;
};

export const initMetadata = async (
  metadata: ParsedAccount<Metadata>,
  whitelistedCreators: Record<string, ParsedAccount<WhitelistedCreator>>,
  setter: UpdateStateValueFunc
) => {
  if (isMetadataPartOfStore(metadata, whitelistedCreators)) {
    await metadata.info.init();
    setter('metadataByMint', metadata.info.mint, metadata);
    setter('metadata', '', metadata);
    const masterEditionKey = metadata.info?.masterEdition;
    if (masterEditionKey) {
      setter('metadataByMasterEdition', masterEditionKey, metadata);
    }
  }
};

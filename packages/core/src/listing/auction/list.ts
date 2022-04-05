import {
  AmountRange,
  cache,
  Endpoint,
  IPartialCreateAuctionArgs,
  loadAccounts,
  metadataByMintUpdater,
  PriceFloor,
  PriceFloorType,
  programIds,
  pullPage,
  pullPages,
  pullStoreMetadata,
  pullYourMetadata,
  queryExtendedMetadata,
  StringPublicKey,
  TokenAccount,
  TokenAccountParser,
  WalletSigner,
  WinnerLimit,
  WinnerLimitType,
  WinningConfigType,
  WRAPPED_SOL_MINT,
} from '@mirrorworld/mirage.utils';
import dayjs from 'dayjs';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import BN from 'bn.js';
import { getMint } from '../../queries';
import { InstantSaleType, TieredAuctionState } from '../../types';
import { QUOTE_MINT } from '../constants';
import { createAuctionManager } from '../auction/auction-house/createAuctionManager';
import { MetaState } from '../types';
import { AuctionCategory, AuctionState } from './auction.types';
import { getTokenListByNetwork } from './auction.utils';
import {
  getMetaState,
  mergeState,
  updateMints,
  __loadedMetadataLength__,
  __state__,
} from '../meta';
import { setupNativeAccount } from '../meta/accounts';
import { getUserArts } from './get-user-arts';

export const DEFAULT_AUCTION_STATE: Omit<
  AuctionState,
  'quoteMintInfo' | 'quoteMintInfoExtended'
> = {
  reservationPrice: 0,
  items: [],
  auctionDurationType: 'minutes',
  auctionDuration: 1440,
  gapTime: 0,
  gapTimeType: 'minutes',
  winnersCount: 1,
  startSaleTS: undefined,
  startListTS: undefined,
  quoteMintAddress: QUOTE_MINT.toBase58(),
  instantSalePrice: 0,
  priceFloor: 0,
  tickSizeEndingPhase: 0,
  category: AuctionCategory.InstantSale,
  instantSaleType: InstantSaleType.Single,
};

const PRECACHED_OWNERS = new Set<string>();
const precacheUserTokenAccounts = async (
  connection: Connection,
  owner?: PublicKey
) => {
  if (!owner) {
    return;
  }

  // used for filtering account updates over websocket
  PRECACHED_OWNERS.add(owner.toBase58());

  // user accounts are updated via ws subscription
  const accounts = await connection.getTokenAccountsByOwner(owner, {
    programId: programIds().token,
  });

  accounts.value.forEach((info) => {
    cache.add(info.pubkey.toBase58(), info.account, TokenAccountParser);
  });
};

const userTokenAccounts = new Map<
  PublicKey,
  {
    tokenAccounts: TokenAccount[];
    accountByMint: Map<string, TokenAccount>;
  }
>();

const selectUserTokens = (walletPublicKey: StringPublicKey) => {
  return cache
    .byParser(TokenAccountParser)
    .map((id) => cache.get(id))
    .filter((a) => a && a.info.owner.toBase58() === walletPublicKey)
    .map((a) => a as TokenAccount);
};

export async function setupMarketplace(
  connection: Connection,
  publicKey: PublicKey
) {
  await setupNativeAccount(connection, publicKey);
  precacheUserTokenAccounts(connection, publicKey).then(() => {
    const tokenAccounts = selectUserTokens(publicKey.toBase58());
    const accountByMint = tokenAccounts.reduce(
      (prev: Map<string, TokenAccount>, acc: TokenAccount) => {
        prev.set(acc.info.mint.toBase58(), acc);
        return prev;
      },
      new Map<string, TokenAccount>()
    );
    userTokenAccounts.set(publicKey, {
      tokenAccounts,
      accountByMint,
    });

    console.log('====== INITIAL ACCOUNTS STATE ======', {
      tokenAccounts,
      accountByMint,
    });
  });
  // await pullPage()
}

export async function createInstantSaleAuction(
  connection: Connection,
  wallet: WalletSigner,
  endpoint: Endpoint,
  mintKey: StringPublicKey,
  salePrice: string
) {
  // Get list of tokens
  const tokenMap = await getTokenListByNetwork(endpoint);

  // Get account of the token being listed
  const mint = await getMint(mintKey, connection);
  console.log({ mint });

  // Attain winner limit
  let winnerLimit: WinnerLimit;

  // Create auction state
  const auctionState: AuctionState = Object.assign(DEFAULT_AUCTION_STATE, {
    quoteMintInfo: mint!,
    quoteMintInfoExtended: tokenMap.get(QUOTE_MINT.toBase58())!,
  });

  const userAccounts = await connection
    .getTokenAccountsByOwner(wallet.publicKey!, {
      programId: programIds().token,
    })
    .then((accounts) => {
      console.log('___ACCOUNTS', accounts);
      return accounts.value
        .filter(
          (a) => a.account.owner.toBase58() === wallet.publicKey!.toBase58()
        )
        .map((acc) => TokenAccountParser(acc.pubkey.toBase58(), acc.account)!);
    });

  const isMasterEdition = !!auctionState?.items?.[0]?.masterEdition;
  const pages = await pullPages(connection);
  const nextState = await Promise.all(
    pages.map(async (a, i) =>
      pullPage(connection, i, getMetaState(), wallet.publicKey!)
    )
  );

  await loadAccounts(connection, getMetaState());
  await pullItemsPage(
    connection,
    userTokenAccounts.get(wallet.publicKey!)!.tokenAccounts!
  );

  const isOpenEdition =
    auctionState.category === AuctionCategory.Open ||
    auctionState.instantSaleType === InstantSaleType.Open;

  const participationSafetyDepositDraft = isOpenEdition
    ? auctionState.items[0]
    : auctionState.participationNFT;

  const tieredAttributes: TieredAuctionState = {
    items: [],
    tiers: [],
  };

  const mints = await updateMints(connection, getMetaState().metadataByMint);
  console.log({
    mints,
  });

  const _nextMetaState = await pullItemsPage(connection, userAccounts);
  await pullStoreMetadata(connection, getMetaState());

  console.log(1, 'Pulled UserMetaData', _nextMetaState);
  const __items__ = await getUserArts(
    userTokenAccounts.get(wallet.publicKey!)?.accountByMint!,
    _nextMetaState
  );

  console.log(2, 'Pulled UserArts', _nextMetaState);

  console.log('__items__', __items__);

  // const safetyDepositDrafts = isOpenEdition
  //   ? []
  //   : auctionState.category !== AuctionCategory.Tiered
  //   ? auctionState.items
  //   : tieredAttributes.items;
  let safetyDepositDrafts = __items__.filter(
    (t) => t.metadata.info.mint.toString() === mintKey
  );

  console.log('mintKey', mintKey);
  auctionState.items = safetyDepositDrafts;

  const { whitelistedCreatorsByCreator, storeIndexer, ...rest } =
    getMetaState();

  // Set price to auction object
  auctionState.instantSalePrice = parseFloat(salePrice);
  auctionState.priceFloor = parseFloat(salePrice);

  // Set auction start list dates
  const listingTime = dayjs(Date.now()).unix();
  auctionState.startListTS = listingTime;
  auctionState.startSaleTS = listingTime;

  const { items, editions } = auctionState;

  if (items.length > 0) {
    const item = items[0];
    if (!editions) {
      item.winningConfigType = WinningConfigType.TokenOnlyTransfer;
    }

    item.amountRanges = [
      new AmountRange({
        amount: new BN(1),
        length: new BN(editions || 1),
      }),
    ];
  }

  winnerLimit = new WinnerLimit({
    type: WinnerLimitType.Capped,
    usize: new BN(editions || 1),
  });

  const LAMPORTS_PER_TOKEN =
    auctionState.quoteMintAddress == WRAPPED_SOL_MINT.toBase58()
      ? LAMPORTS_PER_SOL
      : Math.pow(10, auctionState.quoteMintInfo.decimals || 0);

  const auctionSettings: IPartialCreateAuctionArgs = {
    winners: winnerLimit,
    endAuctionAt: null,
    auctionGap: null,
    priceFloor: new PriceFloor({
      type: auctionState.priceFloor
        ? PriceFloorType.Minimum
        : PriceFloorType.None,
      minPrice: new BN((auctionState.priceFloor || 0) * LAMPORTS_PER_TOKEN),
    }),
    tokenMint: auctionState.quoteMintAddress,
    gapTickSizePercentage: auctionState.tickSizeEndingPhase || null,
    tickSize: auctionState.priceTick
      ? new BN(auctionState.priceTick * LAMPORTS_PER_TOKEN)
      : null,
    instantSalePrice: auctionState.instantSalePrice
      ? new BN((auctionState.instantSalePrice || 0) * LAMPORTS_PER_TOKEN)
      : null,
    name: null,
  };

  console.log('\n ============ \n');
  console.log('createAuctionManager ARGS', {
    auctionSettings,
    safetyDepositDrafts,
    participationSafetyDepositDraft,
    storeIndexer,
    auctionState,
  });

  const _auctionObj = await createAuctionManager(
    connection,
    wallet,
    whitelistedCreatorsByCreator,
    auctionSettings,
    safetyDepositDrafts,
    participationSafetyDepositDraft,
    auctionState.quoteMintAddress,
    storeIndexer
  );

  return _auctionObj;
}

async function pullUserMetadata(
  connection: Connection,
  userTokenAccounts: TokenAccount[],
  tempState?: MetaState
): Promise<MetaState> {
  // __loadedMetadataLength__ = userTokenAccounts.length;

  const nextState = await pullYourMetadata(
    connection,
    userTokenAccounts,
    // @ts-ignore
    tempState || __state__
  );

  console.log('USER METADATA', nextState);
  await updateMints(connection, nextState.metadataByMint);

  return mergeState({
    ...__state__,
    ...nextState,
    ...getMetaState(),
  });
}

async function pullItemsPage(
  connection: Connection,
  userTokenAccounts: TokenAccount[]
): Promise<MetaState> {
  const packsState = getMetaState();
  console.log(' =========== userTokenAccounts ============', userTokenAccounts);
  return await pullUserMetadata(connection, userTokenAccounts, packsState);
}

const postProcessMetadata = async (state: MetaState) => {
  const values = Object.values(state.metadataByMint);

  for (const metadata of values) {
    await metadataByMintUpdater(metadata, state);
  }
};

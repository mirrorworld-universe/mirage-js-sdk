import {
  AmountRange,
  Endpoint,
  findProgramAddress,
  getTokenListContainerPromise,
  INDEX,
  IPartialCreateAuctionArgs,
  METAPLEX_PREFIX,
  PriceFloor,
  PriceFloorType,
  programIds,
  toLamports,
  toPublicKey,
  WalletSigner,
  WinnerLimit,
  WinnerLimitType,
  WinningConfigType,
  WRAPPED_SOL_MINT,
  ZERO,
} from '@mirrorworld/mirage.utils';
import { TokenInfo } from '@solana/spl-token-registry';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
} from '@solana/web3.js';
import BN from 'bn.js';
import { getMint } from '@mirrorworld/mirage.core/src/queries';
import { pullPages } from '@mirrorworld/mirage.core/src/queries/get-store';
import {
  AuctionState,
  TierDummyEntry,
  TieredAuctionState,
} from '@mirrorworld/mirage.core';
import { QUOTE_MINT } from '@mirrorworld/mirage.core/src/listing/constants';

// With Metaplex, you can create multiple auction
// categories. In this case, we shall currently only support
// single/instant auctions. We may be able to support this
// in the future.
export enum AuctionCategory {
  InstantSale,
  Single,
  DutchAuction,
  Limited,
  Open,
  Tiered,
}

enum InstantSaleType {
  Limited,
  Single,
  Open,
}

const DEFAULT_ACTION = {
  reservationPrice: 0,
  items: [],
  category: AuctionCategory.Single,
  auctionDurationType: 'minutes' as AuctionState['auctionDurationType'],
  auctionDuration: 1440,
  gapTime: 0,
  gapTimeType: 'minutes' as AuctionState['gapTimeType'],
  winnersCount: 1,
  startSaleTS: undefined,
  startListTS: undefined,
  quoteMintAddress: QUOTE_MINT.toBase58(),
  instantSalePrice: 0,
  priceFloor: 0,
  tickSizeEndingPhase: 0,
};

const DEFAULT_TIERED_STATE: TieredAuctionState = {
  items: [],
  tiers: [],
};

/**
 * Gets the list of tokens deployed to a particular network.
 * @param endpoint
 * @returns {Promise<Map<string, TokenInfo>>}
 */
export async function getTokenListByNetwork(
  endpoint: Endpoint
): Promise<Map<string, TokenInfo>> {
  const tokenList = getTokenListContainerPromise().then((container) => {
    const list = container
      .excludeByTag('nft')
      .filterByChainId(endpoint.chainId)
      .getList();

    const map = new Map(list.map((item) => [item.address, item]));
    return map;
  });

  return tokenList;
}

export async function createListing(
  wallet: WalletSigner,
  connection: Connection,
  endpoint: Endpoint,
  tieredAttributes = DEFAULT_TIERED_STATE
) {
  const mint = await getMint(wallet.publicKey!, connection)!;
  const tokenList = await getTokenListByNetwork(endpoint);

  const attributes: AuctionState = Object.assign(DEFAULT_ACTION, {
    quoteMintInfo: mint!,
    quoteMintInfoExtended: tokenList.get(QUOTE_MINT.toBase58())!,
  });

  // Process auction metadata
  let winnerLimit: WinnerLimit;
  if (
    attributes.category === AuctionCategory.InstantSale &&
    attributes.instantSaleType === InstantSaleType.Open
  ) {
    const { items, instantSalePrice } = attributes;

    if (items.length > 0 && items[0].participationConfig) {
      items[0].participationConfig.fixedPrice = new BN(
        toLamports(instantSalePrice, mint!) || 0
      );
    }

    winnerLimit = new WinnerLimit({
      type: WinnerLimitType.Unlimited,
      usize: ZERO,
    });
  } else if (
    attributes.category === AuctionCategory.InstantSale ||
    attributes.category === AuctionCategory.DutchAuction
  ) {
    const { items, editions } = attributes;

    if (items.length > 0) {
      const item = items[0];
      if (!editions) {
        item.winningConfigType =
          item.metadata.info.updateAuthority ===
          (wallet?.publicKey || SystemProgram.programId).toBase58()
            ? WinningConfigType.FullRightsTransfer
            : WinningConfigType.TokenOnlyTransfer;
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
  } else if (attributes.category === AuctionCategory.Open) {
    if (
      attributes.items.length > 0 &&
      attributes.items[0].participationConfig
    ) {
      attributes.items[0].participationConfig.fixedPrice = new BN(
        toLamports(attributes.participationFixedPrice, mint!) || 0
      );
    }
    winnerLimit = new WinnerLimit({
      type: WinnerLimitType.Unlimited,
      usize: ZERO,
    });
  } else if (
    attributes.category === AuctionCategory.Limited ||
    attributes.category === AuctionCategory.Single
  ) {
    if (attributes.items.length > 0) {
      const item = attributes.items[0];
      if (attributes.category == AuctionCategory.Single && item.masterEdition) {
        item.winningConfigType =
          item.metadata.info.updateAuthority ===
          (wallet?.publicKey || SystemProgram.programId).toBase58()
            ? WinningConfigType.FullRightsTransfer
            : WinningConfigType.TokenOnlyTransfer;
      }
      item.amountRanges = [
        new AmountRange({
          amount: new BN(1),
          length:
            attributes.category === AuctionCategory.Single
              ? new BN(1)
              : new BN(attributes.editions || 1),
        }),
      ];
    }
    winnerLimit = new WinnerLimit({
      type: WinnerLimitType.Capped,
      usize:
        attributes.category === AuctionCategory.Single
          ? new BN(1)
          : new BN(attributes.editions || 1),
    });

    if (
      attributes.participationNFT &&
      attributes.participationNFT.participationConfig
    ) {
      attributes.participationNFT.participationConfig.fixedPrice = new BN(
        toLamports(attributes.participationFixedPrice, mint!) || 0
      );
    }
  } else {
    const tiers = tieredAttributes.tiers;
    tiers.forEach(
      (c) =>
        (c.items = c.items.filter(
          (i) => (i as TierDummyEntry).winningConfigType !== undefined
        ))
    );
    let filteredTiers = tiers.filter(
      (i) => i.items.length > 0 && i.winningSpots.length > 0
    );

    tieredAttributes.items.forEach((config, index) => {
      let ranges: AmountRange[] = [];
      filteredTiers.forEach((tier) => {
        const tierRangeLookup: Record<number, AmountRange> = {};
        const tierRanges: AmountRange[] = [];
        const item = tier.items.find(
          (i) => (i as TierDummyEntry).safetyDepositBoxIndex == index
        );

        if (item) {
          config.winningConfigType = (item as TierDummyEntry).winningConfigType;
          const sorted = tier.winningSpots.sort();
          sorted.forEach((spot, i) => {
            if (tierRangeLookup[spot - 1]) {
              tierRangeLookup[spot] = tierRangeLookup[spot - 1];
              tierRangeLookup[spot].length = tierRangeLookup[spot].length.add(
                new BN(1)
              );
            } else {
              tierRangeLookup[spot] = new AmountRange({
                amount: new BN((item as TierDummyEntry).amount),
                length: new BN(1),
              });
              // If the first spot with anything is winner spot 1, you want a section of 0 covering winning
              // spot 0.
              // If we have a gap, we want a gap area covered with zeroes.
              const zeroLength = i - 1 > 0 ? spot - sorted[i - 1] - 1 : spot;
              if (zeroLength > 0) {
                tierRanges.push(
                  new AmountRange({
                    amount: new BN(0),
                    length: new BN(zeroLength),
                  })
                );
              }
              tierRanges.push(tierRangeLookup[spot]);
            }
          });
          // Ok now we have combined ranges from this tier range. Now we merge them into the ranges
          // at the top level.
          let oldRanges = ranges;
          ranges = [];
          let oldRangeCtr = 0,
            tierRangeCtr = 0;

          while (
            oldRangeCtr < oldRanges.length ||
            tierRangeCtr < tierRanges.length
          ) {
            let toAdd = new BN(0);
            if (
              tierRangeCtr < tierRanges.length &&
              tierRanges[tierRangeCtr].amount.gt(new BN(0))
            ) {
              toAdd = tierRanges[tierRangeCtr].amount;
            }

            if (oldRangeCtr == oldRanges.length) {
              ranges.push(
                new AmountRange({
                  amount: toAdd,
                  length: tierRanges[tierRangeCtr].length,
                })
              );
              tierRangeCtr++;
            } else if (tierRangeCtr == tierRanges.length) {
              ranges.push(oldRanges[oldRangeCtr]);
              oldRangeCtr++;
            } else if (
              oldRanges[oldRangeCtr].length.gt(tierRanges[tierRangeCtr].length)
            ) {
              oldRanges[oldRangeCtr].length = oldRanges[oldRangeCtr].length.sub(
                tierRanges[tierRangeCtr].length
              );

              ranges.push(
                new AmountRange({
                  amount: oldRanges[oldRangeCtr].amount.add(toAdd),
                  length: tierRanges[tierRangeCtr].length,
                })
              );

              tierRangeCtr += 1;
              // dont increment oldRangeCtr since i still have length to give
            } else if (
              tierRanges[tierRangeCtr].length.gt(oldRanges[oldRangeCtr].length)
            ) {
              tierRanges[tierRangeCtr].length = tierRanges[
                tierRangeCtr
              ].length.sub(oldRanges[oldRangeCtr].length);

              ranges.push(
                new AmountRange({
                  amount: oldRanges[oldRangeCtr].amount.add(toAdd),
                  length: oldRanges[oldRangeCtr].length,
                })
              );

              oldRangeCtr += 1;
              // dont increment tierRangeCtr since they still have length to give
            } else if (
              tierRanges[tierRangeCtr].length.eq(oldRanges[oldRangeCtr].length)
            ) {
              ranges.push(
                new AmountRange({
                  amount: oldRanges[oldRangeCtr].amount.add(toAdd),
                  length: oldRanges[oldRangeCtr].length,
                })
              );
              // Move them both in this degen case
              oldRangeCtr++;
              tierRangeCtr++;
            }
          }
        }
      });
      config.amountRanges = ranges;
    });

    winnerLimit = new WinnerLimit({
      type: WinnerLimitType.Capped,
      usize: new BN(attributes.winnersCount),
    });
    if (
      attributes.participationNFT &&
      attributes.participationNFT.participationConfig
    ) {
      attributes.participationNFT.participationConfig.fixedPrice = new BN(
        toLamports(attributes.participationFixedPrice, mint!) || 0
      );
    }
  }

  const isInstantSale =
    attributes.instantSalePrice &&
    attributes.priceFloor === attributes.instantSalePrice;

  const isDutchAuction =
    attributes.instantSalePrice &&
    attributes.priceFloor! < attributes.instantSalePrice;

  const LAMPORTS_PER_TOKEN =
    attributes.quoteMintAddress == WRAPPED_SOL_MINT.toBase58()
      ? LAMPORTS_PER_SOL
      : Math.pow(10, attributes.quoteMintInfo.decimals || 0);

  const auctionSettings: IPartialCreateAuctionArgs = {
    winners: winnerLimit,
    endAuctionAt: isInstantSale
      ? null
      : new BN(
          (attributes.auctionDuration || 0) *
            (attributes.auctionDurationType == 'days'
              ? 60 * 60 * 24 // 1 day in seconds
              : attributes.auctionDurationType == 'hours'
              ? 60 * 60 // 1 hour in seconds
              : 60) // 1 minute in seconds
        ), // endAuctionAt is actually auction duration, poorly named, in seconds
    auctionGap:
      isInstantSale || isDutchAuction
        ? null
        : new BN(
            (attributes.gapTime || 0) *
              (attributes.gapTimeType == 'days'
                ? 60 * 60 * 24 // 1 day in seconds
                : attributes.gapTimeType == 'hours'
                ? 60 * 60 // 1 hour in seconds
                : 60) // 1 minute in seconds
          ),
    priceFloor: new PriceFloor({
      type: attributes.priceFloor
        ? PriceFloorType.Minimum
        : PriceFloorType.None,
      minPrice: new BN((attributes.priceFloor || 0) * LAMPORTS_PER_TOKEN),
    }),
    tokenMint: attributes.quoteMintAddress,
    gapTickSizePercentage: attributes.tickSizeEndingPhase || null,
    tickSize: attributes.priceTick
      ? new BN(attributes.priceTick * LAMPORTS_PER_TOKEN)
      : null,
    instantSalePrice: attributes.instantSalePrice
      ? new BN((attributes.instantSalePrice || 0) * LAMPORTS_PER_TOKEN)
      : null,
    name: null,
    bidType: attributes.category,
  };

  const isOpenEdition =
    attributes.category === AuctionCategory.Open ||
    attributes.instantSaleType === InstantSaleType.Open;

  const safetyDepositDrafts = isOpenEdition
    ? []
    : attributes.category !== AuctionCategory.Tiered
    ? attributes.items
    : tieredAttributes.items;
  const participationSafetyDepositDraft = isOpenEdition
    ? attributes.items[0]
    : attributes.participationNFT;

  try {
    const storeIndex = await pullPages(connection);

    const _auctionObj = await createAuctionManager(
      connection,
      wallet,
      whitelistedCreatorsByCreator,
      auctionSettings,
      safetyDepositDrafts,
      participationSafetyDepositDraft,
      attributes.quoteMintAddress,
      storeIndex
    );
    setAuctionObj(_auctionObj);

    // update item tx
    updateItemTradeHistory({
      item: attributes.items[0].metadata.pubkey,
      history: {
        price:
          (attributes.instantSalePrice
            ? attributes.instantSalePrice
            : attributes.priceFloor) || 0,
        from: wallet.publicKey?.toBase58() || '',
        to: '',
        saleType: String(attributes.category),
        type: 'listing',
      },
    });
  } catch (err: any) {
    if (err.message) {
      displayMessage({
        status: 'error',
        message: err.message,
      });
      throw new Error(err.message);
    } else {
      displayMessage({
        status: 'error',
        message: 'Error Creating your Auction, Please try again',
      });
      throw new Error('Error Creating your Auction, Please try again');
    }
  }
}

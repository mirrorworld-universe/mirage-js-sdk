import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import { Connection, PublicKey, Commitment, LAMPORTS_PER_SOL } from '@solana/web3.js';
import fetch from 'isomorphic-fetch';
import percentRound from 'percent-round';
import { AUCTION_HOUSE_PROGRAM_ID, NFT_STORAGE_API_KEY, SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID } from './constants';
import { INFTStorageResponse, MetadataObject } from './types';
import * as AuctionHouseProgram from '@metaplex-foundation/mpl-auction-house';
import dayjs from 'dayjs';
import { TransactionReceipt } from './mirage';
import { Metaplex } from '@metaplex-foundation/js';

/** Get metadatata account for mint */
export const getMetadata = (mint: PublicKey): PublicKey => {
  return PublicKey.findProgramAddressSync([Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()], TOKEN_METADATA_PROGRAM_ID)[0];
};

/** Get associated token for mint */
export const getAtaForMint = (mint: PublicKey, address: PublicKey): [PublicKey, number] => {
  return PublicKey.findProgramAddressSync([address.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID);
};

export const isPdaAddressInitialize = async (connection: Connection, pdaAddress: PublicKey): Promise<boolean> => {
  const pdaAccountInfo = await connection.getAccountInfo(pdaAddress);
  return pdaAccountInfo != null;
};

export enum AccountState {
  Uninitialized = 0,
  Initialized = 1,
  Frozen = 2,
}

export async function getAccountInfo(connection: Connection, address: PublicKey, commitment?: Commitment, programId = TOKEN_PROGRAM_ID) {
  const info = await connection.getAccountInfo(address, commitment);
  if (!info) throw new Error('TokenAccountNotFoundError');
  if (!info.owner.equals(programId)) throw new Error('TokenInvalidAccountOwnerError');
  if (info.data.length != AccountLayout.span) throw new Error('TokenInvalidAccountSizeError');

  const rawAccount = AccountLayout.decode(Buffer.from(info.data));

  return {
    address,
    mint: rawAccount.mint,
    owner: rawAccount.owner,
    amount: rawAccount.amount,
    delegate: rawAccount.delegateOption ? rawAccount.delegate : null,
    delegatedAmount: rawAccount.delegatedAmount,
    isInitialized: rawAccount.state !== AccountState.Uninitialized,
    isFrozen: rawAccount.state === AccountState.Frozen,
    isNative: !!rawAccount.isNativeOption,
    rentExemptReserve: rawAccount.isNativeOption ? rawAccount.isNative : null,
    closeAuthority: rawAccount.closeAuthorityOption ? rawAccount.closeAuthority : null,
  };
}

/**
 * Uploads an NFT's image or video or file to decentralized storage.
 * @param image
 * @param metadataJson
 * @param isAnimation
 * @param nftStorageKey API key provided by `https://nft.storage`. See documentation at:
 */
export async function uploadNFTFileToStorage(
  image: File | null,
  metadataJson: MetadataObject,
  isAnimation: boolean = false,
  nftStorageKey: string = NFT_STORAGE_API_KEY
) {
  // 1. Uploads image file to
  const uploadImage = async (media: File) => {
    const response = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Content-Length': String(media.size),
        Authorization: `Bearer ${nftStorageKey}`,
      },
      body: media,
    });

    const image = (await response.json()) as INFTStorageResponse;
    const imageUrl = `https://${image.value.cid}.ipfs.dweb.link`;
    return imageUrl;
  };

  // 2. Upload metadtaa object
  const uploadMetadata = async (metadataJson: MetadataObject) => {
    const payload = Buffer.from(JSON.stringify(metadataJson));

    const response = await fetch('https://api.nft.storage/upload', {
      method: 'POST',
      headers: {
        'Content-Length': String(payload.length),
        Authorization: `Bearer ${nftStorageKey}`,
      },
      body: payload,
    });
    const metadata = (await response.json()) as INFTStorageResponse;
    return `https://${metadata.value.cid}.ipfs.dweb.link`;
  };

  if (image && metadataJson) {
    const [imageUrl, metadataUrl] = await Promise.all([uploadImage(image), uploadMetadata(metadataJson)]);

    // Todo: find a way to flag to consumer that the uploaded media is a video/animation
    return [imageUrl, metadataUrl] as const;
  } else if (metadataJson && !image) {
    const metadataUrl = await uploadMetadata(metadataJson);

    // Todo: find a way to flag to consumer that the uploaded media is a video/animation
    return [metadataUrl] as const;
  }
}

/**
 * Processes creator shares and adds the auctionhouse as one of the authorities on the
 * mint. It then provides the `authorityAddress` and gives it a royalty percentage equal to
 * the `authorityRoyaltyPercentage` of the cumulative total shares of all the `creators`.
 *
 * e.g.
 * @param creators Array of creators
 * @param authorityAddress Address of the auctionhouse authority
 * @param authorityRoyaltyPercentage Percentage of royalties to be added to the marketplace
 * @example
 * ```ts
 *  const auctionHouseAuthority = new PublicKey("3MtckfRX4VRJ1yUmPHpKZstAQ8S3WfhRnNJLT8LqTZEr")
    const authorityRoyaltyPercentage = 5

    processCreatorShares([
      {
        address: "Betkx8CfRUwQAqZZRqKt13zo4t9awNFeriD2bMAq2xfJ",
        share: 43
      },
      {
        address: "Dn4D8vVvpKzCALq1X5jasPrwvs5kXnSJtfbji4iZaq6R",
        share: 1232
      }
    ], auctionHouseAuthority, authorityRoyaltyPercentage);
 * ```
    Yields:
    ```ts
    [
      {
        address: 'Betkx8CfRUwQAqZZRqKt13zo4t9awNFeriD2bMAq2xfJ',
        share: 3
      },
      {
        address: 'Dn4D8vVvpKzCALq1X5jasPrwvs5kXnSJtfbji4iZaq6R',
        share: 92
      },
      {
        address: '3MtckfRX4VRJ1yUmPHpKZstAQ8S3WfhRnNJLT8LqTZEr',
        share: 5
      }
    ]
    ```
 */
export function processCreatorShares(creators: { address: string; share: number }[], authorityAddress: PublicKey, authorityRoyaltyPercentage = 4.25) {
  if (authorityRoyaltyPercentage > 99) {
    throw new Error('royalty percentage cannot exceed 99%!');
  }
  const originalShares = creators.map((c) => c.share);
  const originalSum = originalShares.reduce((acc, curr) => (acc += curr), 0);
  /** MirrorWorld takes a 4.25% royalty on the NFT */
  const mirrorWorldShare = originalSum * (authorityRoyaltyPercentage / 100);
  const finalCreators = creators.concat({
    address: authorityAddress.toBase58(),
    share: mirrorWorldShare,
  });
  const shares = finalCreators.map((c) => c.share);
  const rounded = percentRound(shares);
  return rounded.map((p, i) => ({
    address: finalCreators[i].address,
    share: p,
  }));
}

/* Get NFT Owner */
export async function getNftOwner(mint: string | PublicKey, connection: Connection) {
  const largestAccounts = await connection.getTokenLargestAccounts(new PublicKey(mint));
  const largestAccountInfo = await connection.getParsedAccountInfo(largestAccounts.value[0].address);
  /** @ts-expect-error "ParsedAccountInfo | Buffer" not typed correctly */
  const owner = largestAccountInfo.value.data.parsed.info.owner as string;
  console.log(`Owner of token ${mint.toString()} is ${owner}`);
  return [owner, new PublicKey(owner), largestAccountInfo.value!.data] as const;
}

/**
 * Get Token Transactions
 * @param mint
 * @param auctionHouse
 * @param connection
 */
export async function getTokenTransactions(
  mint: string | PublicKey,
  auctionHouse: PublicKey,
  connection: Connection
): Promise<(TransactionReceipt | undefined)[]> {
  const _mint = new PublicKey(mint);

  const metaplex = new Metaplex(connection);
  const nft = await metaplex.nfts().findByMint(_mint);

  /**
   * Allocated data size on auction_house program per PDA type
   * CreateAuctionHouse: 459
   * PrintListingReceipt: 236
   * PrintBidReceipt: 269
   * PrintPurchaseReceipt: 193
   */

  const PrintListingReceiptSize = 236;
  const PrintBidReceiptSize = 269;
  const PrintPurchaseReceiptSize = 193;

  const ReceiptAccountSizes = [PrintListingReceiptSize, PrintBidReceiptSize, PrintPurchaseReceiptSize] as const;

  const ReceiptAccounts = ReceiptAccountSizes.map(async (size) => {
    const accounts = await connection.getProgramAccounts(AUCTION_HOUSE_PROGRAM_ID, {
      commitment: 'confirmed',
      filters: [
        {
          dataSize: size,
        },
      ],
    });
    const parsedAccounts = accounts.map(async (account) => {
      switch (size) {
        case PrintListingReceiptSize:
          const [ListingReceipt] = AuctionHouseProgram.accountProviders.ListingReceipt.fromAccountInfo(account.account);
          return {
            ...ListingReceipt,
            receipt_type: ListingReceipt.canceledAt ? 'cancel_listing_receipt' : 'listing_receipt',
          } as TransactionReceipt;
        case PrintBidReceiptSize:
          const [BidReceipt] = AuctionHouseProgram.accountProviders.BidReceipt.fromAccountInfo(account.account);
          return {
            ...BidReceipt,
            receipt_type: 'bid_receipt',
          } as TransactionReceipt;
        case PrintPurchaseReceiptSize:
          const [PurchaseReceipt] = AuctionHouseProgram.accountProviders.PurchaseReceipt.fromAccountInfo(account.account);
          return {
            ...PurchaseReceipt,
            receipt_type: 'purchase_receipt',
          } as TransactionReceipt;
        default:
          return undefined;
      }
    });
    return await Promise.all(parsedAccounts);
  });

  const result = (await Promise.all(ReceiptAccounts))
    .flat()
    .filter((receipt) => !!receipt && receipt.metadata.toBase58() === nft.metadataAccount.publicKey.toBase58())
    .map((receipt) => ({
      ...receipt!,
      /** @ts-ignore */
      tokenSize: receipt.tokenSize.toNumber(),
      /** @ts-ignore */
      price: receipt.price.toNumber() / LAMPORTS_PER_SOL,
      /** @ts-ignore */
      createdAt: dayjs.unix(receipt.createdAt.toNumber()).toDate().getTime(),
      cancelledAt: dayjs
        /** @ts-ignore */
        .unix(receipt.canceledAt?.toNumber?.())
        .toDate()
        .getTime(),
    }))
    .filter((receipt) => receipt.auctionHouse.toBase58() === auctionHouse!.toBase58())
    .sort((a, b) => {
      if (a.receipt_type === 'bid_receipt' && b.receipt_type === 'purchase_receipt') {
        return 1;
      } else if (a.receipt_type === 'purchase_receipt' && b.receipt_type === 'bid_receipt') {
        return -1;
      } else {
        return 0;
      }
    })
    .sort((a, b) => b.createdAt - a.createdAt);
  console.log('result', result);
  return result;
}

import { TOKEN_PROGRAM_ID, AccountLayout } from '@solana/spl-token';
import { Connection, PublicKey, Commitment } from '@solana/web3.js';
import fetch from 'isomorphic-fetch';
import percentRound from 'percent-round';
import { BN } from '@project-serum/anchor';
import { AUCTION_HOUSE, AUCTION_HOUSE_PROGRAM_ID, NFT_STORAGE_API_KEY, SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID, TOKEN_METADATA_PROGRAM_ID } from './constants';
import { IMetadata, INFTStorageResponse, MetadataObject } from './types';

/** Get metadatata account for mint */
export const getMetadata = async (mint: PublicKey): Promise<PublicKey> => {
  return (await PublicKey.findProgramAddress([Buffer.from('metadata'), TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()], TOKEN_METADATA_PROGRAM_ID))[0];
};

/** Get associated token for mint */
export const getAtaForMint = async (mint: PublicKey, address: PublicKey): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress([address.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()], SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID);
};

export const getAuctionHouseProgramAsSigner = async (): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress([Buffer.from(AUCTION_HOUSE), Buffer.from('signer')], AUCTION_HOUSE_PROGRAM_ID);
};

export const getAuctionHouseTradeState = async (
  auctionHouse: PublicKey,
  wallet: PublicKey,
  tokenAccount: PublicKey,
  treasuryMint: PublicKey,
  tokenMint: PublicKey,
  tokenSize: BN,
  buyPrice: BN
): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress(
    [
      Buffer.from(AUCTION_HOUSE),
      wallet.toBuffer(),
      auctionHouse.toBuffer(),
      tokenAccount.toBuffer(),
      treasuryMint.toBuffer(),
      tokenMint.toBuffer(),
      buyPrice.toBuffer('le', 8),
      tokenSize.toBuffer('le', 8),
    ],
    AUCTION_HOUSE_PROGRAM_ID
  );
};

export const getAuctionHouseBuyerEscrow = async (auctionHouse: PublicKey, wallet: PublicKey): Promise<[PublicKey, number]> => {
  return await PublicKey.findProgramAddress([Buffer.from(AUCTION_HOUSE), auctionHouse.toBuffer(), wallet.toBuffer()], AUCTION_HOUSE_PROGRAM_ID);
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
    const metadataUrl = `https://${metadata.value.cid}.ipfs.dweb.link`;
    return metadataUrl;
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
  const finalCreatorsWithShares = rounded.map((p, i) => ({
    address: finalCreators[i].address,
    share: p,
  }));
  return finalCreatorsWithShares;
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

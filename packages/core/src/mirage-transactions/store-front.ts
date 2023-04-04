import { programs } from '@metaplex/js';
import { PublicKey } from '@solana/web3.js';
import { NATIVE_MINT } from '@solana/spl-token';
import { getAuctionHouseAddress } from '../auctionUtils';

const {
  metaplex: { Store, SetStoreV2, StoreConfig },
} = programs;

export interface MarktetplaceMetaPayload {
  name: string;
  description: string;
}

export interface FileUploadPayload {
  name: string | undefined;
  type: string | undefined;
  url: string;
}

export interface MarketplaceThemePayload {
  logo: FileUploadPayload;
  banner: FileUploadPayload;
}

export interface MarketplaceCreatorPayload {
  address: string;
}

export interface MarketplaceAddressPayload {
  owner?: string;
  store?: string;
  storeConfig?: string;
}
interface MarketplaceAuctionHousePayload {
  address: string;
}

export interface MarktplaceSettingsPayload {
  meta: MarktetplaceMetaPayload;
  theme: MarketplaceThemePayload;
  creators: MarketplaceCreatorPayload[];
  subdomain: string;
  address: MarketplaceAddressPayload;
  auctionHouses: MarketplaceAuctionHousePayload[];
}

export interface StoreFrontOptions {
  meta: MarktetplaceMetaPayload;
  theme: MarketplaceThemePayload;
  subdomain: string;
}

export const getStoreFrontConfig = async (
  authority: PublicKey,
  storeFrontOptions: StoreFrontOptions,
  treasuryMints: (PublicKey | undefined)[]
): Promise<MarktplaceSettingsPayload> => {
  const storePubkey = await Store.getPDA(authority);
  const storeConfigPubkey = await StoreConfig.getPDA(storePubkey);

  const address = { owner: authority.toBase58(), store: storePubkey.toBase58(), storeConfig: storeConfigPubkey.toBase58() };

  const auctionHouses: { address: string }[] = [];
  for (let n = 0; n < treasuryMints.length; n++) {
    const [auctionHouse, _bump] = getAuctionHouseAddress(authority, treasuryMints[n] || NATIVE_MINT);
    auctionHouses.push({ address: auctionHouse.toBase58() });
  }

  return {
    ...storeFrontOptions,
    address,
    creators: [{ address: authority.toBase58() }],
    auctionHouses,
  };
};

export const createOrUpdateStoreFront = async (authority: PublicKey, feePayer: PublicKey, settingsUri: string) => {
  const storePubkey = await Store.getPDA(authority);
  const storeConfigPubkey = await StoreConfig.getPDA(storePubkey);

  return new SetStoreV2(
    {
      feePayer,
    },
    {
      admin: authority,
      store: storePubkey,
      config: storeConfigPubkey,
      isPublic: false,
      settingsUri,
    }
  );
};

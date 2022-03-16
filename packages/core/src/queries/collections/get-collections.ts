import {
  COLLECTION_ID,
  programIds,
  StringPublicKey,
  toPublicKey,
} from '@mirrorworld/mirage.utils';
import { Connection } from '@solana/web3.js';
import {
  decodeCollectionData,
  ICollectionData,
} from '../../listing/collection/schema';

export async function getCollections(
  connection: Connection,
  programId?: StringPublicKey
) {
  const collections: ICollectionData[] = [];
  const res = await connection.getProgramAccounts(
    toPublicKey(programId || programIds().collection)
  );
  res.forEach((account) => {
    try {
      const decoded = decodeCollectionData(account.account.data);
      decoded.pubkey = account.pubkey.toBase58();
      try {
        const { hostname, pathname } = new URL(decoded.image);
        // Legacy API Gateway
        if (hostname === 'ksvhvhrxpk.execute-api.us-east-1.amazonaws.com') {
          decoded.image = `${process.env.NEXT_APP_BASE_URL!}/${pathname}`;
        }
      } catch (err) {
        // Invalid URL fallback image
        decoded.image = `${process.env.NEXT_APP_BASE_URL}/images/c81932f0e6ee783f5c7883a81d4b5b8c`;
      }
      collections.push(decoded);
    } catch (error) {}
  });

  return collections;
}

export async function getCollectionsByCreator(
  connection: Connection,
  creator: StringPublicKey
) {
  const collections = await getCollections(connection);
  return collections.filter((collection) => collection.creator === creator);
}

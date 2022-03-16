import {
  decodeStoreIndexer,
  findProgramAddress,
  INDEX,
  METAPLEX_PREFIX,
  ParsedAccount,
  programIds,
  StoreIndexer,
  toPublicKey,
} from '@mirrorworld/mirage.utils';
import { Connection, PublicKey } from '@solana/web3.js';

export async function getStoreIndexer(page: number) {
  const PROGRAM_IDS = programIds();
  const store = PROGRAM_IDS.store;
  if (!store) {
    throw new Error('Store not initialized');
  }

  return (
    await findProgramAddress(
      [
        Buffer.from(METAPLEX_PREFIX),
        toPublicKey(PROGRAM_IDS.metaplex).toBuffer(),
        toPublicKey(store).toBuffer(),
        Buffer.from(INDEX),
        Buffer.from(page.toString()),
      ],
      toPublicKey(PROGRAM_IDS.metaplex)
    )
  )[0];
}

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

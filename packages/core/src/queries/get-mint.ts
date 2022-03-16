import { cache, MintParser } from '@mirrorworld/mirage.utils';
import { MintInfo } from '@solana/spl-token';
import { Connection, PublicKey } from '@solana/web3.js';

export async function getMint(key: string | PublicKey, connection: Connection) {
  const id = typeof key === 'string' ? key : key?.toBase58();
  if (!id) {
    return;
  }

  return await cache
    .query(connection, id, MintParser)
    .then((acc) => acc.info as MintInfo)
    .catch((err) => console.log(err));
}

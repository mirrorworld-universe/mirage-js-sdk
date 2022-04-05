import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import * as anchor from '@project-serum/anchor';
import consola from 'consola';
import { encodeBase64, decodeUTF8 } from 'tweetnacl-util';
import bs58 from 'bs58';
import { setupNativeAccount } from '@mirrorworld/mirage.core/src/listing/meta/accounts';
import { cache } from '@mirrorworld/mirage.utils/src/actions/cache';
import {
  StringPublicKey,
  TokenAccount,
  TokenAccountParser,
} from '@mirrorworld/mirage.utils';
import collections_keypair from './collections-keypair.json';

const SIGNER_PRIVATE_KEY =
  '26abxHti74NYbWWqaxGkKarkmsLoEdDHXzkD5quKQedBMTu3BTgw84KpGfrph9ctZY93broTYy8gMe6FazpqtPPJ';
const RPC_HOST_URL =
  'https://fragrant-black-cherry.solana-devnet.quiknode.pro/74fbede70f2b8f6ed9b5bac5bfcda983e8bab832';

// ====== Helpers =======

function createWallet() {
  const encodedKey = bs58.encode(collections_keypair);
  consola.info('Collections Program', encodedKey);
  return new anchor.Wallet(
    Keypair.fromSecretKey(collections_keypair as any as Uint8Array)
  );
}

async function createAuction() {
  const connection = new Connection(RPC_HOST_URL);
  const wallet = createWallet();
  // console.log(wallet);
  // const mintKey = 'Bb7E1f4zutPTrRaGZ4iCdRzZ9Q76hZsJhUoEtaRtc7tX';
  const listingPrice = '1.2';

  // const account = await getMintInfo(connection, new PublicKey(mintKey));
  // consola.success('MINT', account);
}

createAuction()
  .then(() => consola.success('successfully cuctioned item'))
  .catch(consola.error);

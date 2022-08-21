import { Keypair, Connection, PublicKey } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';
import { Mirage } from '../mirage';
import { AuctionHouse } from '@metaplex-foundation/mpl-auction-house/dist/src/generated/accounts';
import merge from 'lodash.merge';
import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house';
import { CreateMarketplaceOptions } from './create-marketplace';

async function main() {
  const secretKey = '4RwyqCRiqJfnUgFRPcdospAuUbL5U8nKgxo5o1RtsgS8ChX2sC7LtWV4Z95fLieSw8LvBRSRGbwKuf9f5UJoQZXE';
  const keypair = Keypair.fromSecretKey(bs58.decode(secretKey));
  const owner = keypair.publicKey;
  // const connection = new Connection('https://solana-devnet.g.alchemy.com/v2/Kw4imBatcI2gG7DCS_W0omvNSwGGZeWb');
  const connection = new Connection('https://fragrant-black-cherry.solana-devnet.quiknode.pro/74fbede70f2b8f6ed9b5bac5bfcda983e8bab832/');

  const wallet = new Wallet(keypair);
  const mergedOptions = {
    authority: wallet.publicKey,
    treasuryMint: new PublicKey('EJ94TwhddyUAra7i3qttQ64Q1wExJYb8GmACbHbAnvKF'),
  };
  const mirage = new Mirage({
    wallet,
    connection,
    marketplace: mergedOptions,
  });

  const marketplaceResult = await mirage.fetchAuctionHouse(new PublicKey('BbBDfk1cocWi572ZVSPVacr3FvmW92reAdLeM35DeHXF'));
  console.log('marketplaceResult', JSON.stringify(marketplaceResult, null, 2));
}

main().then(console.log);

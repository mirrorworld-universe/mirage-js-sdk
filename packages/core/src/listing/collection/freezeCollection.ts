import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  programIds,
  sendTransactionWithRetry,
  toPublicKey,
  WalletSigner,
} from '@mirrorworld/mirage.utils';
import { COLLECTION_SCHEMA } from './schema';
import { serialize } from 'borsh';

export class FreezeCollectionArgs {
  instruction: number = 5;
}

export const freezeCollection = async (
  connection: Connection,
  wallet: WalletSigner | undefined,
  collectionKey: PublicKey
) => {
  if (!wallet?.publicKey) return;
  var instructions: TransactionInstruction[] = [];

  await appendFreezeCollectionInstruction(wallet, collectionKey, instructions);

  await sendTransactionWithRetry(connection, wallet, instructions, []);
};

export async function appendFreezeCollectionInstruction(
  wallet: WalletSigner,
  collectionKey: PublicKey,
  instructions: TransactionInstruction[]
) {
  if (wallet.publicKey) {
    const txnData = Buffer.from(
      serialize(COLLECTION_SCHEMA, new FreezeCollectionArgs())
    );

    const keys = [
      {
        pubkey: collectionKey,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: wallet.publicKey,
        isSigner: true,
        isWritable: false,
      },
    ];

    instructions.push(
      new TransactionInstruction({
        keys,
        programId: toPublicKey(programIds().collection),
        data: txnData,
      })
    );
  }
}

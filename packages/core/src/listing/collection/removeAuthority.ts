import {
  programIds,
  sendTransactionWithRetry,
  toPublicKey,
  WalletSigner,
} from '@mirrorworld/mirage.utils';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import { serialize } from 'borsh';
import { COLLECTION_SCHEMA } from './schema';

export class RemoveAuthorityArgs {
  instruction: number = 7;
}

export const removeAuthority = async (
  connection: Connection,
  wallet: WalletSigner | undefined,
  collectionKey: PublicKey,
  authorityKey: PublicKey
) => {
  if (!wallet?.publicKey) return;
  var instructions: TransactionInstruction[] = [];

  await appendRemoveAuthorityInstruction(
    wallet,
    collectionKey,
    authorityKey,
    instructions
  );

  await sendTransactionWithRetry(connection, wallet, instructions, []);
};

export async function appendRemoveAuthorityInstruction(
  wallet: WalletSigner,
  collectionKey: PublicKey,
  authorityKey: PublicKey,
  instructions: TransactionInstruction[]
) {
  if (wallet.publicKey) {
    const txnData = Buffer.from(
      serialize(COLLECTION_SCHEMA, new RemoveAuthorityArgs())
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
      {
        pubkey: authorityKey,
        isSigner: false,
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

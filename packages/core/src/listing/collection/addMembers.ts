import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  programIds,
  sendTransactionWithRetry,
  StringPublicKey,
  toPublicKey,
  WalletSigner,
} from '@mirrorworld/mirage.utils';
import { serialize } from 'borsh';
import { AddMembersArgs, COLLECTION_SCHEMA } from './schema';

export async function appendAddMembersInstruction(
  wallet: WalletSigner,
  collectionAddress: PublicKey,
  instructions: TransactionInstruction[],
  memberAddress: PublicKey
) {
  if (wallet?.publicKey) {
    const collectionProgramId = programIds().collection;
    const txnData = Buffer.from(
      serialize(COLLECTION_SCHEMA, new AddMembersArgs())
    );

    var keys = [
      {
        pubkey: collectionAddress,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: wallet.publicKey,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: memberAddress,
        isSigner: false,
        isWritable: false,
      },
    ];

    instructions.push(
      new TransactionInstruction({
        keys,
        programId: toPublicKey(collectionProgramId),
        data: txnData,
      })
    );
  }
  return instructions;
}

export async function addMintToCollection(
  connection: Connection,
  wallet: WalletSigner,
  mintKey: StringPublicKey,
  collectionAddress: StringPublicKey
) {
  const transaction = new Transaction();
  const instructions = await appendAddMembersInstruction(
    wallet,
    toPublicKey(collectionAddress),
    transaction.instructions,
    toPublicKey(mintKey)
  );

  const { txid } = await sendTransactionWithRetry(
    connection,
    wallet,
    instructions,
    [],
    'single'
  );

  return txid;
}

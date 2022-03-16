import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  programIds,
  sendTransactionWithRetry,
  toPublicKey,
  WalletSigner,
} from '@mirrorworld/mirage.utils';
import { serialize } from 'borsh';
import { COLLECTION_SCHEMA } from './schema';

export class RemoveMembersArgs {
  instruction: number = 2;
  index: number;

  constructor(args: { index: number }) {
    this.index = args.index;
  }
}

export async function removeCollectionMembers(
  connection: Connection,
  wallet: WalletSigner | undefined,
  collectionKey: PublicKey,
  removedMemberKey: PublicKey,
  index: number
) {
  if (wallet?.publicKey) {
    var instructions: TransactionInstruction[] = [];

    await appendRemoveCollectionMemberInstruction(
      wallet,
      collectionKey,
      removedMemberKey,
      index,
      instructions
    );

    const txid = await sendTransactionWithRetry(
      connection,
      wallet,
      instructions,
      []
    );
  }
}

export async function appendRemoveCollectionMemberInstruction(
  wallet: WalletSigner,
  collectionPubKey: PublicKey,
  removedMemberPubKey: PublicKey,
  index: number,
  instructions: TransactionInstruction[]
) {
  if (wallet.publicKey) {
    const txnData = Buffer.from(
      serialize(COLLECTION_SCHEMA, new RemoveMembersArgs({ index }))
    );

    const keys = [
      {
        pubkey: collectionPubKey,
        isSigner: false,
        isWritable: true,
      },
      {
        pubkey: wallet.publicKey,
        isSigner: true,
        isWritable: false,
      },
      {
        pubkey: removedMemberPubKey,
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

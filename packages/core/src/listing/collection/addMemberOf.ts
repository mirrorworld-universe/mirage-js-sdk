import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  programIds,
  sendTransactionWithRetry,
  toPublicKey,
  WalletSigner,
} from '@mirrorworld/mirage.utils';
import { serialize } from 'borsh';
import { COLLECTION_SCHEMA } from './schema';

export class AddMemberOfArgs {
  instruction: number = 4;
  signature: string;

  constructor(args: { signature: string }) {
    this.signature = args.signature;
  }
}

export const addMemberOf = async (
  connection: Connection,
  wallet: WalletSigner | undefined,
  collectionKey: PublicKey,
  memberOfCollectionKey: PublicKey,
  signature: string
) => {
  if (!wallet?.publicKey) return;
  var instructions: TransactionInstruction[] = [];

  await appendAddMemberOfInstruction(
    wallet,
    collectionKey,
    memberOfCollectionKey,
    signature,
    instructions
  );

  await sendTransactionWithRetry(connection, wallet, instructions, []);
};

export async function appendAddMemberOfInstruction(
  wallet: WalletSigner,
  collectionKey: PublicKey,
  memberOfCollectionKey: PublicKey,
  signature: string,
  instructions: TransactionInstruction[]
) {
  if (wallet.publicKey) {
    const txnData = Buffer.from(
      serialize(COLLECTION_SCHEMA, new AddMemberOfArgs({ signature }))
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
        pubkey: memberOfCollectionKey,
        isSigner: false,
        isWritable: true,
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

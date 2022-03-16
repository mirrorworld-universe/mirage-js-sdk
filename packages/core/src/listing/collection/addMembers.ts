import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import {
  programIds,
  toPublicKey,
  WalletSigner,
} from '@mirrorworld/mirage.utils';
import { serialize } from 'borsh';
import { COLLECTION_SCHEMA } from './schema';

export class AddMembersArgs {
  instruction: number = 1;
}

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

    // memberKeys.forEach(function (item) {
    //   keys.push({
    //     pubkey: item,
    //     isSigner: false,
    //     isWritable: true,
    //   });
    // });

    instructions.push(
      new TransactionInstruction({
        keys,
        programId: toPublicKey(collectionProgramId),
        data: txnData,
      })
    );
  }
}

import {
  ENDPOINT_NAME,
  findProgramAddress,
  programIds,
  sendTransactionWithRetry,
  StringPublicKey,
  toPublicKey,
  WalletSigner,
} from '@mirrorworld/mirage.utils';
import {
  COLLECTION_PREFIX,
  COLLECTION_SCHEMA,
  CreateCollectionArgs,
  CollectionSignature,
} from './schema';
import {
  Connection,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { serialize } from 'borsh';
import {
  prepPayForFilesTxn,
  uploadToArweave,
  IArweaveResult,
} from '../../utils';
import { appendAddAuthorityInstruction } from './addAuthority';

export const mintCollection = async (
  connection: Connection,
  wallet: WalletSigner | undefined,
  collection: {
    name: string;
    description: string;
    image: string;
    removable: boolean;
    arrangeable: boolean;
    expandable: boolean;
    maxSize: number;
    members: StringPublicKey[];
    memberOf: CollectionSignature[];
  },
  creatorKey: StringPublicKey,
  file: File | undefined,
  endpoint: ENDPOINT_NAME
): Promise<{
  collectionAccount: StringPublicKey;
} | void> => {
  if (!wallet?.publicKey) return;

  const payerPublicKey = wallet.publicKey.toBase58();
  var instructions: TransactionInstruction[] = [];

  /** upload collection image to arweave */
  const metadataContent = {
    name: collection.name,
  };
  const realFiles: File[] = [];
  if (file) realFiles.push(file);
  realFiles.push(new File([JSON.stringify(metadataContent)], 'metadata.json'));

  const { instructions: pushInstructions, signers: pushSigners } =
    await prepPayForFilesTxn(wallet, realFiles);

  const { txid: arweaveTx } = await sendTransactionWithRetry(
    connection,
    wallet,
    pushInstructions,
    pushSigners,
    'single'
  );

  const data = new FormData();
  data.append('transaction', arweaveTx);
  data.append('env', endpoint);

  const tags = realFiles.reduce(
    (acc: Record<string, Array<{ name: string; value: string }>>, f) => {
      acc[f.name] = [{ name: 'mint', value: f.name }];
      return acc;
    },
    {}
  );
  // data.append('tags', JSON.stringify(tags));
  realFiles.map((f) => data.append('file[]', f));

  // TODO: convert to absolute file name for image

  console.log(data);

  const result: IArweaveResult = await uploadToArweave(data);

  const metadataFile = result.messages?.find(
    (m) => !['manifest.json', 'metadata.json'].includes(m.filename)
  );
  if (metadataFile?.transactionId) {
    const arweaveLink = `https://arweave.net/${metadataFile.transactionId}`;

    const collectionAccount = await createCollection(
      collection.name,
      collection.description,
      arweaveLink,
      collection.removable,
      collection.arrangeable,
      collection.expandable,
      collection.maxSize,
      collection.members,
      collection.memberOf,
      creatorKey,
      instructions,
      payerPublicKey
    );

    await appendAddAuthorityInstruction(
      wallet,
      toPublicKey(collectionAccount),
      toPublicKey(payerPublicKey),
      instructions
    );

    const txid = await sendTransactionWithRetry(
      connection,
      wallet,
      instructions,
      []
    );

    return { collectionAccount };
  }
  return Promise.reject(new Error('Failed to upload to arweave'));
};

async function createCollection(
  name: string,
  description: string,
  image: string,
  removable: boolean,
  expandable: boolean,
  arrangeable: boolean,
  maxSize: number,
  members: StringPublicKey[],
  memberOf: CollectionSignature[],
  creatorKey: StringPublicKey,
  instructions: TransactionInstruction[],
  payer: StringPublicKey
) {
  const collectionProgramId = programIds().collection;

  const collectionAccount = (
    await findProgramAddress(
      [
        Buffer.from(COLLECTION_PREFIX),
        toPublicKey(collectionProgramId).toBuffer(),
        toPublicKey(creatorKey).toBuffer(),
        Buffer.from(name),
      ],
      toPublicKey(collectionProgramId)
    )
  )[0];

  let advanced = 0;
  if (removable) {
    advanced += 1;
  }
  if (expandable) {
    advanced += 2;
  }
  if (arrangeable) {
    advanced += 4;
  }

  console.log('CreateCollectionArgs', {
    name,
    description,
    image,
    advanced,
    maxSize,
    members,
    memberOf,
  });
  const value = new CreateCollectionArgs({
    name,
    description,
    image,
    advanced,
    maxSize,
    members,
    memberOf,
  });

  const txnData = Buffer.from(serialize(COLLECTION_SCHEMA, value));

  const keys = [
    {
      pubkey: toPublicKey(collectionAccount),
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: toPublicKey(creatorKey),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: toPublicKey(payer),
      isSigner: true,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
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

  return collectionAccount;
}

export interface CollectionPayload {
  name: string;
  description: string;
  image: string;
  removable: boolean;
  arrangeable: boolean;
  expandable: boolean;
  maxSize: number;
  members: StringPublicKey[];
  memberOf: CollectionSignature[];
}

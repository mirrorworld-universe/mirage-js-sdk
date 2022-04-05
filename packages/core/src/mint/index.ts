import {
  ARWEAVE_UPLOAD_ENDPOINT,
  Attribute,
  createAssociatedTokenAccountInstruction,
  createMint,
  Creator,
  findProgramAddress,
  getAssetCostToStore,
  programIds,
  StringPublicKey,
  toPublicKey,
  createMasterEditionV3,
  createMetadataV2,
  updateMetadataV2,
  AR_SOL_HOLDER_ID,
  ENDPOINT_NAME,
  sendTransactionWithRetry,
  WalletSigner,
} from '@mirrorworld/mirage.utils';

import { MintLayout, Token } from '@solana/spl-token';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import sha256 from 'crypto-js/sha256';

import BN from 'bn.js';
import { Collection, DataV2, Uses } from '@mirrorworld/metaplex';
import { prepPayForFilesTxn } from '../utils';
import { appendAddMembersInstruction } from '../listing/collection/addMembers';

const RESERVED_TXN_MANIFEST = 'manifest.json';
const RESERVED_METADATA = 'metadata.json';

export interface IMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string | undefined;
  animation_url: string | undefined;
  attributes: Attribute[] | undefined;
  external_url: string;
  properties: any;
  creators: Creator[] | null;
  sellerFeeBasisPoints: number;
  collection?: string;
  uses?: Uses;
}

export const mintNFT = async (
  connection: Connection,
  wallet: WalletSigner | undefined,
  endpoint: ENDPOINT_NAME,
  files: File[],
  metadata: IMetadata,
  progressCallback: (val: number) => any,
  maxSupply?: number,
  metadataUri?: string,
  collectionAddress?: string | undefined
): Promise<{
  metadataAccount: StringPublicKey;
} | void> => {
  if (!wallet?.publicKey) return;

  const metadataContent = {
    name: metadata.name,
    symbol: metadata.symbol,
    description: metadata.description,
    seller_fee_basis_points: metadata.sellerFeeBasisPoints,
    image: metadata.image,
    animation_url: metadata.animation_url,
    attributes: metadata.attributes,
    external_url: metadata.external_url,
    properties: {
      ...metadata.properties,
      creators: metadata.creators?.map((creator) => {
        return {
          address: creator.address,
          share: creator.share,
        };
      }),
    },
    collection: metadata.collection
      ? new PublicKey(metadata.collection).toBase58()
      : null,
    use: metadata.uses ? metadata.uses : null,
  };

  const realFiles: File[] = [
    ...files,
    new File([JSON.stringify(metadataContent)], RESERVED_METADATA),
  ];

  const { instructions: pushInstructions, signers: pushSigners } =
    await prepPayForFilesTxn(wallet, realFiles);

  progressCallback(1);

  const TOKEN_PROGRAM_ID = programIds().token;

  // Allocate memory for the account
  const mintRent = await connection.getMinimumBalanceForRentExemption(
    MintLayout.span
  );
  // const accountRent = await connection.getMinimumBalanceForRentExemption(
  //   AccountLayout.span,
  // );

  // This owner is a temporary signer and owner of metadata we use to circumvent requesting signing
  // twice post Arweave. We store in an account (payer) and use it post-Arweave to update MD with new link
  // then give control back to the user.
  // const payer = new Account();
  const payerPublicKey = wallet.publicKey.toBase58();
  const instructions: TransactionInstruction[] = [...pushInstructions];
  const signers: Keypair[] = [...pushSigners];

  // This is only temporarily owned by wallet...transferred to program by createMasterEdition below
  const mintKey = createMint(
    instructions,
    wallet.publicKey,
    mintRent,
    0,
    // Some weird bug with phantom where it's public key doesnt mesh with data encode wellff
    toPublicKey(payerPublicKey),
    toPublicKey(payerPublicKey),
    signers
  ).toBase58();

  console.log({ mintKey });

  const recipientKey = (
    await findProgramAddress(
      [
        wallet.publicKey.toBuffer(),
        programIds().token.toBuffer(),
        toPublicKey(mintKey).toBuffer(),
      ],
      programIds().associatedToken
    )
  )[0];

  createAssociatedTokenAccountInstruction(
    instructions,
    toPublicKey(recipientKey),
    wallet.publicKey,
    wallet.publicKey,
    toPublicKey(mintKey)
  );

  // Created token account
  progressCallback(1);

  const metadataAccount = await createMetadataV2(
    new DataV2({
      symbol: metadata.symbol,
      name: metadata.name,
      uri: ' '.repeat(64), // size of url for arweave
      sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
      // @ts-expect-error
      attributes: metadata.attributes,
      creators: metadata.creators,
      collection: metadata.collection
        ? new Collection({
            key: new PublicKey(metadata.collection).toBase58(),
            verified: false,
          })
        : null,
      uses: metadata.uses || null,
    }),
    payerPublicKey,
    mintKey,
    payerPublicKey,
    instructions,
    wallet.publicKey.toBase58()
  );

  // Created metadata
  progressCallback(2);

  // TODO: Add code to add NFT to collection during mint
  // We can use this on the solana block syncer
  // if (collectionAddress) {
  //   const collectionKey = toPublicKey(collectionAddress);
  //   appendAddMembersInstruction(
  //     wallet,
  //     collectionKey,
  //     instructions,
  //     toPublicKey(metadataAccount)
  //   );
  // }

  // Added token to collection
  progressCallback(3);

  // TODO: enable when using payer account to avoid 2nd popup
  // const block = await connection.getRecentBlockhash('singleGossip');
  // instructions.push(
  //   SystemProgram.transfer({
  //     fromPubkey: wallet.publicKey,
  //     toPubkey: payerPublicKey,
  //     lamports: 0.5 * LAMPORTS_PER_SOL // block.feeCalculator.lamportsPerSignature * 3 + mintRent, // TODO
  //   }),
  // );

  const { txid } = await sendTransactionWithRetry(
    connection,
    wallet,
    instructions,
    signers,
    'single'
  );
  progressCallback(3);

  try {
    await connection.confirmTransaction(txid, 'max');
    progressCallback(4);
  } catch {
    // ignore
  }

  // Force wait for max confirmations
  // await connection.confirmTransaction(txid, 'max');
  await connection.getParsedTransaction(txid, 'confirmed');
  progressCallback(5);

  // const metadataFile = result.messages?.find(
  //   (m) => m.filename === RESERVED_TXN_MANIFEST
  // );
  const updateInstructions: TransactionInstruction[] = [];
  const updateSigners: Keypair[] = [];

  // if (metadataFile?.transactionId && wallet.publicKey) {

  // TODO: connect to testnet arweave
  // const arweaveLink = `https://arweave.net/${metadataFile?.transactionId}`;
  await updateMetadataV2(
    new DataV2({
      symbol: metadata.symbol,
      name: metadata.name,
      uri: metadataUri!,
      sellerFeeBasisPoints: metadata.sellerFeeBasisPoints,
      creators: metadata.creators,
      collection: metadata.collection
        ? new Collection({
            key: new PublicKey(metadata.collection).toBase58(),
            verified: false,
          })
        : null,
      uses: metadata.uses || null,
    }),
    undefined,
    undefined,
    mintKey,
    payerPublicKey,
    updateInstructions,
    metadataAccount
  );

  // Finalizing metadata
  progressCallback(5);

  updateInstructions.push(
    Token.createMintToInstruction(
      TOKEN_PROGRAM_ID,
      toPublicKey(mintKey),
      toPublicKey(recipientKey),
      toPublicKey(payerPublicKey),
      [],
      1
    )
  );

  // Creating minting instruction
  progressCallback(6);
  // // In this instruction, mint authority will be removed from the main mint, while
  // // minting authority will be maintained for the Printing mint (which we want.)
  await createMasterEditionV3(
    // @ts-ignore
    maxSupply !== undefined ? new BN(maxSupply) : undefined,
    mintKey,
    payerPublicKey,
    payerPublicKey,
    payerPublicKey,
    updateInstructions
  );

  // Create master edition
  progressCallback(8);

  await sendTransactionWithRetry(
    connection,
    wallet,
    updateInstructions,
    updateSigners
  );

  // Success
  progressCallback(9);

  // TODO: Notify user when transaction is successful
  console.log('Art created on Solana');
  alert('Art created on Solana');

  console.log({ metadataAccount });
  return { metadataAccount };
};

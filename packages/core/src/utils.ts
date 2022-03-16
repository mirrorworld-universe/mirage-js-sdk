import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from '@solana/web3.js';
import {
  AccountAndPubkey,
  ARWEAVE_UPLOAD_ENDPOINT,
  AR_SOL_HOLDER_ID,
  createPipelineExecutor,
  getAssetCostToStore,
  getEdition,
  getMultipleAccounts,
  getProgramAccounts,
  MAX_CREATOR_LEN,
  MAX_CREATOR_LIMIT,
  MAX_NAME_LENGTH,
  MAX_SYMBOL_LENGTH,
  MAX_URI_LENGTH,
  METADATA_PREFIX,
  METADATA_PROGRAM_ID,
  ParsedAccount,
  programIds,
  StringPublicKey,
  WalletSigner,
  WhitelistedCreator,
} from '@mirrorworld/mirage.utils';
import sha256 from 'crypto-js/sha256';
import { MetaState } from './listing/types';
import {
  Metadata,
  ProcessAccountsFunc,
  UnPromise,
  UpdateStateValueFunc,
} from './types';
import {
  isMetadataPartOfStore,
  processMetaData,
} from './queries/processors/metadata';

const metaProgamPublicKey = new PublicKey(METADATA_PROGRAM_ID);
const metaProgamPublicKeyBuffer = metaProgamPublicKey.toBuffer();
// Create UTF-8 bytes Buffer from string
// similar to Buffer.from(METADATA_PREFIX) but should work by default in node.js/browser
const metaProgamPrefixBuffer = new TextEncoder().encode(METADATA_PREFIX);

/**
 * Get Addresses of Metadata account assosiated with Mint Token
 */
export async function getSolanaMetadataAddress(tokenMint: PublicKey) {
  const metaProgamPublicKey = new PublicKey(METADATA_PROGRAM_ID);
  return (
    await PublicKey.findProgramAddress(
      [metaProgamPrefixBuffer, metaProgamPublicKeyBuffer, tokenMint.toBuffer()],
      metaProgamPublicKey
    )
  )[0];
}

/**
 * Check if passed address is Solana address
 */
export const isValidSolanaAddress = (address: string) => {
  try {
    // this fn accepts Base58 character
    // and if it pass we suppose Solana address is valid
    new PublicKey(address);
    return true;
  } catch (error) {
    // Non-base58 character or can't be used as Solana address
    return false;
  }
};

export const prepPayForFilesTxn = async (
  wallet: WalletSigner,
  files: File[]
): Promise<{
  instructions: TransactionInstruction[];
  signers: Keypair[];
}> => {
  const memo = programIds().memo;

  const instructions: TransactionInstruction[] = [];
  const signers: Keypair[] = [];

  if (wallet.publicKey)
    instructions.push(
      SystemProgram.transfer({
        fromPubkey: wallet.publicKey,
        toPubkey: AR_SOL_HOLDER_ID,
        lamports: await getAssetCostToStore(files),
      })
    );

  for (let i = 0; i < files.length; i++) {
    const hashSum = sha256(await files[i].text());
    const hex = hashSum.toString();
    instructions.push(
      new TransactionInstruction({
        keys: [],
        programId: memo,
        data: Buffer.from(hex),
      })
    );
  }

  return {
    instructions,
    signers,
  };
};

export interface IArweaveResult {
  error?: string;
  messages?: Array<{
    filename: string;
    status: 'success' | 'fail';
    transactionId?: string;
    error?: string;
  }>;
}

export const uploadToArweave = async (
  data: FormData
): Promise<IArweaveResult> => {
  const resp = await fetch(ARWEAVE_UPLOAD_ENDPOINT, {
    method: 'POST',
    // @ts-ignore
    body: data,
  });

  if (!resp.ok) {
    return Promise.reject(
      new Error(
        'Unable to upload the artwork to Arweave. Please wait and then try again.'
      )
    );
  }

  const result: IArweaveResult = await resp.json();

  if (result.error) {
    return Promise.reject(new Error(result.error));
  }

  return result;
};

export const makeSetter =
  (state: MetaState): UpdateStateValueFunc<MetaState> =>
  (prop, key, value) => {
    if (prop === 'store') {
      state[prop] = value;
    } else if (prop === 'metadata') {
      state.metadata.push(value);
    } else if (prop === 'storeIndexer') {
      state.storeIndexer = state.storeIndexer.filter(
        (p) => p.info.page.toNumber() != value.info.page.toNumber()
      );
      state.storeIndexer.push(value);
      state.storeIndexer = state.storeIndexer.sort((a, b) =>
        a.info.page.sub(b.info.page).toNumber()
      );
    } else {
      state[prop][key] = value;
    }
    return state;
  };

export const processingAccounts =
  (updater: UpdateStateValueFunc) =>
  (fn: ProcessAccountsFunc) =>
  async (accounts: AccountAndPubkey[]) => {
    await createPipelineExecutor(
      accounts.values(),
      (account) => fn(account, updater),
      {
        sequence: 10,
        delay: 1,
        jobsCount: 3,
      }
    );
  };

export const pullEditions = async (
  connection: Connection,
  updater: UpdateStateValueFunc,
  state: MetaState,
  metadataArr: ParsedAccount<Metadata>[]
) => {
  type MultipleAccounts = UnPromise<ReturnType<typeof getMultipleAccounts>>;
  let setOf100MetadataEditionKeys: string[] = [];
  const editionPromises: Promise<void>[] = [];

  const loadBatch = () => {
    editionPromises.push(
      getMultipleAccounts(
        connection,
        setOf100MetadataEditionKeys,
        'recent'
      ).then(processEditions)
    );
    setOf100MetadataEditionKeys = [];
  };

  const processEditions = (returnedAccounts: MultipleAccounts) => {
    for (let j = 0; j < returnedAccounts.array.length; j++) {
      processMetaData(
        {
          pubkey: returnedAccounts.keys[j],
          account: returnedAccounts.array[j],
        },
        updater
      );
    }
  };

  for (const metadata of metadataArr) {
    // let editionKey: StringPublicKey;
    // TODO the nonce builder isnt working here, figure out why
    //if (metadata.info.editionNonce === null) {
    const editionKey = await getEdition(metadata.info.mint);
    /*} else {
        editionKey = (
          await PublicKey.createProgramAddress(
            [
              Buffer.from(METADATA_PREFIX),
              toPublicKey(METADATA_PROGRAM_ID).toBuffer(),
              toPublicKey(metadata.info.mint).toBuffer(),
              new Uint8Array([metadata.info.editionNonce || 0]),
            ],
            toPublicKey(METADATA_PROGRAM_ID),
          )
        ).toBase58();
      }*/

    setOf100MetadataEditionKeys.push(editionKey);

    if (setOf100MetadataEditionKeys.length >= 100) {
      loadBatch();
    }
  }

  if (setOf100MetadataEditionKeys.length >= 0) {
    loadBatch();
  }

  await Promise.all(editionPromises);
};

export const pullMetadataByCreators = (
  connection: Connection,
  state: MetaState,
  updater: UpdateStateValueFunc
): Promise<any> => {
  const whitelistedCreators = Object.values(state.whitelistedCreatorsByCreator);

  const setter: UpdateStateValueFunc = async (prop, key, value) => {
    if (prop === 'metadataByMint') {
      await initMetadata(value, state.whitelistedCreatorsByCreator, updater);
    } else {
      updater(prop, key, value);
    }
  };
  const forEachAccount = processingAccounts(setter);

  const additionalPromises: Promise<void>[] = [];
  for (const creator of whitelistedCreators) {
    for (let i = 0; i < MAX_CREATOR_LIMIT; i++) {
      const promise = getProgramAccounts(connection, METADATA_PROGRAM_ID, {
        filters: [
          {
            memcmp: {
              offset:
                1 + // key
                32 + // update auth
                32 + // mint
                4 + // name string length
                MAX_NAME_LENGTH + // name
                4 + // uri string length
                MAX_URI_LENGTH + // uri
                4 + // symbol string length
                MAX_SYMBOL_LENGTH + // symbol
                2 + // seller fee basis points
                1 + // whether or not there is a creators vec
                4 + // creators vec length
                i * MAX_CREATOR_LEN,
              bytes: creator.info.address,
            },
          },
        ],
      }).then(forEachAccount(processMetaData));
      additionalPromises.push(promise);
    }
  }

  return Promise.all(additionalPromises);
};

export const pullMetadataByKeys = async (
  connection: Connection,
  state: MetaState,
  metadataKeys: StringPublicKey[]
): Promise<MetaState> => {
  const updateState = makeSetter(state);

  let setOf100MetadataEditionKeys: string[] = [];
  const metadataPromises: Promise<void>[] = [];

  const loadBatch = () => {
    metadataPromises.push(
      getMultipleAccounts(
        connection,
        setOf100MetadataEditionKeys,
        'recent'
      ).then(({ keys, array }) => {
        keys.forEach((key, index) =>
          processMetaData({ pubkey: key, account: array[index] }, updateState)
        );
      })
    );
    setOf100MetadataEditionKeys = [];
  };

  for (const metadata of metadataKeys) {
    setOf100MetadataEditionKeys.push(metadata);

    if (setOf100MetadataEditionKeys.length >= 100) {
      loadBatch();
    }
  }

  if (setOf100MetadataEditionKeys.length >= 0) {
    loadBatch();
  }

  await Promise.all(metadataPromises);
  return state;
};

export const initMetadata = async (
  metadata: ParsedAccount<Metadata>,
  whitelistedCreators: Record<string, ParsedAccount<WhitelistedCreator>>,
  setter: UpdateStateValueFunc
) => {
  if (isMetadataPartOfStore(metadata, whitelistedCreators)) {
    await metadata.info.init();
    setter('metadataByMint', metadata.info.mint, metadata);
    setter('metadata', '', metadata);
    const masterEditionKey = metadata.info?.masterEdition;
    if (masterEditionKey) {
      setter('metadataByMasterEdition', masterEditionKey, metadata);
    }
  }
};

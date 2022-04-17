import { Connection, PublicKey, RpcResponseAndContext, SignatureResult } from '@solana/web3.js';
import { Keypair, SendOptions } from '@solana/web3.js';
import { BN, Wallet } from '@project-serum/anchor';
import fetch from 'isomorphic-fetch';
import { actions, MetadataJson, programs } from '@metaplex/js';
import { Transaction } from '@metaplex-foundation/mpl-core';
import { sleep } from './transactions';

const { prepareTokenAccountAndMintTxs } = actions;
const {
  metadata: { Metadata, MasterEdition, MetadataDataData, CreateMasterEdition, CreateMetadata, Creator, UpdateMetadata },
} = programs;

const lookup = (url: string) => async () => {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data;
  } catch (_a) {
    throw new Error(`unable to get metadata json from url ${url}`);
  }
};

export interface MintNFTParams {
  connection: Connection;
  wallet: Wallet;
  uri: string;
  maxSupply?: number;
  updateAuthority: PublicKey;
}

export interface MintNFTResponse {
  transaction: RpcResponseAndContext<SignatureResult>;
  // transaction: string;
  mint: PublicKey;
  metadata: PublicKey;
  edition: PublicKey;
}

export const mintNFT = async ({ connection, wallet, uri, maxSupply, updateAuthority }: MintNFTParams): Promise<MintNFTResponse> => {
  const { mint, createMintTx, createAssociatedTokenAccountTx, mintToTx } = await prepareTokenAccountAndMintTxs(connection, wallet.publicKey);

  // Sometimes reading new assets from nft.storage slow
  const _retryLookupFunction = retryUntil(40000);
  const metadataPDA = await Metadata.getPDA(mint.publicKey);
  const editionPDA = await MasterEdition.getPDA(mint.publicKey);

  await sleep(3000);
  const lookupResult = (await _retryLookupFunction(lookup(uri))) as any as MetadataJson;

  const {
    name,
    symbol,
    seller_fee_basis_points,
    properties: { creators },
  } = lookupResult;

  const creatorsData = creators.reduce((memo, { address, share }) => {
    const verified = address === wallet.publicKey.toString();

    const creator = new Creator({
      address,
      share,
      verified,
    });

    memo = [...memo, creator];

    return memo;
    // @ts-ignore
  }, [] as Creator[]);

  const metadataData = new MetadataDataData({
    name,
    symbol,
    uri,
    sellerFeeBasisPoints: seller_fee_basis_points,
    creators: creatorsData,
  });

  const createMetadataTx = new CreateMetadata(
    {
      feePayer: wallet.publicKey,
    },
    {
      metadata: metadataPDA,
      metadataData,
      updateAuthority: wallet.publicKey,
      mint: mint.publicKey,
      mintAuthority: wallet.publicKey,
    }
  );

  const masterEditionTx = new CreateMasterEdition(
    { feePayer: wallet.publicKey },
    {
      edition: editionPDA,
      metadata: metadataPDA,
      updateAuthority: wallet.publicKey,
      mint: mint.publicKey,
      mintAuthority: wallet.publicKey,
      maxSupply: maxSupply || maxSupply === 0 ? new BN(maxSupply) : undefined,
    }
  );

  const updateMetaDataTx = new UpdateMetadata(
    {
      feePayer: wallet.publicKey,
    },
    {
      metadata: metadataPDA,
      updateAuthority: wallet.publicKey,
      newUpdateAuthority: updateAuthority,
    }
  );

  const txt = new Transaction();
  txt.add(createMintTx).add(createMetadataTx).add(createAssociatedTokenAccountTx).add(mintToTx).add(masterEditionTx).add(updateMetaDataTx);

  txt.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
  txt.feePayer = wallet.publicKey;

  let signed: Transaction | undefined = undefined;

  try {
    await txt.partialSign(...[mint]);
    signed = await wallet.signTransaction(txt);
  } catch (e: any) {
    console.error(e.message);
  }

  let signature: string | undefined = undefined;
  signature = await connection.sendRawTransaction(signed!.serialize());

  const result = await connection.confirmTransaction(signature, 'confirmed');
  return {
    transaction: result,
    mint: mint.publicKey,
    metadata: metadataPDA,
    edition: editionPDA,
  };
};

const isFunction = (f: unknown) => typeof f === 'function';

const retryUntil =
  (duration: number) =>
  (fn: Function, ...args: unknown[]) => {
    let threw = true;
    const start = Date.now();
    const catcher = (er: Error) => {
      const left = duration + start - Date.now();
      if (left > 0) return retryUntil(left)(fn, ...args);
      else throw er;
    };

    while (true) {
      try {
        const ret = fn(...args);
        threw = false;
        return ret && isFunction(ret.then) && isFunction(ret.catch) ? ret.catch(catcher) : ret;
      } finally {
        if (threw && Date.now() - start < duration) continue;
      }
    }
  };

interface ISendTransactionParams {
  connection: Connection;
  wallet: Wallet;
  txs: Transaction[];
  signers?: Keypair[];
  options?: SendOptions;
}

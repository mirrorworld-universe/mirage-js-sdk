import { queryExtendedMetadata } from '@mirrorworld/mirage.utils';
import { Connection } from '@solana/web3.js';
import { getMetaState, mergeState } from './state';

export async function updateMints(
  connection: Connection,
  metadataByMint: any,
  state = getMetaState()
) {
  try {
    const { metadata, mintToMetadata } = await queryExtendedMetadata(
      connection,
      metadataByMint
    );

    state = mergeState({
      metadata,
      metadataByMint: mintToMetadata,
    });

    return state;
  } catch (er) {
    console.error(er);
  }
}

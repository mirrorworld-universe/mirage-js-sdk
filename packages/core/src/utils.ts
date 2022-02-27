import { PublicKey } from '@solana/web3.js';
import {
  METADATA_PREFIX,
  METADATA_PROGRAM_ID,
} from '@mirrorworld/mirage.utils';

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

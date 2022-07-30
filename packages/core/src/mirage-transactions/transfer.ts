import { Connection, LAMPORTS_PER_SOL, PublicKey, SYSVAR_INSTRUCTIONS_PUBKEY, Transaction } from '@solana/web3.js';
import { AuctionHouse } from '../types';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getAccountInfo, getNftOwner, getTokenTransactions } from '../utils';
import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house';
import {
  CancelInstructionAccounts,
  CancelInstructionArgs,
  CancelListingReceiptInstructionAccounts,
  createCancelInstruction,
  createCancelListingReceiptInstruction,
} from '@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions';
import { Program } from '@project-serum/anchor';
import { AuctionHouseProgramIDL } from '../idl';

export async function createTransferInstruction(
  mint: PublicKey,
  recipient: PublicKey,
  holderPublicKey: PublicKey,
  auctionHouse: PublicKey,
  auctionHouseAuthority: PublicKey,
  program: Program<AuctionHouseProgramIDL>,
  connection: Connection
) {
  const _mint = new PublicKey(mint);
  const _recipient = new PublicKey(recipient);

  const txt = new Transaction();

  const [senderAddress, sender, nft] = await getNftOwner(mint, connection);

  if (holderPublicKey.toBase58() !== senderAddress) {
    throw new Error('You cannot list an NFT you do not own');
  }
  const senderAta = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, _mint, sender);
  const recipientAta = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, _mint, _recipient);

  console.log('recipient  Associated Token Account', recipientAta);

  try {
    // Here we attempt to get the account information
    // for the user's ATA. If the account information
    // is retrievable, we do nothing. However if it is not
    // it will throw a "TokenAccountNotFoundError".
    // This means that the recipient's token account has not
    // yet been initialized on-chain.
    await getAccountInfo(connection, recipientAta);
  } catch (error: any) {
    if (error.message === 'TokenAccountNotFoundError') {
      console.log('Token Account not previously initialized. Creating Associated Token Account Instruction');
      const createAtaInstruction = await Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        _mint,
        recipientAta,
        _recipient,
        holderPublicKey
      );

      txt.add(createAtaInstruction);
    }
  }

  const transferNftInstruction = await Token.createTransferInstruction(TOKEN_PROGRAM_ID, senderAta, recipientAta, sender, [], 1);

  txt.add(transferNftInstruction);

  return txt;
}

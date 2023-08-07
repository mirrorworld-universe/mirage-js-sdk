import { Connection, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { ASSOCIATED_TOKEN_PROGRAM_ID, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { getAccountInfo } from '../utils';

export async function createTransferInstruction(mint: PublicKey, recipient: PublicKey, sender: PublicKey, connection: Connection, amount = 1) {
  const txt = new Transaction();

  const instructions = await createRawTransferInstructions(mint, recipient, sender, connection, amount);
  txt.add(...instructions);

  return txt;
}

export const createRawTransferInstructions = async (mint: PublicKey, recipient: PublicKey, sender: PublicKey, connection: Connection, amount = 1) => {
  const _mint = new PublicKey(mint);
  const _recipient = new PublicKey(recipient);

  const senderAta = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, _mint, sender);
  const recipientAta = await Token.getAssociatedTokenAddress(ASSOCIATED_TOKEN_PROGRAM_ID, TOKEN_PROGRAM_ID, _mint, _recipient);

  console.log('recipient  Associated Token Account', recipientAta);

  const instructions: TransactionInstruction[] = [];

  try {
    // Here we attempt to get the account information
    // for the user's ATA. If the account information
    // is retrievable, we do nothing. However, if it is not
    // it will throw a "TokenAccountNotFoundError".
    // This means that the recipient's token account has not
    // yet been initialized on-chain.
    await getAccountInfo(connection, recipientAta);
  } catch (error: any) {
    if (error.message === 'TokenAccountNotFoundError') {
      console.log('Token Account not previously initialized. Creating Associated Token Account Instruction');
      const createAtaInstruction = Token.createAssociatedTokenAccountInstruction(
        ASSOCIATED_TOKEN_PROGRAM_ID,
        TOKEN_PROGRAM_ID,
        _mint,
        recipientAta,
        _recipient,
        sender
      );

      instructions.push(createAtaInstruction);
    }
  }

  const transferInstruction = Token.createTransferInstruction(TOKEN_PROGRAM_ID, senderAta, recipientAta, sender, [], amount);
  instructions.push(transferInstruction);

  return instructions;
};

import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js';
import { AuctionHouse } from '../types';
import { Program } from '@project-serum/anchor';
import { NATIVE_MINT, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createWithdrawFromTreasuryInstruction } from '@metaplex-foundation/mpl-auction-house/dist/src/generated';
import { AuctionHouseIDL } from '../auctionHouseIdl';
import * as web3 from '@solana/web3.js';
import { createRawTransferInstructions } from './transfer';

export const getAuctionHouseBalance = async (auctionHouse: PublicKey, program: Program<AuctionHouseIDL>, connection: Connection): Promise<number> => {
  const ah = (await program.account.auctionHouse.fetch(auctionHouse)) as any as AuctionHouse;
  const isNative = ah.treasuryMint.equals(NATIVE_MINT);

  try {
    if (isNative) {
      const balance = await connection.getBalance(ah.auctionHouseTreasury);
      const rent = await connection.getMinimumBalanceForRentExemption(0);

      return balance - rent;
    }

    const keypair = Keypair.generate();
    const token = new Token(connection, ah.treasuryMint, TOKEN_PROGRAM_ID, keypair);
    const associatedTokenAccount = await token.getAccountInfo(ah.auctionHouseTreasury);
    return associatedTokenAccount.amount.toNumber();
  } catch (e: any) {
    console.log(e);
    throw new Error(e.message);
  }
};

export const withdrawFees = async (
  amount: number,
  auctionHouse: PublicKey,
  royaltyBasePoints: number,
  royaltyDestination: PublicKey,
  program: Program<AuctionHouseIDL>,
  connection: Connection
): Promise<Transaction> => {
  const ah = (await program.account.auctionHouse.fetch(auctionHouse)) as any as AuctionHouse;

  const withdrawFromTreasuryInstructionAccounts = {
    treasuryMint: ah.treasuryMint,
    authority: ah.authority,
    treasuryWithdrawalDestination: ah.treasuryWithdrawalDestination,
    auctionHouseTreasury: ah.auctionHouseTreasury,
    auctionHouse,
  };
  const withdrawFromTreasuryInstructionArgs = {
    amount,
  };

  const withdrawFromTreasuryInstruction = createWithdrawFromTreasuryInstruction(withdrawFromTreasuryInstructionAccounts, withdrawFromTreasuryInstructionArgs);

  let royaltyWithdrawFromTreasuryInstruction: TransactionInstruction[] = [];
  let royaltyAmount = Math.floor((amount * royaltyBasePoints) / 10000);

  if (royaltyAmount && ah.treasuryMint.equals(NATIVE_MINT)) {
    royaltyWithdrawFromTreasuryInstruction.push(
      web3.SystemProgram.transfer({
        fromPubkey: ah.treasuryWithdrawalDestination,
        toPubkey: royaltyDestination,
        lamports: royaltyAmount,
      })
    );
  } else if (royaltyAmount) {
    royaltyWithdrawFromTreasuryInstruction = await createRawTransferInstructions(
      ah.treasuryMint,
      royaltyDestination,
      ah.treasuryWithdrawalDestination,
      connection,
      royaltyAmount
    );
  }

  const txt = new Transaction();
  txt.add(withdrawFromTreasuryInstruction);
  txt.add(...royaltyWithdrawFromTreasuryInstruction);

  return txt;
};

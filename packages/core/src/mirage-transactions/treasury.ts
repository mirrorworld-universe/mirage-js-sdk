import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { AuctionHouse } from '../types';
import { Program } from '@project-serum/anchor';
import { NATIVE_MINT, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { createWithdrawFromTreasuryInstruction } from '@metaplex-foundation/mpl-auction-house/dist/src/generated';
import { AuctionHouseIDL } from '../auctionHouseIdl';

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

export const withdrawFees = async (amount: number, auctionHouse: PublicKey, program: Program<AuctionHouseIDL>): Promise<Transaction> => {
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

  const txt = new Transaction();
  txt.add(withdrawFromTreasuryInstruction);

  return txt;
};

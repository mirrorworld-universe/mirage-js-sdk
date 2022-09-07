import { AuctionHouseProgram } from '@metaplex-foundation/mpl-auction-house';
import { createUpdateAuctionHouseInstruction } from '@metaplex-foundation/mpl-auction-house/dist/src/generated/instructions';
import { PublicKey, PublicKeyInitData, Transaction, TransactionInstruction } from '@solana/web3.js';
import { NATIVE_MINT } from '@solana/spl-token';

export interface UpdateMarketplaceOptions {
  /**
   * The public address that is the owner
   * of the marketplace/auction-house.
   *
   * This account also serves as the marketplace authority.
   */
  authority: PublicKey;
  /**
   * The public address of the new marketplace authority
   * Transferring this will transfer the authority of the marketplace to this address.
   */
  newAuthority?: PublicKey;
  /**
   * Trading currency of the marketplace. If this is not provided,
   * then we default to SOL.
   *
   * @default new PublicKey("So11111111111111111111111111111111111111112")
   */
  treasuryMint?: PublicKey;
  /**
   * This public key is the account to which withdrawal funds will be
   * transferred to when the marketplace owner withdraws the funds.
   *
   * If this is not provided, it defaults to the marketplace owner
   */
  feeWithdrawalDestination?: PublicKey;
  /**
   * This is the marketplace commission defined by the marketplace. For every transaction,
   * a percentage equal to the seller fee basis points of the transaction value will
   * be transferred to the marketplace fee account.
   */
  sellerFeeBasisPoints: number;
  treasuryWithdrawalDestination?: PublicKey;
  /**
   * Determines whether the marketplace authority can change the
   * sale price or not.
   *
   * @default false
   */
  requiresSignOff?: boolean;
  /**
   * Determines whether a marketplace authority can change the
   * sale price or not.
   *
   * @default false
   */
  canChangeSalePrice?: boolean;
}

export async function createUpdateMarketplaceTransaction(updateMarketplaceOptions: UpdateMarketplaceOptions, feePayer?: PublicKey) {
  const auctionHouseUpdateInstruction = await updateAuctionHouseInstruction({
    payer: feePayer || updateMarketplaceOptions.authority,
    authority: updateMarketplaceOptions.authority,
    newAuthority: updateMarketplaceOptions.newAuthority || updateMarketplaceOptions.authority,
    sellerFeeBasisPoints: updateMarketplaceOptions.sellerFeeBasisPoints,
    treasuryWithdrawalDestination: updateMarketplaceOptions.treasuryWithdrawalDestination || updateMarketplaceOptions.authority,
    feeWithdrawalDestination: updateMarketplaceOptions.feeWithdrawalDestination || updateMarketplaceOptions.authority,
    treasuryMint: updateMarketplaceOptions.treasuryMint,
    requiresSignOff: !!updateMarketplaceOptions.requiresSignOff,
    canChangeSalePrice: !!updateMarketplaceOptions.canChangeSalePrice,
  });

  const txt = new Transaction();
  txt.add(auctionHouseUpdateInstruction);

  return txt;
}

interface UpdateAuctionHouseParams {
  payer: PublicKey;
  authority: PublicKey;
  newAuthority: PublicKey;
  sellerFeeBasisPoints: number;
  canChangeSalePrice?: boolean;
  requiresSignOff?: boolean;
  treasuryWithdrawalDestination?: PublicKeyInitData;
  feeWithdrawalDestination?: PublicKeyInitData;
  treasuryMint?: PublicKeyInitData;
}

const updateAuctionHouseInstruction = async (params: UpdateAuctionHouseParams): Promise<TransactionInstruction> => {
  const {
    payer,
    authority,
    newAuthority,
    sellerFeeBasisPoints,
    canChangeSalePrice = false,
    requiresSignOff = false,
    treasuryWithdrawalDestination,
    feeWithdrawalDestination,
    treasuryMint,
  } = params;

  const twdKey = treasuryWithdrawalDestination ? new PublicKey(treasuryWithdrawalDestination) : authority;

  const fwdKey = feeWithdrawalDestination ? new PublicKey(feeWithdrawalDestination) : authority;

  const tMintKey = treasuryMint ? new PublicKey(treasuryMint) : NATIVE_MINT;

  const twdAta = tMintKey.equals(NATIVE_MINT) ? twdKey : (await AuctionHouseProgram.findAssociatedTokenAccountAddress(tMintKey, twdKey))[0];

  const [auctionHouse] = await AuctionHouseProgram.findAuctionHouseAddress(authority, tMintKey);

  return createUpdateAuctionHouseInstruction(
    {
      treasuryMint: tMintKey,
      payer,
      authority,
      newAuthority,
      feeWithdrawalDestination: fwdKey,
      treasuryWithdrawalDestination: twdAta,
      treasuryWithdrawalDestinationOwner: twdKey,
      auctionHouse,
    },
    {
      sellerFeeBasisPoints,
      requiresSignOff,
      canChangeSalePrice,
    }
  );
};

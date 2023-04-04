import { createCreateAuctionHouseInstruction } from '@metaplex-foundation/mpl-auction-house';
import { PublicKey, PublicKeyInitData, Transaction, TransactionInstruction } from '@solana/web3.js';
import { NATIVE_MINT } from '@solana/spl-token';
import { createOrUpdateStoreFront } from './store-front';
import { getAtaForMint } from '../utils';
import { getAuctionHouseAddress, getAuctionHouseFeeAddress, getAuctionHouseTreasuryAddress } from '../auctionUtils';

export interface CreateMarketplaceOptions {
  /**
   * The public address that is the owner
   * of the marketplace/auction-house.
   *
   * This account also serves as the marketplace authority.
   */
  owner: PublicKey;
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
   * @required
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

export interface CreateMarketplaceActionOptions extends Omit<CreateMarketplaceOptions, 'owner'> {}

export async function createCreateMarketplaceTransaction(createMarketplaceOptions: CreateMarketplaceOptions, storeFrontUrl?: string, feePayer?: PublicKey) {
  const auctionHouseCreateInstruction = await createAuctionHouseInstruction({
    payer: feePayer || createMarketplaceOptions.owner,
    wallet: createMarketplaceOptions.owner,
    sellerFeeBasisPoints: createMarketplaceOptions.sellerFeeBasisPoints,
    treasuryWithdrawalDestination: createMarketplaceOptions.treasuryWithdrawalDestination || createMarketplaceOptions.owner,
    feeWithdrawalDestination: createMarketplaceOptions.feeWithdrawalDestination || createMarketplaceOptions.owner,
    treasuryMint: createMarketplaceOptions.treasuryMint,
    requiresSignOff: !!createMarketplaceOptions.requiresSignOff,
    canChangeSalePrice: !!createMarketplaceOptions.canChangeSalePrice,
  });

  const txt = new Transaction();
  txt.add(auctionHouseCreateInstruction);

  if (storeFrontUrl) {
    const setStorefrontV2Instructions = await createOrUpdateStoreFront(
      createMarketplaceOptions.owner,
      feePayer || createMarketplaceOptions.owner,
      storeFrontUrl
    );
    txt.add(setStorefrontV2Instructions);
  }

  return txt;
}

interface CreateAuctionHouseParams {
  payer: PublicKey;
  wallet: PublicKey;
  sellerFeeBasisPoints: number;
  canChangeSalePrice?: boolean;
  requiresSignOff?: boolean;
  treasuryWithdrawalDestination?: PublicKeyInitData;
  feeWithdrawalDestination?: PublicKeyInitData;
  treasuryMint?: PublicKeyInitData;
}

const createAuctionHouseInstruction = async (params: CreateAuctionHouseParams): Promise<TransactionInstruction> => {
  const {
    payer,
    wallet,
    sellerFeeBasisPoints,
    canChangeSalePrice = false,
    requiresSignOff = false,
    treasuryWithdrawalDestination,
    feeWithdrawalDestination,
    treasuryMint,
  } = params;

  const twdKey = treasuryWithdrawalDestination ? new PublicKey(treasuryWithdrawalDestination) : wallet;

  const fwdKey = feeWithdrawalDestination ? new PublicKey(feeWithdrawalDestination) : wallet;

  const tMintKey = treasuryMint ? new PublicKey(treasuryMint) : NATIVE_MINT;

  const twdAta = tMintKey.equals(NATIVE_MINT) ? twdKey : getAtaForMint(tMintKey, twdKey)[0];

  const [auctionHouse, bump] = getAuctionHouseAddress(wallet, tMintKey);

  const [feeAccount, feePayerBump] = getAuctionHouseFeeAddress(auctionHouse);

  const [treasuryAccount, treasuryBump] = getAuctionHouseTreasuryAddress(auctionHouse);

  return createCreateAuctionHouseInstruction(
    {
      treasuryMint: tMintKey,
      payer: payer,
      authority: wallet,
      feeWithdrawalDestination: fwdKey,
      treasuryWithdrawalDestination: twdAta,
      treasuryWithdrawalDestinationOwner: twdKey,
      auctionHouse,
      auctionHouseFeeAccount: feeAccount,
      auctionHouseTreasury: treasuryAccount,
    },
    {
      bump,
      feePayerBump,
      treasuryBump,
      sellerFeeBasisPoints,
      requiresSignOff,
      canChangeSalePrice,
    }
  );
};

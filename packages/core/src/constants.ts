import { PublicKey } from '@solana/web3.js';

export const AUCTION_HOUSE = 'auction_house';
export const AUCTION_HOUSE_PROGRAM_ID = new PublicKey('hausS13jsjafwWwGqZTUQRmWyvyxn9EQpqMwV1PBBmk');
export const TOKEN_METADATA_PROGRAM_ID = new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s');
export const SPL_ASSOCIATED_TOKEN_ACCOUNT_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const WRAPPED_SOL_MINT = new PublicKey('So11111111111111111111111111111111111111112');
export const MIRAGE_AUCTION_HOUSE = new PublicKey('FW6o4vELLA4NojBdTjNGz1F7apWoj6Jtwb1YNbSdyB1X');
export const NFT_STORAGE_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEZDQjI0MDFEMTRGODk3OUViNkEzNDdhMWQ3MEMxMjQzMWI1OUUwZkMiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY0OTA4OTIxMzMyNSwibmFtZSI6Ik1pcnJvcldvcmxkX0RldmVsb3BtZW50X0tleSJ9.COpqZqwBbDM1bBgYuIiaQxsGRQc0gphXGCBMsRhAHk8';

export const MIRAGE_AUCTION_HOUSE_AUTHORITY = new PublicKey('Cq4P18vbjMQNE7J2nMme4RMpRyVFf8PGFNkvh5ecC4jF');

export const MINT_CONFIG = {
  // Earns a 4.25% on royalty sales
  seller_fee_basis_points: 425,
  mintRoyalties: 4.25,
};

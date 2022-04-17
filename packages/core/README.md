# Mirage Marketplace JS Client SDK
This repository contains the client side JDK for the MirrorWorld marketplace repository. The core functions that it contains are the listing of assets, buying of assets, canceling of listings, and gifting NFTs to specific Solana addresses.

[api-docs]: https://mirage-js-sdk.vercel.app/
[**API Documentation**][api-docs]

## Installation
> 🚨 Please make sure to add this NPM token in your `.npmrc` file:
> `npm_XXXXXXXX` (Please contact `jonas@mirrorworld.fun` for an authToken.

```bash
yarn add @mirrorworld/mirage.core
```

# Usage
Import the `Mirage` instance into your client. It expects a `connection` and `wallet` instance. You can get these by using one of the Solana Wallet Adapters your application will use to connect to a Solana RPC.

These transactions require you to sign the transaction using your wallet. That means you need to have SOL. You can request SOL from the [SolFaucet](https://solfaucet.com/)

```ts
import {
  Mirage,
  // Required. You can replace wit your own
  NFT_STORAGE_API_KEY,
  // Required. You can replace wit your own
  MIRAGE_AUCTION_HOUSE_AUTHORITY
} from "@mirrorworld/mirage.core"

const connection = useConnection()

/** Make sure your wallet is initialized and connected to the browser before providing to Mirage */ 
const wallet = useWallet()

/** mirage instance */
const mirage = new Mirage({
  connection,
  wallet,
  NFTStorageAPIKey: NFT_STORAGE_API_KEY,
  auctionHouseAuthority: MIRAGE_AUCTION_HOUSE_AUTHORITY,
});
```

## Live Demo
You can see example project in this live demo [here](https://mirage-demo.vercel.app/):

## NFT Actions

### Claim an NFT
Claiming an NFT (technically just minting a new NFT) is done with the `Mirage.mintNFT` method. See [docs](https://mirage-js-sdk.vercel.app/classes/core_src.Mirage.html#mintNFT) for details.
```ts
// This object should come from the back end. (For tokens to be claimed)
// It must follow the ERC-1155 standard for  NFT metadata
const metadataObject: MetadataObject = {
    name: `Mirror #${tokenId}`,
    symbol: 'MIRROR',
    collection: 'EMWv4qLVTLytXNheoWutoW1qFs6kP839GpZinK412GnS',
    description:
      'Mirrors is a collection of 11,000 unique AI Virtual Beings. Each Mirror can be upgraded and co-create narratives by talking with the collector, also offering a series of rights in the future games.\n',
    seller_fee_basis_points: 425,
    image: `https://storage.mirrorworld.fun/nft/1234.png`,
    attributes: [
      { trait_type: 'glasses', value: 'Bike Lens' },
      { trait_type: 'shoes', value: 'Fashion Sneakers, Purple' },
      { trait_type: 'pants', value: 'Beggar Pants, Green' },
      { trait_type: 'hat', value: 'None' },
      { trait_type: 'background', value: 'The Dance of Flies' },
      { trait_type: 'clothing', value: 'nabuC kraM Hoodie' },
      { trait_type: 'hair', value: 'nabuC kraM Hair' },
      { trait_type: 'bear', value: 'None' },
      { trait_type: 'skin', value: 'Blue' },
      { trait_type: 'soul', value: 'nabuC kraM' },
    ],
    external_url: '',
    properties: {
      files: [
        {
          uri: `https://storage.mirrorworld.fun/nft/1234.png`,
          type: 'unknown',
        },
      ],
      category: 'image',
      creators: [
        {
          address: "D5puQCwAbP29T4gRRfEuZ4Uai7UoFBcXgfutCJTBPAkL",
          verified: true,
          share: 95.75,
        },
      ],
    },
    animation_url: undefined,
  };
};

// Mint your new NFT
await mirage.mintNFT(metadata)
```
See this example [here](https://github.com/mirrorworld-universe/mirage-js-sdk/blob/9904a20ac6e6d1c7856bac1d252df2dec4bb1eff/examples/vue-ts/src/pages/index.vue#L158-L181)


## Trading
You can find examples of trading actions [here](https://github.com/mirrorworld-universe/mirage-js-sdk/blob/9904a20ac6e6d1c7856bac1d252df2dec4bb1eff/examples/vue-ts/src/pages/nft/%5Baddress%5D.vue#L288-L347)
### List an NFT
Listing an NFT is done with the `Mirage.listToken` method. See [docs](https://mirage-js-sdk.vercel.app/classes/core_src.Mirage.html#listToken) for details.
```ts
const mintAddress = "AQYAGzygMZQid99up64zFG75zwRX7DE1i2v9W4teq2xm"
const listingPrice = 0.5

await mirage.listToken(mintAddress, listingPrice)
```

### Cancelling listings
You can also cancel the listing of an NFT with the `Mirage.cancelListing` method. See [docs](https://mirage-js-sdk.vercel.app/classes/core_src.Mirage.html#cancelListing) for details.
```ts
const mintAddress = "AQYAGzygMZQid99up64zFG75zwRX7DE1i2v9W4teq2xm"
const listingPrice = 0.5

// NOTE
// It's important that the listing price of the token
// matches the exact price for which it was listed.
// Otherwise the transaction will fail.
// In other words, you cannot buy a token without a corresponfing listing receipt.
await mirage.cancelListing(mintAddress, listingPrice)
```

### Buy an NFT
Buying an NFT is done with the `Mirage.buyToken` method. See [docs](https://mirage-js-sdk.vercel.app/classes/core_src.Mirage.html#buyToken) for details.
```ts
const mintAddress = "AQYAGzygMZQid99up64zFG75zwRX7DE1i2v9W4teq2xm"
const listingPrice = 0.5

// NOTE
// It's important that the buying price of the token
// matches the exact price for which it was listed.
// Otherwise the transaction will fail.
// In other words, you cannot buy a token without a corresponfing listing receipt.
await mirage.buyToken(mintAddress, listingPrice)
```

### Gift an NFT
Gifting an NFT is done with the `Mirage.transferNft` method. See [docs](https://mirage-js-sdk.vercel.app/classes/core_src.Mirage.html#transferNft) for details.
```ts
const mintAddress = "AQYAGzygMZQid99up64zFG75zwRX7DE1i2v9W4teq2xm"
const receipientAddress = "D5puQCwAbP29T4gRRfEuZ4Uai7UoFBcXgfutCJTBPAkL"

await mirage.transferNft(mintAddress, receipientAddress)
```


## Querying NFT Transaction History
Any client can query the transaction history of NFT by invoking the `Mirage.getTokenTransactions` method. This returns an array of transaction receipts typed as [`Promise<TransactionReceipt[]>`](https://mirage-js-sdk.vercel.app/interfaces/core_src.TransactionReceipt.html).

A transaction receipt contains the information used to determine the state of any given trade in which the token was involved. You can therefore use this to track the history of an NFT.

This method sorts all receipts by the date they were ([`TransactionReceipt.createdAt`](https://mirage-js-sdk.vercel.app/interfaces/core_src.TransactionReceipt.html#createdAt)), and then by their receipt type ([`TransactionReceipt.receipt_type`](https://mirage-js-sdk.vercel.app/interfaces/core_src.TransactionReceipt.html#receipt_type)).

```ts
const transactions = await mirage.getTokenTransactions(tokenAddress.value)
```

In case you want to track this information yourself, you can view the source code for the [`getTokenTransactions`](https://github.com/mirrorworld-universe/mirage-js-sdk/blob/9904a20ac6e6d1c7856bac1d252df2dec4bb1eff/packages/core/src/mirage.ts#L743-L797) method.

### Further resources
- [Metaplex Auction House](https://docs.metaplex.com/auction-house/definition)

### TODO:
Track token ownership and cancel any existing listings in case the owner of an NFT transfers their token while they had a prior listing.

Specifically Mirage's syncer should currently store:

Trade Stade Account Keys
1. Trade State Token Size and Price parts of the seed
2. Token Account Keys that are stored in the trade state
3. Auction House Receipts (Listing Receipts, Bid Receipts, and Purchase Receipts)

Specifically Mirage need to track these two events on Token Accounts:
1. Ownership has changed from the original Seller of the NFT
2. Token Account Amount has changed to 0

If these events happen the `MIRAGE_AUCTION_HOUSE_AUTHORITY` can call instructions to cancel the bids and listings without the seller or buyer needing to be present.

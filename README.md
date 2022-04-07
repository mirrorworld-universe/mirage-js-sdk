# Mirage Marketplace JS Client SDK Demo
This repository contains the client side JDK for the MirrorWorld marketplace repository. The core functions that it contains are the listing of assets, Bank of assets, canceling of listings, and gifting NF tees to specific Salina addresses.

[api-docs]: https://mirage-js-sdk.vercel.app/
[**API Documentation**][api-docs]

## Installation
> 🚨 Please make sure to add this NPM token in your `.npmrc` file:
> `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`

```bash
yarn add @mirrorworld/mirage.core
```

# Usage
Import the `Mirage` instance into your client. It expects a `connection` and `wallet` instance. You can get these by using one of the Solana Wallet Adapters your application will use to connect to a Solana RPC.

```ts
import {
  Mirage,
  NFT_STORAGE_API_KEY,
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

## NFT Actions

### List an NFT
Listing an NFT is done with the `Mirage.listToken` method. See [docs](https://mirage-js-sdk.vercel.app/classes/core_src.Mirage.html#listToken) for details.
```ts
const mintAddress = "AQYAGzygMZQid99up64zFG75zwRX7DE1i2v9W4teq2xm"
const listingPrice = 0.5

await mirage.value.listToken(mintAddress, listingPrice)
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
await mirage.value.cancelListing(mintAddress, listingPrice)
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
await mirage.value.buyToken(mintAddress, listingPrice)
```

### Gift an NFT
Gifting an NFT is done with the `Mirage.transferNft` method. See [docs](https://mirage-js-sdk.vercel.app/classes/core_src.Mirage.html#transferNft) for details.
```ts
const mintAddress = "AQYAGzygMZQid99up64zFG75zwRX7DE1i2v9W4teq2xm"
const receipientAddress = "D5puQCwAbP29T4gRRfEuZ4Uai7UoFBcXgfutCJTBPAkL"

await mirage.value.transferNft(mintAddress, receipientAddress)
```


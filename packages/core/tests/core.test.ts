export const TODO = 'Add tests based on scripts below';
// (async () => {
//   const connection = new Connection(
//     'https://fragrant-black-cherry.solana-devnet.quiknode.pro/74fbede70f2b8f6ed9b5bac5bfcda983e8bab832/',
//     {
//       commitment: 'confirmed',
//       wsEndpoint:
//         'https://fragrant-black-cherry.solana-devnet.quiknode.pro/74fbede70f2b8f6ed9b5bac5bfcda983e8bab832/',
//     }
//   );

//   // Set your own minting address
//   const mintAddress = 'J7LVqJMfN6CGFxu6kVmMnutyUu1VfRobSYvwqsSHizCz';
//   const sellerAddress = await await getSellerWallet();
//   const buyerAddress = await await getBuyerWallet();

//   const sellerClient = new Mirage({
//     auctionHouseAuthority: auctionHouseAuthority.publicKey,
//     connection,
//     wallet: new Wallet(sellerAddress),
//     NFTStorageAPIKey: NFT_STORAGE_API_KEY,
//     mintConfig: {
//       seller_fee_basis_points: 500,
//       mintRoyalties: 7,
//     },
//   });

//   const buyerClient = new Mirage({
//     auctionHouseAuthority: auctionHouseAuthority.publicKey,
//     connection,
//     wallet: new Wallet(buyerAddress),
//     NFTStorageAPIKey: NFT_STORAGE_API_KEY,
//   });

//   try {
//     // await sleep(1000);
//     // await sellerClient.transferNft(mintAddress, buyerAddress.publicKey);
//     // const [owner] = await sellerClient.getNftOwner(mintAddress);
//     // console.log('New owner is', owner);
//     // console.log('token transactions for ', mintAddress, accounts);

//     // writeFileSync(
//     //   resolve(__dirname, './out.txt'),
//     //   accounts.toString(),
//     //   'utf-8'
//     // );

//     await sleep(2000);
//     // const [listTokenTxn, listTokenReceipt] = await sellerClient.listToken(
//     //   mintAddress,
//     //   2.3
//     // );
//     // console.log('[listTokenTxn, listTokenReceipt]', [
//     //   listTokenTxn,
//     //   JSON.stringify(listTokenReceipt),
//     // ]);
//     // const [
//     //   cancelListingTxn,
//     //   cancelListingReceipt,
//     // ] = await sellerClient.cancelListing(mintAddress, 2.3);
//     // console.log('[cancelListingTxn, cancelListingReceipt]', [
//     //   cancelListingTxn,
//     //   JSON.stringify(cancelListingReceipt),
//     // ]);
//     // await sleep(2000);
//     // const [relistTokenTxn, relistTokenReceipt] = await sellerClient.listToken(
//     //   mintAddress,
//     //   2.3
//     // );
//     // console.log('[relistTokenTxn, relistTokenReceipt]', [
//     //   relistTokenTxn,
//     //   JSON.stringify(relistTokenReceipt),
//     // ]);
//     // await sleep(2000);
//     // const [buyTokenTxn, buyTokenReceipt] = await buyerClient.buyToken(
//     //   mintAddress,
//     //   2.3
//     // );
//     // console.log('[buyTokenTxn, buyTokenReceipt]', [
//     //   buyTokenTxn,
//     //   JSON.stringify(buyTokenReceipt),
//     // ]);

//     // Get all receipts
//     await sleep(3000);
//     // console.time('getTokenTransactions');
//     // const accounts = await sellerClient.getTokenTransactions(mintAddress);
//     // console.timeEnd('getTokenTransactions');
//     // writeFileSync(
//     //   resolve(__dirname, './accounts.json'),
//     //   JSON.stringify(accounts, null, 2),
//     //   'utf-8'
//     // );
//     // console.time('getTokenTransactionsV2');
//     // const _accounts = await sellerClient.getTokenTransactionsV2(mintAddress);
//     // console.timeEnd('getTokenTransactionsV2');
//     // writeFileSync(
//     //   resolve(__dirname, './accountsV2.json'),
//     //   JSON.stringify(_accounts, null, 2),
//     //   'utf-8'
//     // );

//     const metadataObject = generateRandomNFTMetadata(
//       sellerAddress.publicKey.toBase58()
//     );
//     const nft = await sellerClient.mintNft(metadataObject);
//     console.log('Newly minted NFT', JSON.stringify(nft.data, null, 2));
//   } catch (error: any) {
//     console.log(error);
//     console.error(error.code, error.message);
//   }
// })();

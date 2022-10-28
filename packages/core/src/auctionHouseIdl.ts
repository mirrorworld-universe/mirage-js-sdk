export type AuctionHouseIDL = {
  version: '1.3.1';
  name: 'auction_house';
  instructions: [
    {
      name: 'withdrawFromFee';
      docs: ['Withdraw `amount` from the Auction House Fee Account to a provided destination account.'];
      accounts: [
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
          docs: ['Authority key for the Auction House.'];
        },
        {
          name: 'feeWithdrawalDestination';
          isMut: true;
          isSigner: false;
          docs: ['Account that pays for fees if the marketplace executes sales.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'auctionHouse';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'withdrawFromTreasury';
      docs: ['Withdraw `amount` from the Auction House Treasury Account to a provided destination account.'];
      accounts: [
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
          docs: ['Treasury mint account, either native SOL mint or a SPL token mint.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
          docs: ['Authority key for the Auction House.'];
        },
        {
          name: 'treasuryWithdrawalDestination';
          isMut: true;
          isSigner: false;
          docs: [
            'SOL or SPL token account to receive Auction House fees. If treasury mint is native this will be the same as the `treasury_withdrawl_destination_owner`.'
          ];
        },
        {
          name: 'auctionHouseTreasury';
          isMut: true;
          isSigner: false;
          docs: ['Auction House treasury PDA account.'];
        },
        {
          name: 'auctionHouse';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'updateAuctionHouse';
      docs: ['Update Auction House values such as seller fee basis points, update authority, treasury account, etc.'];
      accounts: [
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
          docs: ['Treasury mint account, either native SOL mint or a SPL token mint.'];
        },
        {
          name: 'payer';
          isMut: false;
          isSigner: true;
          docs: ['Key paying SOL fees for setting up the Auction House.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: true;
          docs: ['Authority key for the Auction House.'];
        },
        {
          name: 'newAuthority';
          isMut: false;
          isSigner: false;
          docs: ['New authority key for the Auction House.'];
        },
        {
          name: 'feeWithdrawalDestination';
          isMut: true;
          isSigner: false;
          docs: ['Account that pays for fees if the marketplace executes sales.'];
        },
        {
          name: 'treasuryWithdrawalDestination';
          isMut: true;
          isSigner: false;
          docs: [
            'SOL or SPL token account to receive Auction House fees. If treasury mint is native this will be the same as the `treasury_withdrawl_destination_owner`.'
          ];
        },
        {
          name: 'treasuryWithdrawalDestinationOwner';
          isMut: false;
          isSigner: false;
          docs: ['Owner of the `treasury_withdrawal_destination` account or the same address if the `treasury_mint` is native.'];
        },
        {
          name: 'auctionHouse';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'ataProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'sellerFeeBasisPoints';
          type: {
            option: 'u16';
          };
        },
        {
          name: 'requiresSignOff';
          type: {
            option: 'bool';
          };
        },
        {
          name: 'canChangeSalePrice';
          type: {
            option: 'bool';
          };
        }
      ];
    },
    {
      name: 'createAuctionHouse';
      docs: ['Create a new Auction House instance.'];
      accounts: [
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
          docs: ['Treasury mint account, either native SOL mint or a SPL token mint.'];
        },
        {
          name: 'payer';
          isMut: true;
          isSigner: true;
          docs: ['Key paying SOL fees for setting up the Auction House.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'feeWithdrawalDestination';
          isMut: true;
          isSigner: false;
          docs: ['Account that pays for fees if the marketplace executes sales.'];
        },
        {
          name: 'treasuryWithdrawalDestination';
          isMut: true;
          isSigner: false;
          docs: [
            'SOL or SPL token account to receive Auction House fees. If treasury mint is native this will be the same as the `treasury_withdrawl_destination_owner`.'
          ];
        },
        {
          name: 'treasuryWithdrawalDestinationOwner';
          isMut: false;
          isSigner: false;
          docs: ['Owner of the `treasury_withdrawal_destination` account or the same address if the `treasury_mint` is native.'];
        },
        {
          name: 'auctionHouse';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'auctionHouseTreasury';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance treasury PDA account.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'ataProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'bump';
          type: 'u8';
        },
        {
          name: 'feePayerBump';
          type: 'u8';
        },
        {
          name: 'treasuryBump';
          type: 'u8';
        },
        {
          name: 'sellerFeeBasisPoints';
          type: 'u16';
        },
        {
          name: 'requiresSignOff';
          type: 'bool';
        },
        {
          name: 'canChangeSalePrice';
          type: 'bool';
        }
      ];
    },
    {
      name: 'buy';
      docs: [
        'Create a private buy bid by creating a `buyer_trade_state` account and an `escrow_payment` account and funding the escrow with the necessary SOL or SPL token amount.'
      ];
      accounts: [
        {
          name: 'wallet';
          isMut: false;
          isSigner: true;
          docs: ['User wallet account.'];
        },
        {
          name: 'paymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['User SOL or SPL account to transfer funds from.'];
        },
        {
          name: 'transferAuthority';
          isMut: false;
          isSigner: false;
          docs: ['SPL token account transfer authority.'];
        },
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance treasury mint account.'];
        },
        {
          name: 'tokenAccount';
          isMut: false;
          isSigner: false;
          docs: ['SPL token account.'];
        },
        {
          name: 'metadata';
          isMut: false;
          isSigner: false;
          docs: ['SPL token account metadata.'];
        },
        {
          name: 'escrowPaymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer escrow payment account PDA.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance authority account.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'buyerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Buyer trade state PDA.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'tradeStateBump';
          type: 'u8';
        },
        {
          name: 'escrowPaymentBump';
          type: 'u8';
        },
        {
          name: 'buyerPrice';
          type: 'u64';
        },
        {
          name: 'tokenSize';
          type: 'u64';
        }
      ];
    },
    {
      name: 'auctioneerBuy';
      accounts: [
        {
          name: 'wallet';
          isMut: false;
          isSigner: true;
          docs: ['User wallet account.'];
        },
        {
          name: 'paymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['User SOL or SPL account to transfer funds from.'];
        },
        {
          name: 'transferAuthority';
          isMut: false;
          isSigner: false;
          docs: ['SPL token account transfer authority.'];
        },
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance treasury mint account.'];
        },
        {
          name: 'tokenAccount';
          isMut: false;
          isSigner: false;
          docs: ['SPL token account.'];
        },
        {
          name: 'metadata';
          isMut: false;
          isSigner: false;
          docs: ['SPL token account metadata.'];
        },
        {
          name: 'escrowPaymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer escrow payment account PDA.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'auctioneerAuthority';
          isMut: false;
          isSigner: true;
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'buyerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Buyer trade state PDA.'];
        },
        {
          name: 'ahAuctioneerPda';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'tradeStateBump';
          type: 'u8';
        },
        {
          name: 'escrowPaymentBump';
          type: 'u8';
        },
        {
          name: 'buyerPrice';
          type: 'u64';
        },
        {
          name: 'tokenSize';
          type: 'u64';
        }
      ];
    },
    {
      name: 'publicBuy';
      docs: [
        'Create a public buy bid by creating a `public_buyer_trade_state` account and an `escrow_payment` account and funding the escrow with the necessary SOL or SPL token amount.'
      ];
      accounts: [
        {
          name: 'wallet';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'paymentAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'transferAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'metadata';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'escrowPaymentAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'buyerTradeState';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'tradeStateBump';
          type: 'u8';
        },
        {
          name: 'escrowPaymentBump';
          type: 'u8';
        },
        {
          name: 'buyerPrice';
          type: 'u64';
        },
        {
          name: 'tokenSize';
          type: 'u64';
        }
      ];
    },
    {
      name: 'auctioneerPublicBuy';
      docs: [
        'Create a public buy bid by creating a `public_buyer_trade_state` account and an `escrow_payment` account and funding the escrow with the necessary SOL or SPL token amount.'
      ];
      accounts: [
        {
          name: 'wallet';
          isMut: false;
          isSigner: true;
        },
        {
          name: 'paymentAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'transferAuthority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenAccount';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'metadata';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'escrowPaymentAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'auctioneerAuthority';
          isMut: false;
          isSigner: true;
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'buyerTradeState';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'ahAuctioneerPda';
          isMut: false;
          isSigner: false;
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'tradeStateBump';
          type: 'u8';
        },
        {
          name: 'escrowPaymentBump';
          type: 'u8';
        },
        {
          name: 'buyerPrice';
          type: 'u64';
        },
        {
          name: 'tokenSize';
          type: 'u64';
        }
      ];
    },
    {
      name: 'cancel';
      docs: [
        'Cancel a bid or ask by revoking the token delegate, transferring all lamports from the trade state account to the fee payer, and setting the trade state account data to zero so it can be garbage collected.'
      ];
      accounts: [
        {
          name: 'wallet';
          isMut: true;
          isSigner: false;
          docs: ['User wallet account.'];
        },
        {
          name: 'tokenAccount';
          isMut: true;
          isSigner: false;
          docs: ['SPL token account containing the token of the sale to be canceled.'];
        },
        {
          name: 'tokenMint';
          isMut: false;
          isSigner: false;
          docs: ['Token mint account of SPL token.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance authority account.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'tradeState';
          isMut: true;
          isSigner: false;
          docs: ['Trade state PDA account representing the bid or ask to be canceled.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'buyerPrice';
          type: 'u64';
        },
        {
          name: 'tokenSize';
          type: 'u64';
        }
      ];
    },
    {
      name: 'auctioneerCancel';
      docs: ['Cancel, but with an auctioneer'];
      accounts: [
        {
          name: 'wallet';
          isMut: true;
          isSigner: false;
          docs: ['User wallet account.'];
        },
        {
          name: 'tokenAccount';
          isMut: true;
          isSigner: false;
          docs: ['SPL token account containing the token of the sale to be canceled.'];
        },
        {
          name: 'tokenMint';
          isMut: false;
          isSigner: false;
          docs: ['Token mint account of SPL token.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance authority account.'];
        },
        {
          name: 'auctioneerAuthority';
          isMut: false;
          isSigner: true;
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'tradeState';
          isMut: true;
          isSigner: false;
          docs: ['Trade state PDA account representing the bid or ask to be canceled.'];
        },
        {
          name: 'ahAuctioneerPda';
          isMut: false;
          isSigner: false;
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'buyerPrice';
          type: 'u64';
        },
        {
          name: 'tokenSize';
          type: 'u64';
        }
      ];
    },
    {
      name: 'deposit';
      docs: ['Deposit `amount` into the escrow payment account for your specific wallet.'];
      accounts: [
        {
          name: 'wallet';
          isMut: false;
          isSigner: true;
          docs: ['User wallet account.'];
        },
        {
          name: 'paymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['User SOL or SPL account to transfer funds from.'];
        },
        {
          name: 'transferAuthority';
          isMut: false;
          isSigner: false;
          docs: ['SPL token account transfer authority.'];
        },
        {
          name: 'escrowPaymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer escrow payment account PDA.'];
        },
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance treasury mint account.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance authority account.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'escrowPaymentBump';
          type: 'u8';
        },
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'auctioneerDeposit';
      docs: ['Deposit `amount` into the escrow payment account for your specific wallet.'];
      accounts: [
        {
          name: 'wallet';
          isMut: false;
          isSigner: true;
          docs: ['User wallet account.'];
        },
        {
          name: 'paymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['User SOL or SPL account to transfer funds from.'];
        },
        {
          name: 'transferAuthority';
          isMut: false;
          isSigner: false;
          docs: ['SPL token account transfer authority.'];
        },
        {
          name: 'escrowPaymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer escrow payment account PDA.'];
        },
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance treasury mint account.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance authority account.'];
        },
        {
          name: 'auctioneerAuthority';
          isMut: false;
          isSigner: true;
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'ahAuctioneerPda';
          isMut: false;
          isSigner: false;
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'escrowPaymentBump';
          type: 'u8';
        },
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'executeSale';
      accounts: [
        {
          name: 'buyer';
          isMut: true;
          isSigner: false;
          docs: ['Buyer user wallet account.'];
        },
        {
          name: 'seller';
          isMut: true;
          isSigner: false;
          docs: ['Seller user wallet account.'];
        },
        {
          name: 'tokenAccount';
          isMut: true;
          isSigner: false;
          docs: ['Token account where the SPL token is stored.'];
        },
        {
          name: 'tokenMint';
          isMut: false;
          isSigner: false;
          docs: ['Token mint account for the SPL token.'];
        },
        {
          name: 'metadata';
          isMut: false;
          isSigner: false;
          docs: ['Metaplex metadata account decorating SPL mint account.'];
        },
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
          docs: ['Auction House treasury mint account.'];
        },
        {
          name: 'escrowPaymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer escrow payment account.'];
        },
        {
          name: 'sellerPaymentReceiptAccount';
          isMut: true;
          isSigner: false;
          docs: ['Seller SOL or SPL account to receive payment at.'];
        },
        {
          name: 'buyerReceiptTokenAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer SPL token account to receive purchased item at.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance authority.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'auctionHouseTreasury';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance treasury account.'];
        },
        {
          name: 'buyerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Buyer trade state PDA account encoding the buy order.'];
        },
        {
          name: 'sellerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Seller trade state PDA account encoding the sell order.'];
        },
        {
          name: 'freeTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Free seller trade state PDA account encoding a free sell order.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'ataProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'programAsSigner';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'escrowPaymentBump';
          type: 'u8';
        },
        {
          name: 'freeTradeStateBump';
          type: 'u8';
        },
        {
          name: 'programAsSignerBump';
          type: 'u8';
        },
        {
          name: 'buyerPrice';
          type: 'u64';
        },
        {
          name: 'tokenSize';
          type: 'u64';
        }
      ];
    },
    {
      name: 'executePartialSale';
      accounts: [
        {
          name: 'buyer';
          isMut: true;
          isSigner: false;
          docs: ['Buyer user wallet account.'];
        },
        {
          name: 'seller';
          isMut: true;
          isSigner: false;
          docs: ['Seller user wallet account.'];
        },
        {
          name: 'tokenAccount';
          isMut: true;
          isSigner: false;
          docs: ['Token account where the SPL token is stored.'];
        },
        {
          name: 'tokenMint';
          isMut: false;
          isSigner: false;
          docs: ['Token mint account for the SPL token.'];
        },
        {
          name: 'metadata';
          isMut: false;
          isSigner: false;
          docs: ['Metaplex metadata account decorating SPL mint account.'];
        },
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
          docs: ['Auction House treasury mint account.'];
        },
        {
          name: 'escrowPaymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer escrow payment account.'];
        },
        {
          name: 'sellerPaymentReceiptAccount';
          isMut: true;
          isSigner: false;
          docs: ['Seller SOL or SPL account to receive payment at.'];
        },
        {
          name: 'buyerReceiptTokenAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer SPL token account to receive purchased item at.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance authority.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'auctionHouseTreasury';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance treasury account.'];
        },
        {
          name: 'buyerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Buyer trade state PDA account encoding the buy order.'];
        },
        {
          name: 'sellerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Seller trade state PDA account encoding the sell order.'];
        },
        {
          name: 'freeTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Free seller trade state PDA account encoding a free sell order.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'ataProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'programAsSigner';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'escrowPaymentBump';
          type: 'u8';
        },
        {
          name: 'freeTradeStateBump';
          type: 'u8';
        },
        {
          name: 'programAsSignerBump';
          type: 'u8';
        },
        {
          name: 'buyerPrice';
          type: 'u64';
        },
        {
          name: 'tokenSize';
          type: 'u64';
        },
        {
          name: 'partialOrderSize';
          type: {
            option: 'u64';
          };
        },
        {
          name: 'partialOrderPrice';
          type: {
            option: 'u64';
          };
        }
      ];
    },
    {
      name: 'auctioneerExecuteSale';
      accounts: [
        {
          name: 'buyer';
          isMut: true;
          isSigner: false;
          docs: ['Buyer user wallet account.'];
        },
        {
          name: 'seller';
          isMut: true;
          isSigner: false;
          docs: ['Seller user wallet account.'];
        },
        {
          name: 'tokenAccount';
          isMut: true;
          isSigner: false;
          docs: ['Token account where the SPL token is stored.'];
        },
        {
          name: 'tokenMint';
          isMut: false;
          isSigner: false;
          docs: ['Token mint account for the SPL token.'];
        },
        {
          name: 'metadata';
          isMut: false;
          isSigner: false;
          docs: ['Metaplex metadata account decorating SPL mint account.'];
        },
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
          docs: ['Auction House treasury mint account.'];
        },
        {
          name: 'escrowPaymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer escrow payment account.'];
        },
        {
          name: 'sellerPaymentReceiptAccount';
          isMut: true;
          isSigner: false;
          docs: ['Seller SOL or SPL account to receive payment at.'];
        },
        {
          name: 'buyerReceiptTokenAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer SPL token account to receive purchased item at.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance authority.'];
        },
        {
          name: 'auctioneerAuthority';
          isMut: false;
          isSigner: true;
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'auctionHouseTreasury';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance treasury account.'];
        },
        {
          name: 'buyerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Buyer trade state PDA account encoding the buy order.'];
        },
        {
          name: 'sellerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Seller trade state PDA account encoding the sell order.'];
        },
        {
          name: 'freeTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Free seller trade state PDA account encoding a free sell order.'];
        },
        {
          name: 'ahAuctioneerPda';
          isMut: false;
          isSigner: false;
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'ataProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'programAsSigner';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'escrowPaymentBump';
          type: 'u8';
        },
        {
          name: 'freeTradeStateBump';
          type: 'u8';
        },
        {
          name: 'programAsSignerBump';
          type: 'u8';
        },
        {
          name: 'buyerPrice';
          type: 'u64';
        },
        {
          name: 'tokenSize';
          type: 'u64';
        }
      ];
    },
    {
      name: 'auctioneerExecutePartialSale';
      accounts: [
        {
          name: 'buyer';
          isMut: true;
          isSigner: false;
          docs: ['Buyer user wallet account.'];
        },
        {
          name: 'seller';
          isMut: true;
          isSigner: false;
          docs: ['Seller user wallet account.'];
        },
        {
          name: 'tokenAccount';
          isMut: true;
          isSigner: false;
          docs: ['Token account where the SPL token is stored.'];
        },
        {
          name: 'tokenMint';
          isMut: false;
          isSigner: false;
          docs: ['Token mint account for the SPL token.'];
        },
        {
          name: 'metadata';
          isMut: false;
          isSigner: false;
          docs: ['Metaplex metadata account decorating SPL mint account.'];
        },
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
          docs: ['Auction House treasury mint account.'];
        },
        {
          name: 'escrowPaymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer escrow payment account.'];
        },
        {
          name: 'sellerPaymentReceiptAccount';
          isMut: true;
          isSigner: false;
          docs: ['Seller SOL or SPL account to receive payment at.'];
        },
        {
          name: 'buyerReceiptTokenAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer SPL token account to receive purchased item at.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance authority.'];
        },
        {
          name: 'auctioneerAuthority';
          isMut: false;
          isSigner: true;
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'auctionHouseTreasury';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance treasury account.'];
        },
        {
          name: 'buyerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Buyer trade state PDA account encoding the buy order.'];
        },
        {
          name: 'sellerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Seller trade state PDA account encoding the sell order.'];
        },
        {
          name: 'freeTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Free seller trade state PDA account encoding a free sell order.'];
        },
        {
          name: 'ahAuctioneerPda';
          isMut: false;
          isSigner: false;
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'ataProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'programAsSigner';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'escrowPaymentBump';
          type: 'u8';
        },
        {
          name: 'freeTradeStateBump';
          type: 'u8';
        },
        {
          name: 'programAsSignerBump';
          type: 'u8';
        },
        {
          name: 'buyerPrice';
          type: 'u64';
        },
        {
          name: 'tokenSize';
          type: 'u64';
        },
        {
          name: 'partialOrderSize';
          type: {
            option: 'u64';
          };
        },
        {
          name: 'partialOrderPrice';
          type: {
            option: 'u64';
          };
        }
      ];
    },
    {
      name: 'sell';
      accounts: [
        {
          name: 'wallet';
          isMut: false;
          isSigner: false;
          docs: ['User wallet account.'];
        },
        {
          name: 'tokenAccount';
          isMut: true;
          isSigner: false;
          docs: ['SPL token account containing token for sale.'];
        },
        {
          name: 'metadata';
          isMut: false;
          isSigner: false;
          docs: ['Metaplex metadata account decorating SPL mint account.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
          docs: ['Auction House authority account.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'sellerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Seller trade state PDA account encoding the sell order.'];
        },
        {
          name: 'freeSellerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Free seller trade state PDA account encoding a free sell order.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'programAsSigner';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'tradeStateBump';
          type: 'u8';
        },
        {
          name: 'freeTradeStateBump';
          type: 'u8';
        },
        {
          name: 'programAsSignerBump';
          type: 'u8';
        },
        {
          name: 'buyerPrice';
          type: 'u64';
        },
        {
          name: 'tokenSize';
          type: 'u64';
        }
      ];
    },
    {
      name: 'auctioneerSell';
      accounts: [
        {
          name: 'wallet';
          isMut: true;
          isSigner: false;
          docs: ['User wallet account.'];
        },
        {
          name: 'tokenAccount';
          isMut: true;
          isSigner: false;
          docs: ['SPL token account containing token for sale.'];
        },
        {
          name: 'metadata';
          isMut: false;
          isSigner: false;
          docs: ['Metaplex metadata account decorating SPL mint account.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
          docs: ['Auction House authority account.'];
        },
        {
          name: 'auctioneerAuthority';
          isMut: false;
          isSigner: true;
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'sellerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Seller trade state PDA account encoding the sell order.'];
        },
        {
          name: 'freeSellerTradeState';
          isMut: true;
          isSigner: false;
          docs: ['Free seller trade state PDA account encoding a free sell order.'];
        },
        {
          name: 'ahAuctioneerPda';
          isMut: false;
          isSigner: false;
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'];
        },
        {
          name: 'programAsSigner';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'tradeStateBump';
          type: 'u8';
        },
        {
          name: 'freeTradeStateBump';
          type: 'u8';
        },
        {
          name: 'programAsSignerBump';
          type: 'u8';
        },
        {
          name: 'tokenSize';
          type: 'u64';
        }
      ];
    },
    {
      name: 'withdraw';
      docs: ['Withdraw `amount` from the escrow payment account for your specific wallet.'];
      accounts: [
        {
          name: 'wallet';
          isMut: false;
          isSigner: false;
          docs: ['User wallet account.'];
        },
        {
          name: 'receiptAccount';
          isMut: true;
          isSigner: false;
          docs: [
            'SPL token account or native SOL account to transfer funds to. If the account is a native SOL account, this is the same as the wallet address.'
          ];
        },
        {
          name: 'escrowPaymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer escrow payment account PDA.'];
        },
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance treasury mint account.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance authority account.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'ataProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'escrowPaymentBump';
          type: 'u8';
        },
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'auctioneerWithdraw';
      docs: ['Withdraw `amount` from the escrow payment account for your specific wallet.'];
      accounts: [
        {
          name: 'wallet';
          isMut: false;
          isSigner: false;
          docs: ['User wallet account.'];
        },
        {
          name: 'receiptAccount';
          isMut: true;
          isSigner: false;
          docs: [
            'SPL token account or native SOL account to transfer funds to. If the account is a native SOL account, this is the same as the wallet address.'
          ];
        },
        {
          name: 'escrowPaymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer escrow payment account PDA.'];
        },
        {
          name: 'treasuryMint';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance treasury mint account.'];
        },
        {
          name: 'authority';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance authority account.'];
        },
        {
          name: 'auctioneerAuthority';
          isMut: false;
          isSigner: true;
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'auctionHouseFeeAccount';
          isMut: true;
          isSigner: false;
          docs: ['Auction House instance fee account.'];
        },
        {
          name: 'ahAuctioneerPda';
          isMut: false;
          isSigner: false;
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'];
        },
        {
          name: 'tokenProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'ataProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'escrowPaymentBump';
          type: 'u8';
        },
        {
          name: 'amount';
          type: 'u64';
        }
      ];
    },
    {
      name: 'closeEscrowAccount';
      docs: ['Close the escrow account of the user.'];
      accounts: [
        {
          name: 'wallet';
          isMut: false;
          isSigner: true;
          docs: ['User wallet account.'];
        },
        {
          name: 'escrowPaymentAccount';
          isMut: true;
          isSigner: false;
          docs: ['Buyer escrow payment account PDA.'];
        },
        {
          name: 'auctionHouse';
          isMut: false;
          isSigner: false;
          docs: ['Auction House instance PDA account.'];
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'escrowPaymentBump';
          type: 'u8';
        }
      ];
    },
    {
      name: 'delegateAuctioneer';
      accounts: [
        {
          name: 'auctionHouse';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'auctioneerAuthority';
          isMut: false;
          isSigner: false;
          docs: ['The auctioneer authority - the program PDA running this auction.'];
        },
        {
          name: 'ahAuctioneerPda';
          isMut: true;
          isSigner: false;
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'];
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'scopes';
          type: {
            vec: {
              defined: 'AuthorityScope';
            };
          };
        }
      ];
    },
    {
      name: 'updateAuctioneer';
      accounts: [
        {
          name: 'auctionHouse';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'authority';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'auctioneerAuthority';
          isMut: false;
          isSigner: false;
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'];
        },
        {
          name: 'ahAuctioneerPda';
          isMut: true;
          isSigner: false;
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'];
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'scopes';
          type: {
            vec: {
              defined: 'AuthorityScope';
            };
          };
        }
      ];
    },
    {
      name: 'printListingReceipt';
      docs: ['Create a listing receipt by creating a `listing_receipt` account.'];
      accounts: [
        {
          name: 'receipt';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'bookkeeper';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'instruction';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'receiptBump';
          type: 'u8';
        }
      ];
    },
    {
      name: 'cancelListingReceipt';
      docs: ['Cancel an active listing receipt by setting the `canceled_at` field to the current time.'];
      accounts: [
        {
          name: 'receipt';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'instruction';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'printBidReceipt';
      docs: ['Create a bid receipt by creating a `bid_receipt` account.'];
      accounts: [
        {
          name: 'receipt';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'bookkeeper';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'instruction';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'receiptBump';
          type: 'u8';
        }
      ];
    },
    {
      name: 'cancelBidReceipt';
      docs: ['Cancel an active bid receipt by setting the `canceled_at` field to the current time.'];
      accounts: [
        {
          name: 'receipt';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'instruction';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [];
    },
    {
      name: 'printPurchaseReceipt';
      docs: ['Create a purchase receipt by creating a `purchase_receipt` account.'];
      accounts: [
        {
          name: 'purchaseReceipt';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'listingReceipt';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'bidReceipt';
          isMut: true;
          isSigner: false;
        },
        {
          name: 'bookkeeper';
          isMut: true;
          isSigner: true;
        },
        {
          name: 'systemProgram';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'rent';
          isMut: false;
          isSigner: false;
        },
        {
          name: 'instruction';
          isMut: false;
          isSigner: false;
        }
      ];
      args: [
        {
          name: 'purchaseReceiptBump';
          type: 'u8';
        }
      ];
    }
  ];
  accounts: [
    {
      name: 'bidReceipt';
      docs: ['Receipt for a bid transaction.'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'tradeState';
            type: 'publicKey';
          },
          {
            name: 'bookkeeper';
            type: 'publicKey';
          },
          {
            name: 'auctionHouse';
            type: 'publicKey';
          },
          {
            name: 'buyer';
            type: 'publicKey';
          },
          {
            name: 'metadata';
            type: 'publicKey';
          },
          {
            name: 'tokenAccount';
            type: {
              option: 'publicKey';
            };
          },
          {
            name: 'purchaseReceipt';
            type: {
              option: 'publicKey';
            };
          },
          {
            name: 'price';
            type: 'u64';
          },
          {
            name: 'tokenSize';
            type: 'u64';
          },
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'tradeStateBump';
            type: 'u8';
          },
          {
            name: 'createdAt';
            type: 'i64';
          },
          {
            name: 'canceledAt';
            type: {
              option: 'i64';
            };
          }
        ];
      };
    },
    {
      name: 'listingReceipt';
      docs: ['Receipt for a listing transaction.'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'tradeState';
            type: 'publicKey';
          },
          {
            name: 'bookkeeper';
            type: 'publicKey';
          },
          {
            name: 'auctionHouse';
            type: 'publicKey';
          },
          {
            name: 'seller';
            type: 'publicKey';
          },
          {
            name: 'metadata';
            type: 'publicKey';
          },
          {
            name: 'purchaseReceipt';
            type: {
              option: 'publicKey';
            };
          },
          {
            name: 'price';
            type: 'u64';
          },
          {
            name: 'tokenSize';
            type: 'u64';
          },
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'tradeStateBump';
            type: 'u8';
          },
          {
            name: 'createdAt';
            type: 'i64';
          },
          {
            name: 'canceledAt';
            type: {
              option: 'i64';
            };
          }
        ];
      };
    },
    {
      name: 'purchaseReceipt';
      docs: ['Receipt for a purchase transaction.'];
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'bookkeeper';
            type: 'publicKey';
          },
          {
            name: 'buyer';
            type: 'publicKey';
          },
          {
            name: 'seller';
            type: 'publicKey';
          },
          {
            name: 'auctionHouse';
            type: 'publicKey';
          },
          {
            name: 'metadata';
            type: 'publicKey';
          },
          {
            name: 'tokenSize';
            type: 'u64';
          },
          {
            name: 'price';
            type: 'u64';
          },
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'createdAt';
            type: 'i64';
          }
        ];
      };
    },
    {
      name: 'auctionHouse';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'auctionHouseFeeAccount';
            type: 'publicKey';
          },
          {
            name: 'auctionHouseTreasury';
            type: 'publicKey';
          },
          {
            name: 'treasuryWithdrawalDestination';
            type: 'publicKey';
          },
          {
            name: 'feeWithdrawalDestination';
            type: 'publicKey';
          },
          {
            name: 'treasuryMint';
            type: 'publicKey';
          },
          {
            name: 'authority';
            type: 'publicKey';
          },
          {
            name: 'creator';
            type: 'publicKey';
          },
          {
            name: 'bump';
            type: 'u8';
          },
          {
            name: 'treasuryBump';
            type: 'u8';
          },
          {
            name: 'feePayerBump';
            type: 'u8';
          },
          {
            name: 'sellerFeeBasisPoints';
            type: 'u16';
          },
          {
            name: 'requiresSignOff';
            type: 'bool';
          },
          {
            name: 'canChangeSalePrice';
            type: 'bool';
          },
          {
            name: 'escrowPaymentBump';
            type: 'u8';
          },
          {
            name: 'hasAuctioneer';
            type: 'bool';
          },
          {
            name: 'auctioneerAddress';
            type: 'publicKey';
          },
          {
            name: 'scopes';
            type: {
              array: ['bool', 7];
            };
          }
        ];
      };
    },
    {
      name: 'auctioneer';
      type: {
        kind: 'struct';
        fields: [
          {
            name: 'auctioneerAuthority';
            type: 'publicKey';
          },
          {
            name: 'auctionHouse';
            type: 'publicKey';
          },
          {
            name: 'bump';
            type: 'u8';
          }
        ];
      };
    }
  ];
  types: [
    {
      name: 'AuthorityScope';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'Deposit';
          },
          {
            name: 'Buy';
          },
          {
            name: 'PublicBuy';
          },
          {
            name: 'ExecuteSale';
          },
          {
            name: 'Sell';
          },
          {
            name: 'Cancel';
          },
          {
            name: 'Withdraw';
          }
        ];
      };
    },
    {
      name: 'BidType';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'PublicSale';
          },
          {
            name: 'PrivateSale';
          },
          {
            name: 'AuctioneerPublicSale';
          },
          {
            name: 'AuctioneerPrivateSale';
          }
        ];
      };
    },
    {
      name: 'ListingType';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'Sell';
          },
          {
            name: 'AuctioneerSell';
          }
        ];
      };
    },
    {
      name: 'PurchaseType';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'ExecuteSale';
          },
          {
            name: 'AuctioneerExecuteSale';
          }
        ];
      };
    },
    {
      name: 'CancelType';
      type: {
        kind: 'enum';
        variants: [
          {
            name: 'Cancel';
          },
          {
            name: 'AuctioneerCancel';
          }
        ];
      };
    }
  ];
  errors: [
    {
      code: 6000;
      name: 'PublicKeyMismatch';
      msg: 'PublicKeyMismatch';
    },
    {
      code: 6001;
      name: 'InvalidMintAuthority';
      msg: 'InvalidMintAuthority';
    },
    {
      code: 6002;
      name: 'UninitializedAccount';
      msg: 'UninitializedAccount';
    },
    {
      code: 6003;
      name: 'IncorrectOwner';
      msg: 'IncorrectOwner';
    },
    {
      code: 6004;
      name: 'PublicKeysShouldBeUnique';
      msg: 'PublicKeysShouldBeUnique';
    },
    {
      code: 6005;
      name: 'StatementFalse';
      msg: 'StatementFalse';
    },
    {
      code: 6006;
      name: 'NotRentExempt';
      msg: 'NotRentExempt';
    },
    {
      code: 6007;
      name: 'NumericalOverflow';
      msg: 'NumericalOverflow';
    },
    {
      code: 6008;
      name: 'ExpectedSolAccount';
      msg: 'Expected a sol account but got an spl token account instead';
    },
    {
      code: 6009;
      name: 'CannotExchangeSOLForSol';
      msg: 'Cannot exchange sol for sol';
    },
    {
      code: 6010;
      name: 'SOLWalletMustSign';
      msg: 'If paying with sol, sol wallet must be signer';
    },
    {
      code: 6011;
      name: 'CannotTakeThisActionWithoutAuctionHouseSignOff';
      msg: 'Cannot take this action without auction house signing too';
    },
    {
      code: 6012;
      name: 'NoPayerPresent';
      msg: 'No payer present on this txn';
    },
    {
      code: 6013;
      name: 'DerivedKeyInvalid';
      msg: 'Derived key invalid';
    },
    {
      code: 6014;
      name: 'MetadataDoesntExist';
      msg: "Metadata doesn't exist";
    },
    {
      code: 6015;
      name: 'InvalidTokenAmount';
      msg: 'Invalid token amount';
    },
    {
      code: 6016;
      name: 'BothPartiesNeedToAgreeToSale';
      msg: 'Both parties need to agree to this sale';
    },
    {
      code: 6017;
      name: 'CannotMatchFreeSalesWithoutAuctionHouseOrSellerSignoff';
      msg: 'Cannot match free sales unless the auction house or seller signs off';
    },
    {
      code: 6018;
      name: 'SaleRequiresSigner';
      msg: 'This sale requires a signer';
    },
    {
      code: 6019;
      name: 'OldSellerNotInitialized';
      msg: 'Old seller not initialized';
    },
    {
      code: 6020;
      name: 'SellerATACannotHaveDelegate';
      msg: 'Seller ata cannot have a delegate set';
    },
    {
      code: 6021;
      name: 'BuyerATACannotHaveDelegate';
      msg: 'Buyer ata cannot have a delegate set';
    },
    {
      code: 6022;
      name: 'NoValidSignerPresent';
      msg: 'No valid signer present';
    },
    {
      code: 6023;
      name: 'InvalidBasisPoints';
      msg: 'BP must be less than or equal to 10000';
    },
    {
      code: 6024;
      name: 'TradeStateDoesntExist';
      msg: 'The trade state account does not exist';
    },
    {
      code: 6025;
      name: 'TradeStateIsNotEmpty';
      msg: 'The trade state is not empty';
    },
    {
      code: 6026;
      name: 'ReceiptIsEmpty';
      msg: 'The receipt is empty';
    },
    {
      code: 6027;
      name: 'InstructionMismatch';
      msg: 'The instruction does not match';
    },
    {
      code: 6028;
      name: 'InvalidAuctioneer';
      msg: 'Invalid Auctioneer for this Auction House instance.';
    },
    {
      code: 6029;
      name: 'MissingAuctioneerScope';
      msg: 'The Auctioneer does not have the correct scope for this action.';
    },
    {
      code: 6030;
      name: 'MustUseAuctioneerHandler';
      msg: 'Must use auctioneer handler.';
    },
    {
      code: 6031;
      name: 'NoAuctioneerProgramSet';
      msg: 'No Auctioneer program set.';
    },
    {
      code: 6032;
      name: 'TooManyScopes';
      msg: 'Too many scopes.';
    },
    {
      code: 6033;
      name: 'AuctionHouseNotDelegated';
      msg: 'Auction House not delegated.';
    },
    {
      code: 6034;
      name: 'BumpSeedNotInHashMap';
      msg: 'Bump seed not in hash map.';
    },
    {
      code: 6035;
      name: 'EscrowUnderRentExemption';
      msg: 'The instruction would drain the escrow below rent exemption threshold';
    },
    {
      code: 6036;
      name: 'InvalidSeedsOrAuctionHouseNotDelegated';
      msg: 'Invalid seeds or Auction House not delegated';
    },
    {
      code: 6037;
      name: 'BuyerTradeStateNotValid';
      msg: 'The buyer trade state was unable to be initialized.';
    },
    {
      code: 6038;
      name: 'MissingElementForPartialOrder';
      msg: 'Partial order size and price must both be provided in a partial buy.';
    },
    {
      code: 6039;
      name: 'NotEnoughTokensAvailableForPurchase';
      msg: 'Amount of tokens available for purchase is less than the partial order amount.';
    },
    {
      code: 6040;
      name: 'PartialPriceMismatch';
      msg: 'Calculated partial price does not not partial price that was provided.';
    },
    {
      code: 6041;
      name: 'AuctionHouseAlreadyDelegated';
      msg: 'Auction House already delegated.';
    },
    {
      code: 6042;
      name: 'AuctioneerAuthorityMismatch';
      msg: 'Auctioneer Authority Mismatch';
    },
    {
      code: 6043;
      name: 'InsufficientFunds';
      msg: 'Insufficient funds in escrow account to purchase.';
    }
  ];
};

export const IDL: AuctionHouseIDL = {
  version: '1.3.1',
  name: 'auction_house',
  instructions: [
    {
      name: 'withdrawFromFee',
      docs: ['Withdraw `amount` from the Auction House Fee Account to a provided destination account.'],
      accounts: [
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
          docs: ['Authority key for the Auction House.'],
        },
        {
          name: 'feeWithdrawalDestination',
          isMut: true,
          isSigner: false,
          docs: ['Account that pays for fees if the marketplace executes sales.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'auctionHouse',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'withdrawFromTreasury',
      docs: ['Withdraw `amount` from the Auction House Treasury Account to a provided destination account.'],
      accounts: [
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
          docs: ['Treasury mint account, either native SOL mint or a SPL token mint.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
          docs: ['Authority key for the Auction House.'],
        },
        {
          name: 'treasuryWithdrawalDestination',
          isMut: true,
          isSigner: false,
          docs: [
            'SOL or SPL token account to receive Auction House fees. If treasury mint is native this will be the same as the `treasury_withdrawl_destination_owner`.',
          ],
        },
        {
          name: 'auctionHouseTreasury',
          isMut: true,
          isSigner: false,
          docs: ['Auction House treasury PDA account.'],
        },
        {
          name: 'auctionHouse',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'updateAuctionHouse',
      docs: ['Update Auction House values such as seller fee basis points, update authority, treasury account, etc.'],
      accounts: [
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
          docs: ['Treasury mint account, either native SOL mint or a SPL token mint.'],
        },
        {
          name: 'payer',
          isMut: false,
          isSigner: true,
          docs: ['Key paying SOL fees for setting up the Auction House.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: true,
          docs: ['Authority key for the Auction House.'],
        },
        {
          name: 'newAuthority',
          isMut: false,
          isSigner: false,
          docs: ['New authority key for the Auction House.'],
        },
        {
          name: 'feeWithdrawalDestination',
          isMut: true,
          isSigner: false,
          docs: ['Account that pays for fees if the marketplace executes sales.'],
        },
        {
          name: 'treasuryWithdrawalDestination',
          isMut: true,
          isSigner: false,
          docs: [
            'SOL or SPL token account to receive Auction House fees. If treasury mint is native this will be the same as the `treasury_withdrawl_destination_owner`.',
          ],
        },
        {
          name: 'treasuryWithdrawalDestinationOwner',
          isMut: false,
          isSigner: false,
          docs: ['Owner of the `treasury_withdrawal_destination` account or the same address if the `treasury_mint` is native.'],
        },
        {
          name: 'auctionHouse',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'ataProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'sellerFeeBasisPoints',
          type: {
            option: 'u16',
          },
        },
        {
          name: 'requiresSignOff',
          type: {
            option: 'bool',
          },
        },
        {
          name: 'canChangeSalePrice',
          type: {
            option: 'bool',
          },
        },
      ],
    },
    {
      name: 'createAuctionHouse',
      docs: ['Create a new Auction House instance.'],
      accounts: [
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
          docs: ['Treasury mint account, either native SOL mint or a SPL token mint.'],
        },
        {
          name: 'payer',
          isMut: true,
          isSigner: true,
          docs: ['Key paying SOL fees for setting up the Auction House.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'feeWithdrawalDestination',
          isMut: true,
          isSigner: false,
          docs: ['Account that pays for fees if the marketplace executes sales.'],
        },
        {
          name: 'treasuryWithdrawalDestination',
          isMut: true,
          isSigner: false,
          docs: [
            'SOL or SPL token account to receive Auction House fees. If treasury mint is native this will be the same as the `treasury_withdrawl_destination_owner`.',
          ],
        },
        {
          name: 'treasuryWithdrawalDestinationOwner',
          isMut: false,
          isSigner: false,
          docs: ['Owner of the `treasury_withdrawal_destination` account or the same address if the `treasury_mint` is native.'],
        },
        {
          name: 'auctionHouse',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'auctionHouseTreasury',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance treasury PDA account.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'ataProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'bump',
          type: 'u8',
        },
        {
          name: 'feePayerBump',
          type: 'u8',
        },
        {
          name: 'treasuryBump',
          type: 'u8',
        },
        {
          name: 'sellerFeeBasisPoints',
          type: 'u16',
        },
        {
          name: 'requiresSignOff',
          type: 'bool',
        },
        {
          name: 'canChangeSalePrice',
          type: 'bool',
        },
      ],
    },
    {
      name: 'buy',
      docs: [
        'Create a private buy bid by creating a `buyer_trade_state` account and an `escrow_payment` account and funding the escrow with the necessary SOL or SPL token amount.',
      ],
      accounts: [
        {
          name: 'wallet',
          isMut: false,
          isSigner: true,
          docs: ['User wallet account.'],
        },
        {
          name: 'paymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['User SOL or SPL account to transfer funds from.'],
        },
        {
          name: 'transferAuthority',
          isMut: false,
          isSigner: false,
          docs: ['SPL token account transfer authority.'],
        },
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance treasury mint account.'],
        },
        {
          name: 'tokenAccount',
          isMut: false,
          isSigner: false,
          docs: ['SPL token account.'],
        },
        {
          name: 'metadata',
          isMut: false,
          isSigner: false,
          docs: ['SPL token account metadata.'],
        },
        {
          name: 'escrowPaymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer escrow payment account PDA.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance authority account.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'buyerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Buyer trade state PDA.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'tradeStateBump',
          type: 'u8',
        },
        {
          name: 'escrowPaymentBump',
          type: 'u8',
        },
        {
          name: 'buyerPrice',
          type: 'u64',
        },
        {
          name: 'tokenSize',
          type: 'u64',
        },
      ],
    },
    {
      name: 'auctioneerBuy',
      accounts: [
        {
          name: 'wallet',
          isMut: false,
          isSigner: true,
          docs: ['User wallet account.'],
        },
        {
          name: 'paymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['User SOL or SPL account to transfer funds from.'],
        },
        {
          name: 'transferAuthority',
          isMut: false,
          isSigner: false,
          docs: ['SPL token account transfer authority.'],
        },
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance treasury mint account.'],
        },
        {
          name: 'tokenAccount',
          isMut: false,
          isSigner: false,
          docs: ['SPL token account.'],
        },
        {
          name: 'metadata',
          isMut: false,
          isSigner: false,
          docs: ['SPL token account metadata.'],
        },
        {
          name: 'escrowPaymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer escrow payment account PDA.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'auctioneerAuthority',
          isMut: false,
          isSigner: true,
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'buyerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Buyer trade state PDA.'],
        },
        {
          name: 'ahAuctioneerPda',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'tradeStateBump',
          type: 'u8',
        },
        {
          name: 'escrowPaymentBump',
          type: 'u8',
        },
        {
          name: 'buyerPrice',
          type: 'u64',
        },
        {
          name: 'tokenSize',
          type: 'u64',
        },
      ],
    },
    {
      name: 'publicBuy',
      docs: [
        'Create a public buy bid by creating a `public_buyer_trade_state` account and an `escrow_payment` account and funding the escrow with the necessary SOL or SPL token amount.',
      ],
      accounts: [
        {
          name: 'wallet',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'paymentAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'transferAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'metadata',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'escrowPaymentAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'buyerTradeState',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'tradeStateBump',
          type: 'u8',
        },
        {
          name: 'escrowPaymentBump',
          type: 'u8',
        },
        {
          name: 'buyerPrice',
          type: 'u64',
        },
        {
          name: 'tokenSize',
          type: 'u64',
        },
      ],
    },
    {
      name: 'auctioneerPublicBuy',
      docs: [
        'Create a public buy bid by creating a `public_buyer_trade_state` account and an `escrow_payment` account and funding the escrow with the necessary SOL or SPL token amount.',
      ],
      accounts: [
        {
          name: 'wallet',
          isMut: false,
          isSigner: true,
        },
        {
          name: 'paymentAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'transferAuthority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenAccount',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'metadata',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'escrowPaymentAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'auctioneerAuthority',
          isMut: false,
          isSigner: true,
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'buyerTradeState',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'ahAuctioneerPda',
          isMut: false,
          isSigner: false,
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'tradeStateBump',
          type: 'u8',
        },
        {
          name: 'escrowPaymentBump',
          type: 'u8',
        },
        {
          name: 'buyerPrice',
          type: 'u64',
        },
        {
          name: 'tokenSize',
          type: 'u64',
        },
      ],
    },
    {
      name: 'cancel',
      docs: [
        'Cancel a bid or ask by revoking the token delegate, transferring all lamports from the trade state account to the fee payer, and setting the trade state account data to zero so it can be garbage collected.',
      ],
      accounts: [
        {
          name: 'wallet',
          isMut: true,
          isSigner: false,
          docs: ['User wallet account.'],
        },
        {
          name: 'tokenAccount',
          isMut: true,
          isSigner: false,
          docs: ['SPL token account containing the token of the sale to be canceled.'],
        },
        {
          name: 'tokenMint',
          isMut: false,
          isSigner: false,
          docs: ['Token mint account of SPL token.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance authority account.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'tradeState',
          isMut: true,
          isSigner: false,
          docs: ['Trade state PDA account representing the bid or ask to be canceled.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'buyerPrice',
          type: 'u64',
        },
        {
          name: 'tokenSize',
          type: 'u64',
        },
      ],
    },
    {
      name: 'auctioneerCancel',
      docs: ['Cancel, but with an auctioneer'],
      accounts: [
        {
          name: 'wallet',
          isMut: true,
          isSigner: false,
          docs: ['User wallet account.'],
        },
        {
          name: 'tokenAccount',
          isMut: true,
          isSigner: false,
          docs: ['SPL token account containing the token of the sale to be canceled.'],
        },
        {
          name: 'tokenMint',
          isMut: false,
          isSigner: false,
          docs: ['Token mint account of SPL token.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance authority account.'],
        },
        {
          name: 'auctioneerAuthority',
          isMut: false,
          isSigner: true,
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'tradeState',
          isMut: true,
          isSigner: false,
          docs: ['Trade state PDA account representing the bid or ask to be canceled.'],
        },
        {
          name: 'ahAuctioneerPda',
          isMut: false,
          isSigner: false,
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'buyerPrice',
          type: 'u64',
        },
        {
          name: 'tokenSize',
          type: 'u64',
        },
      ],
    },
    {
      name: 'deposit',
      docs: ['Deposit `amount` into the escrow payment account for your specific wallet.'],
      accounts: [
        {
          name: 'wallet',
          isMut: false,
          isSigner: true,
          docs: ['User wallet account.'],
        },
        {
          name: 'paymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['User SOL or SPL account to transfer funds from.'],
        },
        {
          name: 'transferAuthority',
          isMut: false,
          isSigner: false,
          docs: ['SPL token account transfer authority.'],
        },
        {
          name: 'escrowPaymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer escrow payment account PDA.'],
        },
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance treasury mint account.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance authority account.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'escrowPaymentBump',
          type: 'u8',
        },
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'auctioneerDeposit',
      docs: ['Deposit `amount` into the escrow payment account for your specific wallet.'],
      accounts: [
        {
          name: 'wallet',
          isMut: false,
          isSigner: true,
          docs: ['User wallet account.'],
        },
        {
          name: 'paymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['User SOL or SPL account to transfer funds from.'],
        },
        {
          name: 'transferAuthority',
          isMut: false,
          isSigner: false,
          docs: ['SPL token account transfer authority.'],
        },
        {
          name: 'escrowPaymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer escrow payment account PDA.'],
        },
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance treasury mint account.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance authority account.'],
        },
        {
          name: 'auctioneerAuthority',
          isMut: false,
          isSigner: true,
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'ahAuctioneerPda',
          isMut: false,
          isSigner: false,
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'escrowPaymentBump',
          type: 'u8',
        },
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'executeSale',
      accounts: [
        {
          name: 'buyer',
          isMut: true,
          isSigner: false,
          docs: ['Buyer user wallet account.'],
        },
        {
          name: 'seller',
          isMut: true,
          isSigner: false,
          docs: ['Seller user wallet account.'],
        },
        {
          name: 'tokenAccount',
          isMut: true,
          isSigner: false,
          docs: ['Token account where the SPL token is stored.'],
        },
        {
          name: 'tokenMint',
          isMut: false,
          isSigner: false,
          docs: ['Token mint account for the SPL token.'],
        },
        {
          name: 'metadata',
          isMut: false,
          isSigner: false,
          docs: ['Metaplex metadata account decorating SPL mint account.'],
        },
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
          docs: ['Auction House treasury mint account.'],
        },
        {
          name: 'escrowPaymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer escrow payment account.'],
        },
        {
          name: 'sellerPaymentReceiptAccount',
          isMut: true,
          isSigner: false,
          docs: ['Seller SOL or SPL account to receive payment at.'],
        },
        {
          name: 'buyerReceiptTokenAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer SPL token account to receive purchased item at.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance authority.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'auctionHouseTreasury',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance treasury account.'],
        },
        {
          name: 'buyerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Buyer trade state PDA account encoding the buy order.'],
        },
        {
          name: 'sellerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Seller trade state PDA account encoding the sell order.'],
        },
        {
          name: 'freeTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Free seller trade state PDA account encoding a free sell order.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'ataProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'programAsSigner',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'escrowPaymentBump',
          type: 'u8',
        },
        {
          name: 'freeTradeStateBump',
          type: 'u8',
        },
        {
          name: 'programAsSignerBump',
          type: 'u8',
        },
        {
          name: 'buyerPrice',
          type: 'u64',
        },
        {
          name: 'tokenSize',
          type: 'u64',
        },
      ],
    },
    {
      name: 'executePartialSale',
      accounts: [
        {
          name: 'buyer',
          isMut: true,
          isSigner: false,
          docs: ['Buyer user wallet account.'],
        },
        {
          name: 'seller',
          isMut: true,
          isSigner: false,
          docs: ['Seller user wallet account.'],
        },
        {
          name: 'tokenAccount',
          isMut: true,
          isSigner: false,
          docs: ['Token account where the SPL token is stored.'],
        },
        {
          name: 'tokenMint',
          isMut: false,
          isSigner: false,
          docs: ['Token mint account for the SPL token.'],
        },
        {
          name: 'metadata',
          isMut: false,
          isSigner: false,
          docs: ['Metaplex metadata account decorating SPL mint account.'],
        },
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
          docs: ['Auction House treasury mint account.'],
        },
        {
          name: 'escrowPaymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer escrow payment account.'],
        },
        {
          name: 'sellerPaymentReceiptAccount',
          isMut: true,
          isSigner: false,
          docs: ['Seller SOL or SPL account to receive payment at.'],
        },
        {
          name: 'buyerReceiptTokenAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer SPL token account to receive purchased item at.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance authority.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'auctionHouseTreasury',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance treasury account.'],
        },
        {
          name: 'buyerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Buyer trade state PDA account encoding the buy order.'],
        },
        {
          name: 'sellerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Seller trade state PDA account encoding the sell order.'],
        },
        {
          name: 'freeTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Free seller trade state PDA account encoding a free sell order.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'ataProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'programAsSigner',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'escrowPaymentBump',
          type: 'u8',
        },
        {
          name: 'freeTradeStateBump',
          type: 'u8',
        },
        {
          name: 'programAsSignerBump',
          type: 'u8',
        },
        {
          name: 'buyerPrice',
          type: 'u64',
        },
        {
          name: 'tokenSize',
          type: 'u64',
        },
        {
          name: 'partialOrderSize',
          type: {
            option: 'u64',
          },
        },
        {
          name: 'partialOrderPrice',
          type: {
            option: 'u64',
          },
        },
      ],
    },
    {
      name: 'auctioneerExecuteSale',
      accounts: [
        {
          name: 'buyer',
          isMut: true,
          isSigner: false,
          docs: ['Buyer user wallet account.'],
        },
        {
          name: 'seller',
          isMut: true,
          isSigner: false,
          docs: ['Seller user wallet account.'],
        },
        {
          name: 'tokenAccount',
          isMut: true,
          isSigner: false,
          docs: ['Token account where the SPL token is stored.'],
        },
        {
          name: 'tokenMint',
          isMut: false,
          isSigner: false,
          docs: ['Token mint account for the SPL token.'],
        },
        {
          name: 'metadata',
          isMut: false,
          isSigner: false,
          docs: ['Metaplex metadata account decorating SPL mint account.'],
        },
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
          docs: ['Auction House treasury mint account.'],
        },
        {
          name: 'escrowPaymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer escrow payment account.'],
        },
        {
          name: 'sellerPaymentReceiptAccount',
          isMut: true,
          isSigner: false,
          docs: ['Seller SOL or SPL account to receive payment at.'],
        },
        {
          name: 'buyerReceiptTokenAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer SPL token account to receive purchased item at.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance authority.'],
        },
        {
          name: 'auctioneerAuthority',
          isMut: false,
          isSigner: true,
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'auctionHouseTreasury',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance treasury account.'],
        },
        {
          name: 'buyerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Buyer trade state PDA account encoding the buy order.'],
        },
        {
          name: 'sellerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Seller trade state PDA account encoding the sell order.'],
        },
        {
          name: 'freeTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Free seller trade state PDA account encoding a free sell order.'],
        },
        {
          name: 'ahAuctioneerPda',
          isMut: false,
          isSigner: false,
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'ataProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'programAsSigner',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'escrowPaymentBump',
          type: 'u8',
        },
        {
          name: 'freeTradeStateBump',
          type: 'u8',
        },
        {
          name: 'programAsSignerBump',
          type: 'u8',
        },
        {
          name: 'buyerPrice',
          type: 'u64',
        },
        {
          name: 'tokenSize',
          type: 'u64',
        },
      ],
    },
    {
      name: 'auctioneerExecutePartialSale',
      accounts: [
        {
          name: 'buyer',
          isMut: true,
          isSigner: false,
          docs: ['Buyer user wallet account.'],
        },
        {
          name: 'seller',
          isMut: true,
          isSigner: false,
          docs: ['Seller user wallet account.'],
        },
        {
          name: 'tokenAccount',
          isMut: true,
          isSigner: false,
          docs: ['Token account where the SPL token is stored.'],
        },
        {
          name: 'tokenMint',
          isMut: false,
          isSigner: false,
          docs: ['Token mint account for the SPL token.'],
        },
        {
          name: 'metadata',
          isMut: false,
          isSigner: false,
          docs: ['Metaplex metadata account decorating SPL mint account.'],
        },
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
          docs: ['Auction House treasury mint account.'],
        },
        {
          name: 'escrowPaymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer escrow payment account.'],
        },
        {
          name: 'sellerPaymentReceiptAccount',
          isMut: true,
          isSigner: false,
          docs: ['Seller SOL or SPL account to receive payment at.'],
        },
        {
          name: 'buyerReceiptTokenAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer SPL token account to receive purchased item at.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance authority.'],
        },
        {
          name: 'auctioneerAuthority',
          isMut: false,
          isSigner: true,
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'auctionHouseTreasury',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance treasury account.'],
        },
        {
          name: 'buyerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Buyer trade state PDA account encoding the buy order.'],
        },
        {
          name: 'sellerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Seller trade state PDA account encoding the sell order.'],
        },
        {
          name: 'freeTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Free seller trade state PDA account encoding a free sell order.'],
        },
        {
          name: 'ahAuctioneerPda',
          isMut: false,
          isSigner: false,
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'ataProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'programAsSigner',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'escrowPaymentBump',
          type: 'u8',
        },
        {
          name: 'freeTradeStateBump',
          type: 'u8',
        },
        {
          name: 'programAsSignerBump',
          type: 'u8',
        },
        {
          name: 'buyerPrice',
          type: 'u64',
        },
        {
          name: 'tokenSize',
          type: 'u64',
        },
        {
          name: 'partialOrderSize',
          type: {
            option: 'u64',
          },
        },
        {
          name: 'partialOrderPrice',
          type: {
            option: 'u64',
          },
        },
      ],
    },
    {
      name: 'sell',
      accounts: [
        {
          name: 'wallet',
          isMut: false,
          isSigner: false,
          docs: ['User wallet account.'],
        },
        {
          name: 'tokenAccount',
          isMut: true,
          isSigner: false,
          docs: ['SPL token account containing token for sale.'],
        },
        {
          name: 'metadata',
          isMut: false,
          isSigner: false,
          docs: ['Metaplex metadata account decorating SPL mint account.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
          docs: ['Auction House authority account.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'sellerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Seller trade state PDA account encoding the sell order.'],
        },
        {
          name: 'freeSellerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Free seller trade state PDA account encoding a free sell order.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'programAsSigner',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'tradeStateBump',
          type: 'u8',
        },
        {
          name: 'freeTradeStateBump',
          type: 'u8',
        },
        {
          name: 'programAsSignerBump',
          type: 'u8',
        },
        {
          name: 'buyerPrice',
          type: 'u64',
        },
        {
          name: 'tokenSize',
          type: 'u64',
        },
      ],
    },
    {
      name: 'auctioneerSell',
      accounts: [
        {
          name: 'wallet',
          isMut: true,
          isSigner: false,
          docs: ['User wallet account.'],
        },
        {
          name: 'tokenAccount',
          isMut: true,
          isSigner: false,
          docs: ['SPL token account containing token for sale.'],
        },
        {
          name: 'metadata',
          isMut: false,
          isSigner: false,
          docs: ['Metaplex metadata account decorating SPL mint account.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
          docs: ['Auction House authority account.'],
        },
        {
          name: 'auctioneerAuthority',
          isMut: false,
          isSigner: true,
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'sellerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Seller trade state PDA account encoding the sell order.'],
        },
        {
          name: 'freeSellerTradeState',
          isMut: true,
          isSigner: false,
          docs: ['Free seller trade state PDA account encoding a free sell order.'],
        },
        {
          name: 'ahAuctioneerPda',
          isMut: false,
          isSigner: false,
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'],
        },
        {
          name: 'programAsSigner',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'tradeStateBump',
          type: 'u8',
        },
        {
          name: 'freeTradeStateBump',
          type: 'u8',
        },
        {
          name: 'programAsSignerBump',
          type: 'u8',
        },
        {
          name: 'tokenSize',
          type: 'u64',
        },
      ],
    },
    {
      name: 'withdraw',
      docs: ['Withdraw `amount` from the escrow payment account for your specific wallet.'],
      accounts: [
        {
          name: 'wallet',
          isMut: false,
          isSigner: false,
          docs: ['User wallet account.'],
        },
        {
          name: 'receiptAccount',
          isMut: true,
          isSigner: false,
          docs: [
            'SPL token account or native SOL account to transfer funds to. If the account is a native SOL account, this is the same as the wallet address.',
          ],
        },
        {
          name: 'escrowPaymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer escrow payment account PDA.'],
        },
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance treasury mint account.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance authority account.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'ataProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'escrowPaymentBump',
          type: 'u8',
        },
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'auctioneerWithdraw',
      docs: ['Withdraw `amount` from the escrow payment account for your specific wallet.'],
      accounts: [
        {
          name: 'wallet',
          isMut: false,
          isSigner: false,
          docs: ['User wallet account.'],
        },
        {
          name: 'receiptAccount',
          isMut: true,
          isSigner: false,
          docs: [
            'SPL token account or native SOL account to transfer funds to. If the account is a native SOL account, this is the same as the wallet address.',
          ],
        },
        {
          name: 'escrowPaymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer escrow payment account PDA.'],
        },
        {
          name: 'treasuryMint',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance treasury mint account.'],
        },
        {
          name: 'authority',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance authority account.'],
        },
        {
          name: 'auctioneerAuthority',
          isMut: false,
          isSigner: true,
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'auctionHouseFeeAccount',
          isMut: true,
          isSigner: false,
          docs: ['Auction House instance fee account.'],
        },
        {
          name: 'ahAuctioneerPda',
          isMut: false,
          isSigner: false,
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'],
        },
        {
          name: 'tokenProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'ataProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'escrowPaymentBump',
          type: 'u8',
        },
        {
          name: 'amount',
          type: 'u64',
        },
      ],
    },
    {
      name: 'closeEscrowAccount',
      docs: ['Close the escrow account of the user.'],
      accounts: [
        {
          name: 'wallet',
          isMut: false,
          isSigner: true,
          docs: ['User wallet account.'],
        },
        {
          name: 'escrowPaymentAccount',
          isMut: true,
          isSigner: false,
          docs: ['Buyer escrow payment account PDA.'],
        },
        {
          name: 'auctionHouse',
          isMut: false,
          isSigner: false,
          docs: ['Auction House instance PDA account.'],
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'escrowPaymentBump',
          type: 'u8',
        },
      ],
    },
    {
      name: 'delegateAuctioneer',
      accounts: [
        {
          name: 'auctionHouse',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'auctioneerAuthority',
          isMut: false,
          isSigner: false,
          docs: ['The auctioneer authority - the program PDA running this auction.'],
        },
        {
          name: 'ahAuctioneerPda',
          isMut: true,
          isSigner: false,
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'],
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'scopes',
          type: {
            vec: {
              defined: 'AuthorityScope',
            },
          },
        },
      ],
    },
    {
      name: 'updateAuctioneer',
      accounts: [
        {
          name: 'auctionHouse',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'authority',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'auctioneerAuthority',
          isMut: false,
          isSigner: false,
          docs: ['The auctioneer authority - typically a PDA of the Auctioneer program running this action.'],
        },
        {
          name: 'ahAuctioneerPda',
          isMut: true,
          isSigner: false,
          docs: ['The auctioneer PDA owned by Auction House storing scopes.'],
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'scopes',
          type: {
            vec: {
              defined: 'AuthorityScope',
            },
          },
        },
      ],
    },
    {
      name: 'printListingReceipt',
      docs: ['Create a listing receipt by creating a `listing_receipt` account.'],
      accounts: [
        {
          name: 'receipt',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'bookkeeper',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'instruction',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'receiptBump',
          type: 'u8',
        },
      ],
    },
    {
      name: 'cancelListingReceipt',
      docs: ['Cancel an active listing receipt by setting the `canceled_at` field to the current time.'],
      accounts: [
        {
          name: 'receipt',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'instruction',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'printBidReceipt',
      docs: ['Create a bid receipt by creating a `bid_receipt` account.'],
      accounts: [
        {
          name: 'receipt',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'bookkeeper',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'instruction',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'receiptBump',
          type: 'u8',
        },
      ],
    },
    {
      name: 'cancelBidReceipt',
      docs: ['Cancel an active bid receipt by setting the `canceled_at` field to the current time.'],
      accounts: [
        {
          name: 'receipt',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'instruction',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [],
    },
    {
      name: 'printPurchaseReceipt',
      docs: ['Create a purchase receipt by creating a `purchase_receipt` account.'],
      accounts: [
        {
          name: 'purchaseReceipt',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'listingReceipt',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'bidReceipt',
          isMut: true,
          isSigner: false,
        },
        {
          name: 'bookkeeper',
          isMut: true,
          isSigner: true,
        },
        {
          name: 'systemProgram',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'rent',
          isMut: false,
          isSigner: false,
        },
        {
          name: 'instruction',
          isMut: false,
          isSigner: false,
        },
      ],
      args: [
        {
          name: 'purchaseReceiptBump',
          type: 'u8',
        },
      ],
    },
  ],
  accounts: [
    {
      name: 'bidReceipt',
      docs: ['Receipt for a bid transaction.'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'tradeState',
            type: 'publicKey',
          },
          {
            name: 'bookkeeper',
            type: 'publicKey',
          },
          {
            name: 'auctionHouse',
            type: 'publicKey',
          },
          {
            name: 'buyer',
            type: 'publicKey',
          },
          {
            name: 'metadata',
            type: 'publicKey',
          },
          {
            name: 'tokenAccount',
            type: {
              option: 'publicKey',
            },
          },
          {
            name: 'purchaseReceipt',
            type: {
              option: 'publicKey',
            },
          },
          {
            name: 'price',
            type: 'u64',
          },
          {
            name: 'tokenSize',
            type: 'u64',
          },
          {
            name: 'bump',
            type: 'u8',
          },
          {
            name: 'tradeStateBump',
            type: 'u8',
          },
          {
            name: 'createdAt',
            type: 'i64',
          },
          {
            name: 'canceledAt',
            type: {
              option: 'i64',
            },
          },
        ],
      },
    },
    {
      name: 'listingReceipt',
      docs: ['Receipt for a listing transaction.'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'tradeState',
            type: 'publicKey',
          },
          {
            name: 'bookkeeper',
            type: 'publicKey',
          },
          {
            name: 'auctionHouse',
            type: 'publicKey',
          },
          {
            name: 'seller',
            type: 'publicKey',
          },
          {
            name: 'metadata',
            type: 'publicKey',
          },
          {
            name: 'purchaseReceipt',
            type: {
              option: 'publicKey',
            },
          },
          {
            name: 'price',
            type: 'u64',
          },
          {
            name: 'tokenSize',
            type: 'u64',
          },
          {
            name: 'bump',
            type: 'u8',
          },
          {
            name: 'tradeStateBump',
            type: 'u8',
          },
          {
            name: 'createdAt',
            type: 'i64',
          },
          {
            name: 'canceledAt',
            type: {
              option: 'i64',
            },
          },
        ],
      },
    },
    {
      name: 'purchaseReceipt',
      docs: ['Receipt for a purchase transaction.'],
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'bookkeeper',
            type: 'publicKey',
          },
          {
            name: 'buyer',
            type: 'publicKey',
          },
          {
            name: 'seller',
            type: 'publicKey',
          },
          {
            name: 'auctionHouse',
            type: 'publicKey',
          },
          {
            name: 'metadata',
            type: 'publicKey',
          },
          {
            name: 'tokenSize',
            type: 'u64',
          },
          {
            name: 'price',
            type: 'u64',
          },
          {
            name: 'bump',
            type: 'u8',
          },
          {
            name: 'createdAt',
            type: 'i64',
          },
        ],
      },
    },
    {
      name: 'auctionHouse',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'auctionHouseFeeAccount',
            type: 'publicKey',
          },
          {
            name: 'auctionHouseTreasury',
            type: 'publicKey',
          },
          {
            name: 'treasuryWithdrawalDestination',
            type: 'publicKey',
          },
          {
            name: 'feeWithdrawalDestination',
            type: 'publicKey',
          },
          {
            name: 'treasuryMint',
            type: 'publicKey',
          },
          {
            name: 'authority',
            type: 'publicKey',
          },
          {
            name: 'creator',
            type: 'publicKey',
          },
          {
            name: 'bump',
            type: 'u8',
          },
          {
            name: 'treasuryBump',
            type: 'u8',
          },
          {
            name: 'feePayerBump',
            type: 'u8',
          },
          {
            name: 'sellerFeeBasisPoints',
            type: 'u16',
          },
          {
            name: 'requiresSignOff',
            type: 'bool',
          },
          {
            name: 'canChangeSalePrice',
            type: 'bool',
          },
          {
            name: 'escrowPaymentBump',
            type: 'u8',
          },
          {
            name: 'hasAuctioneer',
            type: 'bool',
          },
          {
            name: 'auctioneerAddress',
            type: 'publicKey',
          },
          {
            name: 'scopes',
            type: {
              array: ['bool', 7],
            },
          },
        ],
      },
    },
    {
      name: 'auctioneer',
      type: {
        kind: 'struct',
        fields: [
          {
            name: 'auctioneerAuthority',
            type: 'publicKey',
          },
          {
            name: 'auctionHouse',
            type: 'publicKey',
          },
          {
            name: 'bump',
            type: 'u8',
          },
        ],
      },
    },
  ],
  types: [
    {
      name: 'AuthorityScope',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Deposit',
          },
          {
            name: 'Buy',
          },
          {
            name: 'PublicBuy',
          },
          {
            name: 'ExecuteSale',
          },
          {
            name: 'Sell',
          },
          {
            name: 'Cancel',
          },
          {
            name: 'Withdraw',
          },
        ],
      },
    },
    {
      name: 'BidType',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'PublicSale',
          },
          {
            name: 'PrivateSale',
          },
          {
            name: 'AuctioneerPublicSale',
          },
          {
            name: 'AuctioneerPrivateSale',
          },
        ],
      },
    },
    {
      name: 'ListingType',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Sell',
          },
          {
            name: 'AuctioneerSell',
          },
        ],
      },
    },
    {
      name: 'PurchaseType',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'ExecuteSale',
          },
          {
            name: 'AuctioneerExecuteSale',
          },
        ],
      },
    },
    {
      name: 'CancelType',
      type: {
        kind: 'enum',
        variants: [
          {
            name: 'Cancel',
          },
          {
            name: 'AuctioneerCancel',
          },
        ],
      },
    },
  ],
  errors: [
    {
      code: 6000,
      name: 'PublicKeyMismatch',
      msg: 'PublicKeyMismatch',
    },
    {
      code: 6001,
      name: 'InvalidMintAuthority',
      msg: 'InvalidMintAuthority',
    },
    {
      code: 6002,
      name: 'UninitializedAccount',
      msg: 'UninitializedAccount',
    },
    {
      code: 6003,
      name: 'IncorrectOwner',
      msg: 'IncorrectOwner',
    },
    {
      code: 6004,
      name: 'PublicKeysShouldBeUnique',
      msg: 'PublicKeysShouldBeUnique',
    },
    {
      code: 6005,
      name: 'StatementFalse',
      msg: 'StatementFalse',
    },
    {
      code: 6006,
      name: 'NotRentExempt',
      msg: 'NotRentExempt',
    },
    {
      code: 6007,
      name: 'NumericalOverflow',
      msg: 'NumericalOverflow',
    },
    {
      code: 6008,
      name: 'ExpectedSolAccount',
      msg: 'Expected a sol account but got an spl token account instead',
    },
    {
      code: 6009,
      name: 'CannotExchangeSOLForSol',
      msg: 'Cannot exchange sol for sol',
    },
    {
      code: 6010,
      name: 'SOLWalletMustSign',
      msg: 'If paying with sol, sol wallet must be signer',
    },
    {
      code: 6011,
      name: 'CannotTakeThisActionWithoutAuctionHouseSignOff',
      msg: 'Cannot take this action without auction house signing too',
    },
    {
      code: 6012,
      name: 'NoPayerPresent',
      msg: 'No payer present on this txn',
    },
    {
      code: 6013,
      name: 'DerivedKeyInvalid',
      msg: 'Derived key invalid',
    },
    {
      code: 6014,
      name: 'MetadataDoesntExist',
      msg: "Metadata doesn't exist",
    },
    {
      code: 6015,
      name: 'InvalidTokenAmount',
      msg: 'Invalid token amount',
    },
    {
      code: 6016,
      name: 'BothPartiesNeedToAgreeToSale',
      msg: 'Both parties need to agree to this sale',
    },
    {
      code: 6017,
      name: 'CannotMatchFreeSalesWithoutAuctionHouseOrSellerSignoff',
      msg: 'Cannot match free sales unless the auction house or seller signs off',
    },
    {
      code: 6018,
      name: 'SaleRequiresSigner',
      msg: 'This sale requires a signer',
    },
    {
      code: 6019,
      name: 'OldSellerNotInitialized',
      msg: 'Old seller not initialized',
    },
    {
      code: 6020,
      name: 'SellerATACannotHaveDelegate',
      msg: 'Seller ata cannot have a delegate set',
    },
    {
      code: 6021,
      name: 'BuyerATACannotHaveDelegate',
      msg: 'Buyer ata cannot have a delegate set',
    },
    {
      code: 6022,
      name: 'NoValidSignerPresent',
      msg: 'No valid signer present',
    },
    {
      code: 6023,
      name: 'InvalidBasisPoints',
      msg: 'BP must be less than or equal to 10000',
    },
    {
      code: 6024,
      name: 'TradeStateDoesntExist',
      msg: 'The trade state account does not exist',
    },
    {
      code: 6025,
      name: 'TradeStateIsNotEmpty',
      msg: 'The trade state is not empty',
    },
    {
      code: 6026,
      name: 'ReceiptIsEmpty',
      msg: 'The receipt is empty',
    },
    {
      code: 6027,
      name: 'InstructionMismatch',
      msg: 'The instruction does not match',
    },
    {
      code: 6028,
      name: 'InvalidAuctioneer',
      msg: 'Invalid Auctioneer for this Auction House instance.',
    },
    {
      code: 6029,
      name: 'MissingAuctioneerScope',
      msg: 'The Auctioneer does not have the correct scope for this action.',
    },
    {
      code: 6030,
      name: 'MustUseAuctioneerHandler',
      msg: 'Must use auctioneer handler.',
    },
    {
      code: 6031,
      name: 'NoAuctioneerProgramSet',
      msg: 'No Auctioneer program set.',
    },
    {
      code: 6032,
      name: 'TooManyScopes',
      msg: 'Too many scopes.',
    },
    {
      code: 6033,
      name: 'AuctionHouseNotDelegated',
      msg: 'Auction House not delegated.',
    },
    {
      code: 6034,
      name: 'BumpSeedNotInHashMap',
      msg: 'Bump seed not in hash map.',
    },
    {
      code: 6035,
      name: 'EscrowUnderRentExemption',
      msg: 'The instruction would drain the escrow below rent exemption threshold',
    },
    {
      code: 6036,
      name: 'InvalidSeedsOrAuctionHouseNotDelegated',
      msg: 'Invalid seeds or Auction House not delegated',
    },
    {
      code: 6037,
      name: 'BuyerTradeStateNotValid',
      msg: 'The buyer trade state was unable to be initialized.',
    },
    {
      code: 6038,
      name: 'MissingElementForPartialOrder',
      msg: 'Partial order size and price must both be provided in a partial buy.',
    },
    {
      code: 6039,
      name: 'NotEnoughTokensAvailableForPurchase',
      msg: 'Amount of tokens available for purchase is less than the partial order amount.',
    },
    {
      code: 6040,
      name: 'PartialPriceMismatch',
      msg: 'Calculated partial price does not not partial price that was provided.',
    },
    {
      code: 6041,
      name: 'AuctionHouseAlreadyDelegated',
      msg: 'Auction House already delegated.',
    },
    {
      code: 6042,
      name: 'AuctioneerAuthorityMismatch',
      msg: 'Auctioneer Authority Mismatch',
    },
    {
      code: 6043,
      name: 'InsufficientFunds',
      msg: 'Insufficient funds in escrow account to purchase.',
    },
  ],
};

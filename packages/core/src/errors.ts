export class InsufficientBalanceError extends Error {
  message: string;
  constructor(message?: string) {
    super(message);
    this.message = 'Insufficient Balance for transaction';
    this.name = 'InsufficientBalanceError';
  }
}

export class ListingAlreadyExistsError extends Error {
  message: string;
  constructor(message?: string) {
    super(message);
    this.message = "You cannot update a token's listing to the same price. Please update listing to a different price";
    this.name = 'ListingAlreadyExistsError';
  }
}

export function programErrorHandler(error: any, action: 'buy' | 'sell' | 'update' | 'cancel' | '' = '') {
  // Is on-chain error
  const errorLogs = error.logs as string[];
  if (errorLogs) {
    const anchorErrorMessageIndex = (error.logs as string[]).findIndex((log) => log.includes('AnchorError'));
    const errorLogsCopy = new Array(...errorLogs);
    const anchorErrorMessage = errorLogsCopy.splice(0, anchorErrorMessageIndex + 1).find((log: string) => log.includes('Instruction:'));
    console.log({ anchorErrorMessage });
    if (anchorErrorMessage) {
      const errorMessage = errorLogs[anchorErrorMessageIndex];
      const message = errorMessage.includes('DerivedKeyInvalid')
        ? `Invalid parameters passed into transaction. Please make sure you passed the correct ${action} parameters. More information: ${errorMessage}.`
        : errorMessage;
      const _error = new Error(anchorErrorMessage + ' ' + message);
      throw _error;
    } else {
      throw new Error(error.msg);
    }
  } else {
    throw error;
  }
}

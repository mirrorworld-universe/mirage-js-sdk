export class InsufficientBalanceError extends Error {
  message: string;
  constructor(message?: string) {
    super(message);
    this.message = 'Insufficient Balance for transaction';
    this.name = 'InsufficientBalanceError';
  }
}

export function programErrorHandler(error: any) {
  // Is on-chain error
  const errorLogs = error.logs as string[];
  if (errorLogs) {
    const anchorErrorMessageIndex = (error.logs as string[]).findIndex((log) => log.includes('AnchorError'));
    const errorLogsCopy = new Array(...errorLogs);
    const anchorErrorMessage = errorLogsCopy.splice(0, anchorErrorMessageIndex + 1).find((log: string) => log.includes('Instruction:'));
    console.log({ anchorErrorMessage });
    if (anchorErrorMessage) {
      const _error = new Error(anchorErrorMessage + ' ' + errorLogs[anchorErrorMessageIndex]);
      throw _error;
    } else {
      throw new Error(error.msg);
    }
  } else {
    throw error;
  }
}

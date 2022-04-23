export class InsufficientBalanceError extends Error {
  message: string;
  constructor(message?: string) {
    super(message);
    this.message = 'Insufficient Balance for transaction';
    this.name = 'InsufficientBalanceError';
  }
}

const __ErrorCodes__ = {
  WALLET_NOT_INITIALIZED: {
    error: 'WALLET_NOT_INITIALIZED',
    code: 300101,
    message: `Wallet has not been initialized in SDK`,
  },
  AUCTION_HOUSE_NOT_INITIALIZED: {
    error: 'AUCTION_HOUSE_NOT_INITIALIZED',
    code: 300102,
    message: `AuctionHouse not been initialized in SDK`,
  },
  PROGRAM_NOT_INITIALIZED: {
    error: 'PROGRAM_NOT_INITIALIZED',
    code: 300103,
    message: `Program not been initialized in SDK`,
  },
};
export type MirageClientErrorCodes = typeof __ErrorCodes__;
export type MirageClientErrorKey = keyof MirageClientErrorCodes;
export type ErrorBody<T extends MirageClientErrorKey = MirageClientErrorKey> = {
  error: T;
  code: number;
  message: string | ((body?: unknown) => string);
};

export type MirageClientErrors = Record<MirageClientErrorKey, ErrorBody>;

const ErrorCodes = __ErrorCodes__ as MirageClientErrors;

export class MirageClientError extends Error {
  public message: string;
  public code: number;
  public data = null;
  public error: string;

  static new(errorCode: MirageClientErrorKey, message?: ErrorBody['message']) {
    const error = ErrorCodes[errorCode];
    const payload = new MirageClientError(error);
    if (message) return MirageClientError.withMessage(payload, message);
    else return payload;
  }

  private static withMessage(error: MirageClientError, _message: ErrorBody['message']) {
    let message: string;
    if (typeof _message === 'function') {
      message = _message();
    } else {
      message = _message;
    }
    error.message = message;
    return error;
  }

  constructor(error: ErrorBody) {
    let message: string;
    if (typeof error.message === 'function') {
      message = error.message();
    } else {
      message = error.message;
    }
    super(message);
    this.message = message;
    this.code = error.code;
    this.error = error.error;
    this.data = null;
  }
}

/* Throws parsed error based on MirrorWorld API Error Standard */
export function throwError(error: MirageClientErrorKey, customMessage?: ErrorBody['message']) {
  throw MirageClientError.new(error, customMessage);
}

export { ErrorCodes };

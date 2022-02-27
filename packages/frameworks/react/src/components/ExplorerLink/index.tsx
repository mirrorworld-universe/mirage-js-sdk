import React from 'react';
import { shortenAddress } from '@mirrorworld/mirage.utils';
import { PublicKey } from '@solana/web3.js';

export const ExplorerLink = (props: {
  address: string | PublicKey;
  type: string;
  code?: boolean;
  style?: React.CSSProperties;
  length?: number;
}) => {
  const { type, code } = props;

  const address =
    typeof props.address === 'string'
      ? props.address
      : props.address?.toBase58();

  if (!address) {
    return null;
  }

  const length = props.length ?? 9;

  return (
    <a
      href={`https://explorer.solana.com/${type}/${address}`}
      target="_blank"
      title={address}
      style={props.style}
    >
      {code ? (
        <p style={props.style}>{shortenAddress(address, length)}</p>
      ) : (
        shortenAddress(address, length)
      )}
    </a>
  );
};

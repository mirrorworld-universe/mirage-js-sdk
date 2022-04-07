import { createContext } from './context';
import { Connection, clusterApiUrl } from '@solana/web3.js';
import { computed, ComputedRef } from 'vue';

export enum SolanaNetworks {
  mainnet = 'mainnet-beta',
  devnet = 'devnet',
  testnet = 'testnet',
}

export interface ConnectionContext {
  connection: ComputedRef<Connection>;
}

const [ConnectionContextProvider, useConnection, ConnectionInjectionKey] = createContext<ConnectionContext>({
  name: 'ConnectionContext',
  strict: true,
  errorMessage: 'useConnection requires you to provide the connection hook',
});

export function initializeConnection(network: SolanaNetworks) {
  try {
    const _connection = new Connection(clusterApiUrl(network), 'confirmed');

    const connection = computed(() => ({
      connection: _connection,
    }));
    ConnectionContextProvider({
      connection: connection,
    });
    return { connection, endpoint: clusterApiUrl(network) };
  } catch (error) {
    console.error('There was a problem initializing connection', error);
  }
}

export { ConnectionContextProvider, useConnection, ConnectionInjectionKey };

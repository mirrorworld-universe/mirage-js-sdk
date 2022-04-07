import { App, Plugin } from 'vue';
import {
  ConnectionInjectionKey,
  initializeConnection,
  SolanaNetworks,
} from '@axiajs/solana.vue';

export interface AxiaSolanaPluginOptions {
  network: SolanaNetworks;
}

const AxiaSolanaPlugin: Plugin = {
  install(app: App, options: AxiaSolanaPluginOptions) {
    // Create new connection instance
    const connection = initializeConnection(options.network);
    app.provide(ConnectionInjectionKey, connection);
  },
};

export default AxiaSolanaPlugin;

import { App, Plugin } from 'vue';
import { ConnectionInjectionKey, initializeConnection, SolanaNetworks, initializeWallet, WalletInjectionKey } from './composables';

export interface AxiaSolanaPluginOptions {
  network: SolanaNetworks;
  autoConnect?: boolean;
}

export { SolanaNetworks };

const DEFAULT_OPTIONS: AxiaSolanaPluginOptions = {
  autoConnect: true,
  network: SolanaNetworks.devnet,
};

const AxiaSolanaPlugin: Plugin = {
  install(app: App, _options: AxiaSolanaPluginOptions) {
    const options = Object.assign(DEFAULT_OPTIONS, _options);
    // Create new connection instance
    const { connection, endpoint } = initializeConnection(options.network)!;
    app.provide(ConnectionInjectionKey, {
      connection,
      endpoint,
    });

    const ctx = initializeWallet();
    if (options.autoConnect) {
      ctx?.wallet.value.on('readyStateChange', async () => {
        await ctx.wallet.value.connect();
      });
    }
    app.provide(WalletInjectionKey, ctx);
  },
};

export default AxiaSolanaPlugin;
export { AxiaSolanaPlugin as AxiaSolana };

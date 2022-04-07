import { defineComponent, PropType } from 'vue';
import {
  ConnectionContextProvider,
  initializeConnection,
  SolanaNetworks,
} from '../composables';

const defaultNetwork = SolanaNetworks.devnet;

export const ConnectionProvider = defineComponent(
  (props: { network: SolanaNetworks }, { slots }) => {
    const ctx = initializeConnection(props.network)!;
    ConnectionContextProvider(ctx);
    return () => slots?.default?.();
  }
);

/** @ts-ignore */
ConnectionProvider.name = 'ConnectionProvider';
ConnectionProvider.props = {
  network: {
    type: String as PropType<SolanaNetworks>,
    default: defaultNetwork,
  },
};

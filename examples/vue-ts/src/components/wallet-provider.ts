import { defineComponent } from 'vue';
import { initializeWallet, WalletContextProvider } from '../composables';

export const WalletProvider = defineComponent((_, { slots }) => {
  const ctx = initializeWallet()!;
  WalletContextProvider(ctx);
  return () => slots?.default?.();
});

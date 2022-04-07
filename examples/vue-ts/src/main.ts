// @ts-ignore
import App from './App.vue';
import { createApp } from 'vue';
import Chakra from '@chakra-ui/vue-next';
import { chakra, domElements } from '@chakra-ui/vue-system';
import { ViteSSG } from 'vite-ssg';
// @ts-ignore
import generatedRoutes from 'virtual:generated-pages';
import { setupLayouts } from 'virtual:generated-layouts';
import { hydrate } from '@emotion/css';

import * as icons from './utils/icons';
import theme from './theme/extend';
import { SolanaNetworks } from './components';
import { AxiaSolana } from './solana.plugin';
import { createRouter, createWebHistory } from 'vue-router';

const routes = setupLayouts(generatedRoutes);

const router = createRouter({
  routes,
  history: createWebHistory(),
});
const app = createApp(App);
app.use(router);

app.use(AxiaSolana, {
  network: SolanaNetworks.devnet,
});

app.use(Chakra, {
  extendTheme: theme,
  icons: {
    library: icons,
  },
});

domElements.forEach((tag) => {
  app.component(`chakra.${tag}`, chakra(tag));
});

app.mount('#app');

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'vite-plugin-components';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import { componentResolver } from '@chakra-ui/vue-auto-import';
import { handleSSG } from './src/utils/ssg';
import inject from '@rollup/plugin-inject';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_DEBUG': JSON.stringify(''),
  },
  optimizeDeps: {
    include: ['buffer', '@solana/web3.js', '@solana/web3.js > bn.js', '@solana/web3.js > borsh', '@solana/web3.js > buffer', 'borsh', 'buffer-layout'],
  },
  build: {
    commonjsOptions: {
      include: ['borsh', '@solana/web3.js', 'buffer-layout'],
    },
  },
  resolve: {
    alias: {
      // borsh: resolve(__dirname, '../../node_modules/borsh/lib/index.js'),
    },
  },
  plugins: [
    vue(),
    // @ts-ignore
    inject({
      Buffer: ['buffer', 'Buffer'],
    }),
    Components({
      customComponentResolvers: [componentResolver],
    }),
    Pages({
      pagesDir: ['./src/pages'],
    }),
    Layouts({
      // @ts-ignore
      layoutsDir: './src/layouts',
    }),
  ],
  ssgOptions: {
    script: 'async',
    formatting: 'prettify',
    onPageRendered: handleSSG,
  },
});

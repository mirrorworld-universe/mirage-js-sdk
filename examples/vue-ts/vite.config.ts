import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'vite-plugin-components';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import { componentResolver } from '@chakra-ui/vue-auto-import';
import inject from '@rollup/plugin-inject';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_DEBUG': JSON.stringify(''),
  },
  optimizeDeps: {
    include: [
      'buffer',
      'buffer-layout',
      'tinycolor2',
      '@mirrorworld/mirage.core',
      '@solana/web3.js > bn.js',
      '@solana/web3.js > borsh',
      '@solana/web3.js > buffer',
    ],
    exclude: ['@solana/web3.js'],
  },
  build: {
    commonjsOptions: {
      include: [],
      exclude: ['tinycolor2', '@mirrorworld/mirage.core'],
    },
  },
  // esbuild: {
  //   t,
  // },
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
});

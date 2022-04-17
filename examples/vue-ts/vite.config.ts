import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'vite-plugin-components';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import { componentResolver } from '@chakra-ui/vue-auto-import';
import inject from '@rollup/plugin-inject';
import commonjs from '@rollup/plugin-commonjs';
import { esbuildCommonjs } from '@originjs/vite-plugin-commonjs';
import requireTransform from 'vite-plugin-require-transform';
import NodeGlobalsPolyfillPlugin from '@esbuild-plugins/node-globals-polyfill';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env.NODE_DEBUG': JSON.stringify(''),
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
      // Enable esbuild polyfill plugins
      plugins: [
        // esbuildCommonjs(),
        NodeGlobalsPolyfillPlugin({
          buffer: true,
        }),
      ],
    },
  },
  build: {
    // rollupOptions: {
    //   plugins: [
    //     // commonjs({
    //     //   requireReturnsDefault: true,
    //     // }),
    //   ],
    // },
  },
  plugins: [
    vue(),
    requireTransform({}),
    Components({
      customComponentResolvers: [componentResolver],
    }),
    Pages({
      pagesDir: ['src/pages'],
    }),
    Layouts({
      // @ts-ignore
      layoutsDir: 'src/layouts',
    }),
  ],
});

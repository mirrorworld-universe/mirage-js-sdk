import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'vite-plugin-components';
import Pages from 'vite-plugin-pages';
import Layouts from 'vite-plugin-vue-layouts';
import { componentResolver } from '@chakra-ui/vue-auto-import';
import { handleSSG } from './src/utils/ssg';
import inject from '@rollup/plugin-inject';

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    'process.env': process.env,
    global: {},
  },
  optimizeDeps: {
    include: ['buffer'],
  },
  plugins: [
    vue(),
    // @ts-expect-error
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
      layoutsDir: './src/layouts',
    }),
  ],
  ssgOptions: {
    script: 'async',
    formatting: 'prettify',
    onPageRendered: handleSSG,
  },
});

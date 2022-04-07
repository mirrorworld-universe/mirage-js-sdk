import { extendTheme } from '@chakra-ui/vue-next';
import { mode } from '@chakra-ui/vue-theme-tools';

const customTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
  },
  fonts: {
    heading: `SpaceGrotesk, sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
    body: `SpaceGrotesk, sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"`,
  },
  shadows: {
    outline: `0 0 0 4px rgba(47, 133, 90, 0.62)`,
    search:
      '0 0 0 1px rgba(16,22,26,.1), 0 4px 8px rgba(16,22,26,.2), 0 18px 46px 6px rgba(16,22,26,.2)',
  },
  styles: {
    global: (props: any) => ({
      body: {
        color: mode('gray.700', 'whiteAlpha.900')(props),
        bg: mode('whiteAlpha.900', 'gray.800')(props),
        background:
          'radial-gradient(circle at 53% 32%,rgba(149,176,241,0.13), rgba(149,176,241,0) 50%), radial-gradient(circle at 10% 10%,rgba(114,226,243,0.19), rgba(114,226,243,0) 50%), radial-gradient(circle at 90% 10%,rgba(255,42,148,0.15), rgba(255,42,148,0) 50%), radial-gradient(circle at 90% 90%,rgba(255,225,10,0.19), rgba(255,225,10,0) 50%), radial-gradient(circle at 10% 90%,rgba(168,112,253,0.11), rgba(168,112,253,0) 50%), black;',
      },
    }),
  },
  colors: {
    emerald: {
      DEFAULT: '#30855F',
      '50': '#B6E5D0',
      '100': '#A3DEC4',
      '200': '#7ED0AB',
      '300': '#58C393',
      '400': '#3EAA7A',
      '500': '#30855F',
      '600': '#226044',
      '700': '#153A29',
      '800': '#07150F',
      '900': '#000000',
    },
  },
  components: {},
});

export default customTheme;

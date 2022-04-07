import { extractCritical } from '@emotion/server';
import { hydrate as emotionHydrate } from '@emotion/css';

export const __CHAKRA_SSG_INJECTION_KEY__ = Symbol('$emotionSSRIds');

/**
 *
 * @param html Page HTML
 * @param ids Array of critical ids to hydrate
 * @param css Critical CSS string
 */
const injectCritical = (html: string, ids: string[], css: string) =>
  html
    .replace('</title>\n', `</title>\n<script>window.$emotionSSRIds=${JSON.stringify(ids)}</script>\n`)
    .replace('</head>\n', `<style>${css}</style>\n</head>\n`);

/**
 * Extract critical CSS from HTML an inject it into the page
 */
export function handleSSG(_: any, html: string): string {
  /** Extract critical styles */
  const { ids, css } = extractCritical(html);
  /** Append ssr ids to rendered HTML for hydration */
  return injectCritical(html, ids, css);
}

export function hydrate() {
  const ssrIds = window?.$emotionSSRIds || [];
  emotionHydrate(ssrIds);
}

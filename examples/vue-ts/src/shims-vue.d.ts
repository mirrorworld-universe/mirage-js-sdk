import { RouteRecordRaw } from 'vue-router';
import { DefineComponent } from 'vue';

declare module '*.vue' {
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module 'virtual:generated-layouts' {}
declare module 'virtual:generated-pages' {
  const routes: RouteRecordRaw[];
  export default routes;
}

declare global {
  interface Window {
    $emotionSSRIds: string[];
  }
}

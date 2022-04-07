# Chakra UI Vue - Chidori Starter Template ⚡️

Template for Chakra UI Vue v1 with Typescript, Vite, components auto-importing, layouts, and static site generation.

## Features ✨
- ✅ Vue 3
- ✅ Gradients support
- ✅ CSS Variables support
- ✅ Dark mode ready
- ✅ Component style overrides
- ✅ Feather icons ready
- ✅ Custom component theming API
- ✅ Custom variants
- ✅ Components auto-import
- ✅ SSG on Vite

> Note: This template is currently built using an alpha release of **[`@chakra-ui/vue-next`](https://github.com/chakra-ui/chakra-ui-vue-next).**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fcodebender828%2Fchakra-ui-chidori-starter&project-name=awesome-chakra-project&repo-name=awesome-chakra-project&demo-title=Chakra%20UI%20Vue%20Chidori%20v1%20Demo&demo-description=Template%20for%20Chakra%20UI%20Vue%20v1%20with%20Typescript%2C%20Vite%2C%20components%20auto-importing%2C%20layouts%2C%20and%20static%20site%20generation.&demo-url=https%3A%2F%2Fchakra-ui-chidori-starter.vercel.app%2F&demo-image=https%3A%2F%2Fres.cloudinary.com%2Fxtellar%2Fimage%2Fupload%2Fv1626258632%2Fchakra-ui%2Fchakra-.png)

![Chakra UI Home page](/public/images/home.png)
![Chakra UI Dashboard page](/public/images/dashboard.png)

**[⚡️ Live Demo](https://chakra-ui-chidori-starter.vercel.app/)**

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur). Make sure to enable `vetur.experimental.templateInterpolationService` in settings!

### If Using `<script setup>`

[`<script setup>`](https://github.com/vuejs/rfcs/pull/227) is a feature that is currently in RFC stage. To get proper IDE support for the syntax, use [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) instead of Vetur (and disable Vetur).

### Type Support For `.vue` Imports in TS

Since TypeScript cannot handle type information for `.vue` imports, they are shimmed to be a generic Vue component type by default. In most cases this is fine if you don't really care about component prop types outside of templates. However, if you wish to get actual prop types in `.vue` imports (for example to get props validation when using manual `h(...)` calls), you can use the following:

### If Using Volar

Run `Volar: Switch TS Plugin on/off` from VSCode command palette.

### If Using Vetur

1. Install and add `@vuedx/typescript-plugin-vue` to the [plugins section](https://www.typescriptlang.org/tsconfig#plugins) in `tsconfig.json`
2. Delete `src/shims-vue.d.ts` as it is no longer needed to provide module info to Typescript
3. Open `src/main.ts` in VSCode
4. Open the VSCode command palette
5. Search and run "Select TypeScript version" -> "Use workspace version"

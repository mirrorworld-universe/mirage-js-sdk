<template>
  <c-reset />
  <c-grid :template-columns="{ base: '1fr', sm: '1fr', md: '250px 1fr' }" h="100vh" :pt="{ base: 10, sm: 10, md: 0 }" w="100vw">
    <c-side-nav :grid-column="{ base: '1/2', sm: '1/2', md: '1/2'}" :d="['none', 'none', 'flex']" />
    <c-stack :grid-column="{ base: '1/2', sm: '1/2', md: '2/3'}" spacing="8" p="10">
      <c-mobile-nav :d="['flex', 'flex', 'none']" />
      <c-alert status="error" rounded="lg">
        <c-alert-icon />
        <c-alert-title>Not found.</c-alert-title>
        <c-alert-description>
          Try visiting another page, or <chakra.span font-weight="bold" text-decoration="underline"><router-link d="inline" to="/">return home.</router-link></chakra.span>
        </c-alert-description>
      </c-alert>
      <c-button align-self="start" @click="router.back" left-icon="arrow-left">
        Previous page
      </c-button>
      <c-button align-self="start" size="sm" as="a" left-icon="github" href="https://github.com/codebender828/chakra-ui-chidori-starter/blob/main/src/layouts/404.vue" target="_blank" variant="outline" color-scheme="gray">
        View source
      </c-button>
    </c-stack>
  </c-grid>
</template>

<script setup lang="ts">
import { useRouter, RouterLink } from 'vue-router'

const router = useRouter()
</script>

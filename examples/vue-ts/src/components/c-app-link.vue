<template>
  <router-link
    :to="props.to"
    custom
    v-slot="{ href, navigate, isActive }"
  >
    <c-button v-bind="$attrs" size="sm" :bg="isActive ? 'whiteAlpha.50' : 'unset'" justify-content="flex-start" color-scheme="emerald" variant="ghost" px="3" py="1" rounded="md" as="a" :href="href" @click="navigate">
      <slot />
    </c-button>
  </router-link>
</template>

<script lang="ts" setup>
import { ref, defineProps } from 'vue'

const props = defineProps<{
  to: string
}>()
</script>

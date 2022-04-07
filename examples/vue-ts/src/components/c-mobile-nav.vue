<template>
  <client-only>
    <c-box :display="{ base: 'flex', sm: 'flex', md: 'none' }">
      <c-icon-button bg="none" position="absolute" top="4" left="4" :icon="isOpen ? 'x' : 'menu'" :aria-label="`${isOpen ? 'Close' : 'Open'} nav menu`" @click="isOpen = !isOpen" />
      <c-drawer v-model="isOpen" size="full" placement="left">
        <c-drawer-overlay />
        <c-drawer-content>
          <c-drawer-body pt="5">
            <c-drawer-close-button />
            <c-side-nav bg="transparent" />
          </c-drawer-body>
        </c-drawer-content>
      </c-drawer>
    </c-box>
  </client-only>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { onBeforeRouteLeave } from 'vue-router'

const isOpen = ref(false)

const open = () => {
  isOpen.value = true
}

const close = () => {
  isOpen.value = false
}

onBeforeRouteLeave(close)
</script>
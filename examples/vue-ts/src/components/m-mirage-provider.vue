<template>
  <slot />
</template>

<script lang="ts" setup>
import { initializeMirage, MirageContextProvider } from '../composables/use-mirage';
import { useWallet } from '@axiajs/solana.vue';
import { computed, ref } from 'vue';
import { Mirage } from '@mirrorworld/mirage.core'

const { wallet } = useWallet()
const mirage = ref<Mirage>()
const mirageContext = computed(() => mirage.value!)

wallet.value.on("readyStateChange", async(state) => {
  console.log("Wallet ready",  wallet.value)
  await wallet.value.connect()
  /** @ts-ignore */
  mirage.value = initializeMirage("https://fragrant-black-cherry.solana-devnet.quiknode.pro/74fbede70f2b8f6ed9b5bac5bfcda983e8bab832/", wallet.value)
})

MirageContextProvider(mirageContext)

</script>
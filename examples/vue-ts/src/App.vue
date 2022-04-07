<template>
  <connection-provider :network="SolanaNetworks.devnet">
    <wallet-provider>
      <c-reset />
      <router-view />
    </wallet-provider>
  </connection-provider>
</template>

<script lang="ts" setup>
import { RouterView } from 'vue-router';
import { WalletProvider, SolanaNetworks, ConnectionProvider } from '@axiajs/solana.vue'


console.log("AXIA Variables", {
  SolanaNetworks,
  WalletProvider
})
</script>
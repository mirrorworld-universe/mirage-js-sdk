<template>
  <connection-provider :network="SolanaNetworks.devnet">
    <wallet-provider>
      <m-mirage-provider>
        <c-reset />
        <router-view />
      </m-mirage-provider>
    </wallet-provider>
  </connection-provider>
</template>

<script lang="ts" setup>
import { RouterView } from 'vue-router';
import { WalletProvider, SolanaNetworks, ConnectionProvider } from '@axiajs/solana.vue';
import MMirageProvider from '../components/m-mirage-provider.vue';
</script>

<style>
body {
  color: rgba(255, 255, 255, 0.92);
  background-color: #1a202c;
  background: radial-gradient(circle at 53% 32%, rgba(149, 176, 241, 0.13), rgba(149, 176, 241, 0) 50%),
    radial-gradient(circle at 10% 10%, rgba(114, 226, 243, 0.19), rgba(114, 226, 243, 0) 50%),
    radial-gradient(circle at 90% 10%, rgba(255, 42, 148, 0.15), rgba(255, 42, 148, 0) 50%),
    radial-gradient(circle at 90% 90%, rgba(255, 225, 10, 0.19), rgba(255, 225, 10, 0) 50%),
    radial-gradient(circle at 10% 90%, rgba(168, 112, 253, 0.11), rgba(168, 112, 253, 0) 50%), black;
}
</style>

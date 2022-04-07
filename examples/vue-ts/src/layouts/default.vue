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
import { WalletProvider, SolanaNetworks, ConnectionProvider } from '@axiajs/solana.vue'
import MMirageProvider from '../components/m-mirage-provider.vue';
</script>
<template>
  <c-reset />
  <connection-provider :network="SolanaNetworks.devnet">
    <wallet-provider>
      <c-grid :template-columns="{ base: '1fr', sm: '1fr', md: '250px 1fr' }" min-h="100vh" :pt="{ base: 10, sm: 10, md: 0 }" w="100vw">
        <c-side-nav :grid-column="{ base: '1/2', sm: '1/2', md: '1/2' }" :d="['none', 'none', 'flex']" />
        <chakra.main :grid-column="{ base: '1/2', sm: '1/2', md: '2/3' }">
          <c-mobile-nav />
          <router-view />
        </chakra.main>
      </c-grid>
    </wallet-provider>
  </connection-provider>
</template>

<script lang="ts" setup>
import { chakra } from '@chakra-ui/vue-next';
import { WalletProvider, ConnectionProvider, SolanaNetworks } from '@axiajs/solana.vue';
</script>

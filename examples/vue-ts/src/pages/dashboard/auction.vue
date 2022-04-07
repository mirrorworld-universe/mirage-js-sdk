<template>
   <chakra.main p="10">
    <c-stack spacing="5">
      <c-heading>
        <c-icon color="emerald.500" name="shopping-bag" size="0.8em" />
        Auction
      </c-heading>
      <c-text color="gray.500">List token</c-text>
      <c-divider color="gray.300"></c-divider>
      <chakra.section py="4" px="5" rounded="lg">
        <c-stack align-items="flex-start">
          <c-heading as="h3" size="md">List</c-heading>
          <c-h-stack>
            <c-input v-model="mintKey" placeholder="Mint key" />
            <c-input v-model="salePrice" placeholder="Sale price" />
          </c-h-stack>
          <c-button color-scheme="blue" @click="listToken" :is-loading="isLoading">
            Sell token
          </c-button>
          <c-button color-scheme="red" @click="createStore">
            Create store
          </c-button>
        </c-stack>
      </chakra.section>
    </c-stack>
  </chakra.main>
</template>

<script lang="ts" setup>
import { useConnection, useWallet } from '@axiajs/solana.vue';
import { chakra } from "@chakra-ui/vue-next"
import { computed, onMounted, ref } from 'vue';
import { createInstantSaleAuction, setupMarketplace } from '@mirrorworld/mirage.core'
import { StringPublicKey } from '@axiajs/solana.utils';
import { actions, programs } from '@metaplex/js'
import { subscribeAccountsChange } from '@mirrorworld/mirage.utils';
import { getMetaState, mergeState } from '@mirrorworld/mirage.core/src/listing/meta';

const { wallet } = useWallet()
const { connection, endpoint } = useConnection()
const pk = computed(() => wallet.value.publicKey!)

const isLoading = ref(false)
const mintKey = ref<StringPublicKey>("Bb7E1f4zutPTrRaGZ4iCdRzZ9Q76hZsJhUoEtaRtc7tX")
const salePrice = ref<string>("1.2")

async function createStore() {

  // const response = await programs.auction.CreateAuctionV2({}, {})

  // console.log("auctionManagers", auctionManagers)

  // console.log({
  //   storeId,
  //   configId
  // })
}

async function listToken() {
  try {
    isLoading.value = true
    /**
     * This is an SDK operation @codebender828 pelase funciton here
     */

    setTimeout(() => {
      
    }, 3000)

    /**
     * 1. Buy NFT
     * 2. List NFT
     * 3. Update listing
     * 4. Cancel listing
     * 5. Gift NFT
     */
    const auction = await createInstantSaleAuction(
      connection.value,
      wallet.value,
      endpoint.value,
      mintKey.value,
      salePrice.value
    )
    console.log("Successfully lsited token", auction)
  } catch (error) {
    console.error("Failed to list token", error)
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  if (wallet.value.connected) {
    const account = await connection.value.getAccountInfo(wallet.value.publicKey!);
      console.log("account",account);
      setupMarketplace(connection.value, pk.value)

      // subscribeAccountsChange(connection.value, getMetaState, mergeState)
  }
})
</script>

<route lang="yaml">
meta:
  layout: dashboard
</route>
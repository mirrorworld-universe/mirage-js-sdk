<template>
   <chakra.main p="10">
    <c-stack spacing="5">
      <c-heading>
        <c-icon color="emerald.500" name="star" size="0.8em" />
        Mint
      </c-heading>
      <c-text color="gray.500">Your Mint New NFT</c-text>
      <c-divider color="gray.300"></c-divider>
      <chakra.section py="4" px="5" rounded="lg">
        <c-stack>
          <c-heading as="h3" size="md">Mintster</c-heading>
          <c-text>
            Mint new NFT
          </c-text>
          <c-stack>
            <c-input v-model="metadataUri" placeholder="Name" />
          </c-stack>
          <c-button color-scheme="blue" @click="mint">
            MINT
          </c-button>
          <chakra.pre white-space="pre-wrap" max-h="500px" overflow-y="scroll">
            {{ metadata }}
          </chakra.pre>
        </c-stack>
      </chakra.section>
    </c-stack>
  </chakra.main>
</template>

<script lang="ts" setup>
import { chakra } from "@chakra-ui/vue-next"
import { onMounted, ref, watch, watchEffect } from 'vue';
import { PublicKey } from '@solana/web3.js';

import { mintNFT, IMetadata } from "@mirrorworld/mirage.core"
import { ENDPOINTS } from "@mirrorworld/mirage.utils"
import { Creator } from '@mirrorworld/metaplex';
import { useConnection, useWallet } from '@axiajs/solana.vue'
import { getUserAccounts, subscribeToUserTokenAccounts, getParsedNftAccountsByOwner } from '@axiajs/solana.core'

function randomIntFromInterval(min: number, max: number) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const tokenId = randomIntFromInterval(1, 11000)
console.log({ tokenId })

const metadataUri = ref(`https://mirror-api.mirrorworld.fun/api/v1/metadata/${tokenId}`)

const { wallet } = useWallet()
const metadata = ref<IMetadata>()
const address = ref<string>()

const DEVNET_ENDPOINT = ENDPOINTS[2]

const { connection } = useConnection()

const files = ref<File[]>([])

watchEffect(() => {
  console.log("Connection injected here", connection.value)
})

onMounted(async() => {
  setTimeout(async() => {
    // @ts-ignore
    window.$phantomWallet = wallet.value
    await wallet.value?.connect()
    address.value = wallet.value?.publicKey?.toString()
    getParsedNftAccountsByOwner({
      publicAddress: address.value!,
      connection: connection.value
    })
      .then(result => {
        console.log("Account user", result)
      })


    metadata.value = {
      "name": `Mirror #${tokenId}`,
      "symbol": "MIRROR",
      "creators": [
        new Creator({
          address: new PublicKey(address.value!).toString(),
          verified: true,
          share: 100,
        }),
      ],
      "collection": "EMWv4qLVTLytXNheoWutoW1qFs6kP839GpZinK412GnS",
      "description": "Mirrors is a collection of 11,000 unique AI Virtual Beings. Each Mirror can be upgraded and co-create narratives by talking with the collector, also offering a series of rights in the future games.\n",
      "sellerFeeBasisPoints": 400,
      "image": `https://storage.mirrorworld.fun/nft/${tokenId}.png`,
      "attributes": [
        { "trait_type": "glasses", "value": "Bike Lens" },
        { "trait_type": "shoes", "value": "Fashion Sneakers, Purple" },
        { "trait_type": "pants", "value": "Beggar Pants, Green" },
        { "trait_type": "hat", "value": "None" },
        { "trait_type": "background", "value": "The Dance of Flies" },
        { "trait_type": "clothing", "value": "nabuC kraM Hoodie" },
        { "trait_type": "hair", "value": "nabuC kraM Hair" },
        { "trait_type": "bear", "value": "None" },
        { "trait_type": "skin", "value": "Blue" },
        { "trait_type": "soul", "value": "nabuC kraM" },
      ],
      "external_url": "",
      "properties": {
        "files": [
          {
            "uri": `https://storage.mirrorworld.fun/nft/${tokenId}.png`,
            "type": "unknown"
          }
        ],
        "category": "image"
      },
      "animation_url": undefined,
    }

    watch(() => wallet.value?.connected, (val) => {
      console.log("Wallet connected", val)
    }, { immediate: true, deep: true })
  })

  setTimeout(async () => {
    console.log({userAccounts: await getUserAccounts(wallet.value.publicKey!)})
  }, 5000)
})

async function mint () {
  try {
    mintNFT(
      connection.value,
      wallet.value,
      DEVNET_ENDPOINT.name,
      files.value,
      metadata.value!,
      (val) => {
        console.log("Updtaed", val)
      },
      1,
      metadataUri.value,
      // Collection address
      "EMWv4qLVTLytXNheoWutoW1qFs6kP839GpZinK412GnS"
    )
    console.log(mintNFT)
  } catch (error) {
    console.error(error)
  }
}

</script>

<route lang="yaml">
meta:
  layout: dashboard
</route>
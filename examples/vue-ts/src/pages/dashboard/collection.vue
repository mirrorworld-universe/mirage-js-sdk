<template>
   <chakra.main p="10">
    <c-stack spacing="5">
      <c-heading>
        <c-icon color="emerald.500" name="box" size="0.8em" />
        Collection
      </c-heading>
      <c-text color="gray.500">Create collection</c-text>
      <c-divider color="gray.300"></c-divider>
      <chakra.section py="4" px="5" rounded="lg">
        <c-stack>
          <c-heading as="h3" size="md">Mintster</c-heading>
          <c-text>
            Mint new collection
          </c-text>
          <c-stack>
            <c-input v-model="collection.name" placeholder="Name" />
            <c-input v-model="collection.description" placeholder="Description" />
            <c-input v-model="collection.image" placeholder="Collection image" />
            <chakra.fieldset>
              <input type="checkbox" name="arrangeable" v-model="collection.arrangeable" />
              <chakra.label ml="3" for="arrangeable">Arrangeable</chakra.label>
            </chakra.fieldset>
            <chakra.fieldset>
              <input type="checkbox" name="removable" v-model="collection.removable" />
              <chakra.label ml="3" for="removable">Removable</chakra.label>
            </chakra.fieldset>
            <chakra.fieldset>
              <input type="checkbox" name="expandable" v-model="collection.expandable" />
              <chakra.label ml="3" for="expandable">Expandable</chakra.label>
            </chakra.fieldset>
            <c-input type="number" min="1" max="11000" v-model="collection.maxSize" placeholder="Max size"></c-input>
            <c-input type="file" @change="handleFileUpload" ref="file" accept="image/*" placeholder="File"></c-input>
          </c-stack>
          <c-button align-self="flex-start" size="lg" color-scheme="blue" @click="createCollection">
            Create collection
          </c-button>
          <br />
          <chakra.pre white-space="pre-wrap" max-h="500px" overflow-y="scroll">
            {{ collection }}
          </chakra.pre>
        </c-stack>
        <br />
        <c-stack>
          <c-heading as="h4">Add NFT to collection</c-heading>
          <c-input v-model="collectionAddress" placeholder="Collection address" />
          <c-input v-model="mintAddress" placeholder="Mint address" />
          <c-button align-self="flex-start" size="md" @click="addNftToCollection">
            Add to collection
          </c-button>
          <c-button @click="addAuthority">
            Add Jozhe as Authority
          </c-button>
        </c-stack>
      </chakra.section>
    </c-stack>
  </chakra.main>
</template>

<script lang="ts" setup>
import { chakra } from "@chakra-ui/vue-next"
import { onMounted, reactive, ref, watch, watchEffect } from 'vue';
// import { CollectionPayload, mintCollection } from "@mirrorworld/mirage.core"
import { ENDPOINTS } from "@mirrorworld/mirage.utils"
import { useConnection, useWallet } from '@axiajs/solana.vue'
import { getUserAccounts, sendTransactionWithRetry, toPublicKey } from '@axiajs/solana.core'
import { mintCollection, getCollections, addMintToCollection, getCollectionsByCreator, appendAddAuthorityInstruction } from '@mirrorworld/mirage.core';
import type { CollectionPayload } from '@mirrorworld/mirage.core';
import { Transaction } from '@solana/web3.js';
import { Connection, programs } from '@metaplex/js';

const {
  metadata: { Metadata }
} = programs

function randomIntFromInterval(min: number, max: number) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min)
}

const tokenId = randomIntFromInterval(1, 11000)
console.log({ tokenId })

const metadataUri = ref(`https://mirror-api.mirrorworld.fun/api/v1/metadata/${tokenId}`)

const { wallet } = useWallet()

const DEVNET_ENDPOINT = ENDPOINTS[2]

const collection = reactive<Partial<CollectionPayload>>({
  name: "",
  description: "",
  image: '',
  removable: true,
  arrangeable: true,
  expandable: true,
  members: [],
  memberOf: [],
})

const { connection } = useConnection()

const files = ref<File[]>([])
const file = ref()

const mintAddress = ref("")
// Has authority 
const collectionAddress = ref("EMWv4qLVTLytXNheoWutoW1qFs6kP839GpZinK412GnS")

watchEffect(() => {
  console.log("Connection injected here", connection.value)
})

function handleFileUpload(e: any) {
  const [file] = e?.target.files
  if (!file) return

  files.value.push(file)
  console.log("Files", files.value)
}

onMounted(async() => {
  setTimeout(async() => {
    // @ts-ignore
    window.$phantomWallet = wallet.value
    await wallet.value?.connect()


    watch(() => wallet.value?.connected, (val) => {
      console.log("Wallet connected", val)
    }, { immediate: true, deep: true })
  }, 2000)

  setTimeout(async () => {
    console.log({userAccounts: await getUserAccounts(wallet.value.publicKey!)})
  }, 5000)
})

onMounted(async () => {
  const nftsmetadata = await Metadata.findDataByOwner(
    connection.value,
    toPublicKey("FF8cwakwRfk5i7QTyGJ15Q88DSboEgEmJFWN4YPabM6G")
  );
  console.log("nftsmetadata", nftsmetadata)
})

async function createCollection () {
  try {
    const res = await mintCollection(
      connection.value,
      wallet.value,
      collection,
      wallet.value.publicKey?.toBase58()!,
      files.value[0],
      DEVNET_ENDPOINT.name,
    )
    console.log("COLLECTION", res)
  } catch (error) {
    console.error(error)
  }
}

async function addNftToCollection() {
  const response = await addMintToCollection(
    connection.value,
    wallet.value,
    mintAddress.value,
    collectionAddress.value
  )

  console.log(`Added mintKey "${mintAddress.value}" to collection "${collectionAddress.value}"`, response)
  alert("Success \n" + JSON.stringify(response, null, 2))
}

onMounted(() => {
  setTimeout(async () => {
    const collections = await getCollections(connection.value)
    
    console.log({
      collections
    })


    const myCollections = await getCollectionsByCreator(connection.value, wallet.value.publicKey?.toBase58()!)
    console.log("myCollections =>", myCollections)
  }, 1000)
})


async function addAuthority() {
  const transaction = new Transaction()
  await appendAddAuthorityInstruction(
    wallet.value,
    toPublicKey(collectionAddress.value),
    toPublicKey("3edkaPFWhVcWbvLpPoC6MMhea81qWF9seY2BqidxfyXp"),
    transaction.instructions
  )

  try {
    await sendTransactionWithRetry(
      connection.value,
      wallet.value,
      transaction.instructions,
      [],
      'single'
    )
  } catch (error) {
    
  }
}
</script>

<route lang="yaml">
meta:
  layout: dashboard
</route>
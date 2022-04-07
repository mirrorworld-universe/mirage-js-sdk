<template>
  <chakra.section>
    <template v-if="isLoadingNfts">
      <c-center py="100px">
        <c-spinner />
      </c-center>
    </template>
    <template v-else>
      <c-grid v-if="nfts?.length" gap="4" :template-columns="['1fr', '1fr', 'repeat(4, auto)']">
        <RouterLink v-for="(nft, i) in nfts" :key="`nft-i-${i}`" custom :to="`/nft/${nft.mint}`" v-slot="{ navigate }">
          <chakra.div
            rounded="lg"
            overflow="hidden"
            backdrop-filter="blur(5px)"
            border-width="1px"
            border-style="solid"
            border-color="whiteAlpha.500"
          >
            <c-aspect-ratio @click="navigate" cursor="pointer" :ratio="1" :min-w="['full', 'full', '250px']">
              <!-- <chakra.img :src="nft.metadata?.image" /> -->
              <chakra.div h="full" :bg="`url(${nft.metadata?.image})`" bg-size="cover" />
            </c-aspect-ratio>
            <c-stack px="4" py="3">
              <c-text font-weight="normal" color="whiteAlpha.600">
                {{ nft.data.symbol }}
              </c-text>
              <c-h-stack justify="space-between" align="center">
                <c-heading as="h3" size="md">{{ nft.data.name }}</c-heading>
                <c-icon-button variant="ghost" size="sm" icon="link-2" aria-label="View in explorer" as="a" target="_blank" :href="`https://explorer.solana.com/address/${nft.mint}?cluster=${'devnet'}`" rounded="full" />
              </c-h-stack>
            </c-stack>
          </chakra.div>
        </RouterLink>
      </c-grid>
      <template v-else>
        <m-empty-list icon="box" message="So much empty." />
      </template>
    </template>
  </chakra.section>
</template>

<script lang="ts" setup>
import { chakra } from "@chakra-ui/vue-next"
import { RouterLink, useRoute } from 'vue-router'
import { onMounted } from 'vue';
import { ref } from 'vue';
import { MetadataJson } from '@metaplex/js';
import { useMirage } from '../composables/use-mirage';
import { PublicKey } from '@solana/web3.js';
import { computed } from 'vue';
import { watch } from 'vue';

const props = defineProps<{
  publicKey: string
}>()

const nfts = ref()
const mirage = useMirage()

const isLoadingNfts = ref(false)
const route = useRoute()
const address = computed(() => props.publicKey || route.params.address as string)

async function fetchNfts(_address: string) {
  try {
    /**
     * User NFTs should techincally be coming from the back end.
     * However, incasr they aren't available, mirage has a fallback
     * it provides to query the user's NFTs on the client. This however will not scale well.
     */
    isLoadingNfts.value = true
    nfts.value = await Promise.all((await mirage.value!.getUserNfts(new PublicKey(_address))).map(async (token) => {
      const metadata = await fetch(token.data.uri).then(res => res.json()) as MetadataJson
      return {
        ...token,
        metadata
      }
    }))
    isLoadingNfts.value = false
  } catch (error) {
    console.error("Error fetching NFTS", error)
  }
}

watch(address, async (newAddress) => {
  if (newAddress) {
    await fetchNfts(newAddress)
  }
})

onMounted(() => {
  setTimeout(async () => {
    console.log("mirage.value", mirage.value)
    await fetchNfts(address.value)
  }, 2000)
})
</script>
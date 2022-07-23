<template>
  <chakra.main :p="[10, 10, 50]" color="white" font-weight="regular" min-h="100vh">
    <c-container max-w="1200">
      <c-v-stack spacing="8" align-items="flex-start">
        <c-h-stack align-items="center" justify-content="space-between" w="full">
          <c-h-stack align-items="center">
            <c-heading size="3xl" color="white"> Mirage JS SDK Demo </c-heading>
            <c-code font-size="3xl"> v{{ version }} </c-code>
          </c-h-stack>
          <c-h-stack spacing="4">
            <c-icon-button
              as="a"
              rounded="full"
              size="lg"
              target="_blank"
              href="https://github.com/mirrorworld-universe/mirage-js-sdk#readme"
              icon="book"
              aria-label="documentation"
            />
            <c-icon-button
              as="a"
              rounded="full"
              size="lg"
              target="_blank"
              href="https://github.com/mirrorworld-universe/mirage-js-sdk"
              icon="github"
              aria-label="github"
            />
            <c-icon-button
              as="a"
              rounded="full"
              size="lg"
              target="_blank"
              href="https://github.com/mirrorworld-universe/mirage-js-sdk/tree/main/examples/dapp"
              icon="code"
              aria-label="source code"
            />
          </c-h-stack>
        </c-h-stack>
        <c-stack px="6" py="4" backdrop-filter="blur(5px)" border-width="1px" border-style="solid" border-color="whiteAlpha.500">
          <c-text> MirrorWorld Marketplace JS SDK. Used to manage the following: </c-text>
          <c-list spacing="2">
            <c-list-item>
              <c-list-icon name="check" />
              List NFT
            </c-list-item>
            <c-list-item>
              <c-list-icon name="check" />
              Buy Buy
            </c-list-item>
            <c-list-item>
              <c-list-icon name="check" />
              Cancel Listing
            </c-list-item>
            <c-list-item>
              <c-list-icon name="check" />
              NFT
            </c-list-item>
          </c-list>
          <c-button as="a" href="https://github.com/mirrorworld-universe/mirage-js-sdk" target="_blank" left-icon="book" size="lg">Documentation</c-button>
        </c-stack>
        <template v-if="!pk">
          <c-center>
            <c-button @click="handleConnectWallet"> Connect Wallet </c-button>
          </c-center>
        </template>
        <template v-else>
          <c-stack w="full">
            <c-h-stack align-items="center" justify-content="space-between">
              <c-heading as="h2" size="xl"> Your NFTs </c-heading>
              <c-button color-scheme="yellow" left-icon="star" size="lg" @click="mintNewNFT">Claim New NFT</c-button>
            </c-h-stack>
            <c-h-stack align-items="center">
              <m-identicon :address="pk" width="30" />
              <c-text line-height="1.2" no-of-lines="1" is-truncated max-w="90vw">{{ pk }}</c-text>
            </c-h-stack>
            <m-nfts w="full" :public-key="pk" />
          </c-stack>
        </template>
      </c-v-stack>
    </c-container>

    <!-- 
      Minting NFT Modal
     -->
    <c-modal v-model="isMintingModal">
      <c-modal-overlay />
      <c-modal-content>
        <c-modal-header>Minting New NFT</c-modal-header>
        <c-modal-close-button />
        <c-modal-body>
          <template v-if="newNFT">
            <chakra.div
              rounded="lg"
              overflow="hidden"
              backdrop-filter="blur(5px)"
              border-width="1px"
              border-style="solid"
              border-color="whiteAlpha.500"
              cursor="pointer"
              max-w="350px"
            >
              <span>
                <c-aspect-ratio :ratio="1" :min-w="['full', 'full', '250px']">
                  <!-- <chakra.img :src="nft.metadata?.image" /> -->
                  <chakra.div h="full" :bg="`url(${newNFT?.metadata?.image})`" bg-size="cover" />
                </c-aspect-ratio>
                <c-stack px="4" py="3">
                  <c-text font-weight="normal" color="whiteAlpha.600">
                    {{ newNFT?.data?.data.symbol }}
                  </c-text>
                  <c-h-stack justify="space-between" align="center">
                    <c-heading as="h3" size="md">{{ newNFT?.data?.data.name }}</c-heading>
                    <c-icon-button
                      variant="ghost"
                      size="sm"
                      icon="link-2"
                      aria-label="View in explorer"
                      as="a"
                      target="_blank"
                      :href="`https://explorer.solana.com/address/${newNFT.data.mint}?cluster=${'devnet'}`"
                      rounded="full"
                    />
                  </c-h-stack>
                </c-stack>
              </span>
            </chakra.div>
          </template>
          <template v-else-if="isMinting">
            Minting new NFT
            <c-animate-presence>
              <chakra.span
                backdrop-filter="blur(2px)"
                position="absolute"
                top="0"
                right="0"
                bottom="0"
                left="0"
                z-index="10"
                bg="blackAlpha.400"
                d="flex"
                justify-content="center"
                align-items="center"
              >
                <c-center box-size="50px" bg="whiteAlpha.200" rounded="md" shadow="lg">
                  <c-stack>
                    <c-spinner />
                  </c-stack>
                </c-center>
              </chakra.span>
            </c-animate-presence>
          </template>
        </c-modal-body>
        <c-modal-footer>
          <c-h-stack v-if="newNFT" justify-content="flex-end">
            <c-button as="a" size="lg" :href="`https://explorer.solana.com/address/${newNFT?.data.mint}?cluster=${'devnet'}`"> View in explorer </c-button>
            <c-button
              @click="
                () => {
                  isMintingModal = false;
                  router.push(`/nft/${newNFT?.data.mint}`);
                }
              "
              size="lg"
              color-scheme="yellow"
            >
              Go to trade
            </c-button>
          </c-h-stack>
        </c-modal-footer>
      </c-modal-content>
    </c-modal>
  </chakra.main>
</template>

<script lang="ts" setup>
import { chakra } from '@chakra-ui/vue-next';
import { useWallet } from '@axiajs/solana.vue';
import { useMirage } from '../composables/use-mirage';
import { computed, ref } from 'vue';
import { version } from '../../../../packages/core/package.json';
import { generateRandomNFTMetadata } from '../utils/generators';
import { sleep, toPublicKey } from '@axiajs/solana.utils';
import { MetadataJson } from '@metaplex/js';
import { useRouter } from 'vue-router';

const { wallet } = useWallet();
// const pk = ref()
const mirage = useMirage();

const isMintingModal = ref(false);
const isMinting = ref(false);
const router = useRouter();

async function handleConnectWallet() {
  await wallet.value?.connect?.();
}

const newNFT = ref();

const mintNewNFT = async () => {
  if (!mirage.value) {
    alert('Mirage not yet ready. lease try in 2 seconds');
  }
  isMintingModal.value = true;
  isMinting.value = true;
  try {
    const metadata = generateRandomNFTMetadata(mirage.value?.wallet?.publicKey?.toBase58());
    const mint = await mirage.value.mintNft(metadata);
    /** Here we're waiting a little because the NFT metadata may not have been loaded to IPFS as yet */
    await sleep(3000);
    newNFT.value = await mirage.value.getNft(toPublicKey(mint.data.mint)).then(async (nft) => {
      return {
        ...nft,
        metadata: (await fetch(nft.data.data.uri).then((res) => res.json())) as MetadataJson,
      };
    })!;
    isMinting.value = false;
  } catch (error) {
    console.error('Error minting new NFT', error);
    alert(error);
    isMinting.value = false;
  }
};

const pk = computed(() => mirage.value?.wallet?.publicKey?.toBase58());
</script>

<route lang="yaml">
meta:
  layout: default
</route>

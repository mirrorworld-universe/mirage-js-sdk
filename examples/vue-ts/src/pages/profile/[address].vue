<template>
  <chakra.main :p="[10, 10, 50]" color="white" font-weight="regular" min-h="100vh">
    <c-container max-w="1200">
      <c-stack spacing="8">
        <c-button align-self="flex-start" left-icon="arrow-left" :mb="[10, 10, 10]" as="router-link" to="/"> Home </c-button>
        <c-h-stack align-items="center">
          <m-identicon :address="profileAddress" width="50" />
          <c-heading as="h1" line-height="1.2" no-of-lines="1" is-truncated max-w="90vw" size="xl">{{ profileAddress }}</c-heading>
        </c-h-stack>
        <c-stack spacing="5">
          <c-heading as="h3" line-height="1.2" size="md">User Nfts</c-heading>
          <m-nfts :pk="profileAddress" />
        </c-stack>
      </c-stack>
    </c-container>

    <!-- 
      Selling Modal
     -->
    <c-modal v-model="isSellingModal">
      <c-modal-overlay />
      <c-modal-content>
        <c-modal-header>Sell</c-modal-header>
        <c-modal-close-button data-testid="close-button" />
        <c-modal-body>
          <c-stack spacing="5">
            <chakra.p> Enter listing price </chakra.p>
            <chakra.div>
              <c-text as="label" font-size="sm" font-weight="bold" for="listing_price" mb="1"> Listing price </c-text>
              <c-input-group>
                <c-input-right-addon rounded-left="md" rounded-right="0"> ◎ </c-input-right-addon>
                <c-input isRequired name="listing_price" type="number" v-model="listingPrice" placeholder="0.5" />
              </c-input-group>
            </chakra.div>
          </c-stack>
        </c-modal-body>

        <c-modal-footer>
          <c-button @click="listNft" mr="3" :left-icon="listingState.icon" :is-loading="listingState.isLoading"> {{ listingState.text }} </c-button>
        </c-modal-footer>
      </c-modal-content>
    </c-modal>

    <!-- 
      Gifting Modal
     -->
    <c-modal v-model="isGiftingModal">
      <c-modal-overlay />
      <c-modal-content>
        <c-modal-header>Gift NFT</c-modal-header>
        <c-modal-close-button data-testid="close-button" />
        <c-modal-body>
          <c-stack spacing="5">
            <chakra.p> Gift NFT to another address </chakra.p>
            <chakra.div>
              <c-text as="label" font-size="sm" font-weight="bold" for="gifting_address" mb="1"> Recipient address </c-text>
              <c-input isRequired name="gifting_address" type="text" v-model="giftToAddress" placeholder="Address" />
            </chakra.div>
          </c-stack>
        </c-modal-body>

        <c-modal-footer>
          <c-button @click="giftNFT" :is-loading="isLoadingGiftNft" mr="3"> Gift NFT </c-button>
        </c-modal-footer>
      </c-modal-content>
    </c-modal>
  </chakra.main>
</template>

<script lang="ts" setup>
import { chakra } from '@chakra-ui/vue-next';
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import { useMirage } from '../../composables/use-mirage';
import { watchEffect } from 'vue';
import { ref } from 'vue';
import type { MetadataJson } from '@metaplex/js';
import { PublicKey } from '@solana/web3.js';
import { sleep } from '@axiajs/solana.utils';
import type { AccountInfo } from '@solana/spl-token';
import { Creator } from '@mirrorworld/mirage.core';
import type { TransactionReceipt } from '@mirrorworld/mirage.core';
import { useWallet } from '@axiajs/solana.vue';
import MIdenticon from '../../components/m-identicon.vue';
// @ts-ignore
import truncateMiddle from 'truncate-middle';
import TimeAgo from 'javascript-time-ago';

// English.
import en from 'javascript-time-ago/locale/en.json';
import { useHead } from '@vueuse/head';
import { reactive } from 'vue';
import MEmptyList from '../../components/m-empty-list.vue';
import MNfts from '../../components/m-nfts.vue';

TimeAgo.addDefaultLocale(en);

const timeAgo = new TimeAgo('en-US');

const isSellingModal = ref(false);
const isGiftingModal = ref(false);
const listingPrice = ref();
const giftToAddress = ref();

const route = useRoute();
const profileAddress = computed(() => route.params?.address as string);
const mirage = useMirage();

const nftOwner = ref<string>();
const nft = ref<{
  metadata: MetadataJson;
  pubkey: PublicKey;
  info: AccountInfo;
  data: {
    data: MetadataJson;
    creators: Creator[];
  };
}>();
let isLoaded = false;

useHead({
  title: computed(() => nft.value?.data.data.name || `Mirror ${truncateMiddle(profileAddress.value, 3, 3, '...')}`),
});

const { wallet } = useWallet();
const transactions = ref<TransactionReceipt[]>();

const userIsOwner = computed(() => nftOwner.value === wallet.value.publicKey?.toBase58());
const creators = computed(() => nft.value?.data.data.creators.map((c) => ({ ...c, address: c.address.toString() })));

const tokenIsOnSale = computed(() => transactions.value?.find((receipt) => receipt.receipt_type === 'listing_receipt' && !receipt.purchaseReceipt));

const isLoadingSell = ref(false);
const isLoadingBuy = ref(false);

function capitalize(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function buyNft() {
  if (!tokenIsOnSale.value) return;
  isLoadingBuy.value = true;
  try {
    console.log('Buying NFT', [profileAddress.value, tokenIsOnSale.value.price]);
    await mirage.value.buyToken(profileAddress.value, tokenIsOnSale.value.price);
    await loadPageData();
  } catch (e) {
    console.error('Error buying token', e);
  } finally {
    isLoadingBuy.value = false;
  }
}

const listingState = reactive({
  icon: 'dollar-sign',
  text: 'Complete Listing',
  isLoading: false,
  colorScheme: 'gray',
});

async function listNft() {
  listingState.isLoading = true;
  try {
    console.log('[profileAddress.value, listingPrice.value]', [profileAddress.value, listingPrice.value]);
    await mirage.value.listToken(profileAddress.value, listingPrice.value);
    listingState.icon = 'check-circle';
    listingState.colorScheme = 'green';
    listingState.text = 'Success!';
    listingState.isLoading = false;
    await loadPageData();
  } catch (e) {
    console.error('Error listing token', e);
  } finally {
    Object.assign(listingState, {
      icon: 'dollar-sign',
      text: 'Complete Listing',
      isLoading: false,
      colorScheme: 'gray',
    });
    await sleep(2000);
    isSellingModal.value = false;
  }
}

const isLoadingCancelList = ref(false);
async function cancelListing() {
  if (!tokenIsOnSale.value) return;
  isLoadingCancelList.value = true;
  try {
    console.log('Listing token', [profileAddress.value, tokenIsOnSale.value!.price]);
    await mirage.value.cancelListing(profileAddress.value, tokenIsOnSale.value!.price);
    await loadPageData();
  } catch (e) {
    console.error('Error listing token', e);
    alert(e);
  } finally {
    isLoadingCancelList.value = false;
  }
}

const isLoadingGiftNft = ref(false);
async function giftNFT() {
  if (!userIsOwner.value) return;
  if (!PublicKey.isOnCurve(giftToAddress.value)) {
    alert('Invalid public key for recipient. Please check it and try again');
    return;
  }
  try {
    isLoadingGiftNft.value = true;
    console.log('Transferring token', [profileAddress.value, 'to', giftToAddress.value]);
    await mirage.value.transferNft(profileAddress.value, giftToAddress.value);
    await loadPageData();
  } catch (e) {
    console.error('Error transferring token', e);
    alert(e);
  } finally {
    isLoadingGiftNft.value = false;
  }
}

async function loadPageData() {
  console.log('Mirage', mirage.value);
  if (mirage.value) {
    const [owner, _, account] = await mirage.value.getNftOwner(profileAddress.value);
    nftOwner.value = owner;
    nft.value = await mirage.value.getNft((account as any).parsed.info.mint).then(async (nft) => {
      return {
        ...nft,
        metadata: (await fetch(nft.data.data.uri).then((res) => res.json())) as MetadataJson,
      };
    })!;
    transactions.value = (await mirage.value.getTokenTransactions(profileAddress.value)) as any as TransactionReceipt[];
    isLoaded = true;
  }
}

watchEffect(async () => {
  console.log('Mirage', mirage.value);
  if (mirage.value && !isLoaded) {
    await loadPageData();
    isLoaded = true;
  }
});
</script>

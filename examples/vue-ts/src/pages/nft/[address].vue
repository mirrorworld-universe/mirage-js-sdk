<template>
  <chakra.main :p="[10, 10, 50]" color="white" font-weight="regular" min-h="100vh">
    <c-container max-w="1200">
      <c-button left-icon="arrow-left" :mb="[10, 10, 10]" as="router-link" to="/"> Home </c-button>
      <template v-if="nft">
        <c-grid :template-columns="['1fr', '1fr', '1fr 1.5fr']" gap="8" align-items="flex-start">
          <c-stack spacing="8">
            <c-aspect-ratio
              :ratio="1"
              :min-w="['full', 'full', '250px']"
              rounded="lg"
              overflow="hidden"
              backdrop-filter="blur(5px)"
              border-width="1px"
              border-style="solid"
              border-color="whiteAlpha.500"
              h="full"
              bg-size="cover"
            >
              <chakra.img :src="nft.metadata?.image" :alt="nft.name" w="100%"></chakra.img>
            </c-aspect-ratio>
            <c-stack>
              <c-h-stack align-items="center">
                <c-icon name="box" />
                <c-heading as="h3" size="md">Attributes</c-heading>
              </c-h-stack>
              <c-grid :template-columns="['1fr 1fr', '1fr 1fr', '1fr 1fr 1fr']" gap="3">
                <c-stack
                  v-for="(attr, i) in nft.metadata.attributes"
                  :key="`attribute-${i}`"
                  bg="whiteAlpha.50"
                  rounded="md"
                  backdrop-filter="blur(5px)"
                  border-style="solid"
                  border-color="whiteAlpha.500"
                  border-width="1px"
                  spacing="1"
                  px="4"
                  py="2"
                  align-items="flex-start"
                >
                  <c-text font-weight="bold" font-size="md">
                    {{ capitalize(attr.trait_type) }}
                  </c-text>
                  <c-text font-weight="regular" font-size="sm">
                    {{ attr.value }}
                  </c-text>
                </c-stack>
              </c-grid>
            </c-stack>
          </c-stack>
          <c-stack spacing="8">
            <c-heading>
              {{ nft.name }}
            </c-heading>
            <c-text>
              Owned by
              <c-link as="router-link" text-decor="underline" color="purple.100" :to="`/profile/${nftOwner}`">{{
                nftOwner === wallet.publicKey?.toBase58() ? 'You' : truncateMiddle(nftOwner, 4, 4, '...')
              }}</c-link>
            </c-text>
            <c-text>
              {{ nft.metadata.description }}
            </c-text>
            <c-stack>
              <template v-if="userIsOwner">
                <c-h-stack>
                  <template v-if="!tokenIsOnSale">
                    <c-button
                      size="lg"
                      color-scheme="purple"
                      left-icon="dollar-sign"
                      @click="
                        () => {
                          isGiftingModal = false;
                          isSellingModal = true;
                        }
                      "
                    >
                      List
                    </c-button>
                  </template>
                  <template v-else>
                    <c-button size="lg" left-icon="x" :is-loading="isLoadingCancelList" :is-disabled="isLoadingCancelList" @click="cancelListing">
                      Cancel listing
                    </c-button>
                  </template>
                  <c-button
                    size="lg"
                    left-icon="gift"
                    variant="outline"
                    @click="
                      () => {
                        isSellingModal = false;
                        isGiftingModal = true;
                      }
                    "
                  >
                    Gift
                  </c-button>
                </c-h-stack>
              </template>
              <template v-else-if="userIsOwner && tokenIsOnSale">
                <c-button size="lg" left-icon="gift" variant="outline" @click="cancelListing"> Gift </c-button>
              </template>
              <template v-else>
                <c-button :is-disabled="!tokenIsOnSale" @click="buyNft"> Buy Now </c-button>
              </template>
            </c-stack>
            <c-stack>
              <c-h-stack align-items="center">
                <c-icon name="image" />
                <c-heading as="h3" size="md">Creators</c-heading>
              </c-h-stack>
              <c-h-stack align-items="center" v-for="creator in creators">
                <m-identicon :address="creator.address" width="30" />
                <c-text>{{ truncateMiddle(creator.address, 4, 4, '...') }}</c-text>
                <c-text>{{ creator.share }}%</c-text>
              </c-h-stack>
            </c-stack>
            <c-stack>
              <c-h-stack align-items="center">
                <c-icon name="activity" />
                <c-heading as="h3" size="md">Trading activity</c-heading>
              </c-h-stack>
              <template v-if="transactions?.length">
                <c-stack spacing="2">
                  <c-h-stack v-for="receipt in transactions" :key="`receipt-${i}`" w="full" justify-content="space-between">
                    <c-h-stack>
                      <m-identicon width="25" :address="receipt.bookkeeper.toBase58()" />
                      <c-stack>
                        <c-text>
                          <c-link as="router-link" text-decor="underline" color="purple.300" :to="`/profile/${nftOwner}`">{{
                            receipt.bookkeeper.toBase58() === wallet.publicKey?.toBase58()
                              ? 'You'
                              : truncateMiddle(receipt.bookkeeper.toBase58(), 4, 4, '. . .')
                          }}</c-link>
                        </c-text>
                        <c-h-stack font-size="0.7em" align-content="center" color="whiteAlpha.600">
                          <c-icon name="clock"></c-icon>
                          <c-text>{{ timeAgo.format(receipt.createdAt) }}</c-text>
                        </c-h-stack>
                      </c-stack>
                    </c-h-stack>
                    <c-text
                      >{{
                        receipt.receipt_type === 'listing_receipt'
                          ? 'Listed for'
                          : receipt.receipt_type === 'bid_receipt'
                          ? 'Offered'
                          : receipt.receipt_type === 'purchase_receipt'
                          ? 'Purchased for'
                          : 'Cancel listing'
                      }}
                    </c-text>
                    <c-text ml="auto">◎ {{ receipt.price }}</c-text>
                  </c-h-stack>
                </c-stack>
              </template>
              <template v-else>
                <m-empty-list color="whiteAlpha.600" icon="box" message="No transaction history." />
              </template>
            </c-stack>
          </c-stack>
        </c-grid>
      </template>
      <template v-else>
        <c-center>
          <c-spinner />
        </c-center>
      </template>
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

TimeAgo.addDefaultLocale(en);

const timeAgo = new TimeAgo('en-US');

const isSellingModal = ref(false);
const isGiftingModal = ref(false);
const listingPrice = ref();
const giftToAddress = ref();

const route = useRoute();
const tokenAddress = computed(() => route.params?.address as string);
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
  title: computed(() => nft.value?.name || `Mirror ${truncateMiddle(tokenAddress.value, 3, 3, '...')}`),
});

const { wallet } = useWallet();
const transactions = ref<TransactionReceipt[]>();

const userIsOwner = computed(() => nftOwner.value === wallet.value.publicKey?.toBase58());
const creators = computed(() => nft.value?.creators.map((c) => ({ ...c, address: c.address.toString() })));

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
    console.log('Buying NFT', [tokenAddress.value, tokenIsOnSale.value.price]);
    await mirage.value.buyToken(tokenAddress.value, tokenIsOnSale.value.price);
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
    console.log('[tokenAddress.value, listingPrice.value]', [tokenAddress.value, listingPrice.value]);
    await mirage.value.listToken(tokenAddress.value, listingPrice.value);
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
    console.log('Listing token', [tokenAddress.value, tokenIsOnSale.value!.price]);
    await mirage.value.cancelListing(tokenAddress.value, tokenIsOnSale.value!.price);
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
    console.log('Transferring token', [tokenAddress.value, 'to', giftToAddress.value]);
    await mirage.value.transferNft(tokenAddress.value, giftToAddress.value);
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
    const [owner, _, account] = await mirage.value.getNftOwner(tokenAddress.value);
    nftOwner.value = owner;
    nft.value = await mirage.value.getNft((account as any).parsed.info.mint).then(async (nft) => {
      return {
        ...nft,
        metadata: (await fetch(nft.uri).then((res) => res.json())) as MetadataJson,
      };
    })!;
    transactions.value = (await mirage.value.getTokenTransactions(tokenAddress.value)) as any as TransactionReceipt[];
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

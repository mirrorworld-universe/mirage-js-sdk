<template>
  <div ref="identicon"></div>
</template>

<script lang="ts" setup>
import { nextTick, ref, useAttrs } from 'vue';
// @ts-ignore
import Jazzicon from '@metamask/jazzicon';
import bs58 from 'bs58';
import { onMounted } from 'vue';
const props = defineProps<{
  address: string;
}>();

const identicon = ref();

const attrs = useAttrs();

onMounted(async () => {
  await nextTick();
  identicon.value?.appendChild(Jazzicon(attrs.width || 50, parseInt(bs58.decode(props.address).toString('hex').slice(5, 15), 16)));
});
</script>

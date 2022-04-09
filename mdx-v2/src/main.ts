import { createApp } from 'vue';
import App from './App.vue';
import { Keypair } from '@solana/web3.js';
import { Mirage } from '@mirrorworld/mirage.core';

createApp(App).mount('#app');

console.log(Keypair.generate().publicKey);
const mirage = Mirage;
console.log({ mirage });

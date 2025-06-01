import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useAuthStore } from '@/stores/authStore';

import App from './App.vue';
import router from '@/router';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';

import './services/firestore';
import './style.css';
import './tailwind.css';

import filters from '@/plugins/filters';

const pinia = createPinia();

pinia.use(piniaPluginPersistedstate);

const app = createApp(App);

app.use(pinia);
app.use(filters);
app.use(router);

const authStore = useAuthStore();
authStore.setUserFromAuth(); 

app.mount('#app');

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="product">
      <img :src="product.images[0]" />
      <div>
        <img v-for="(img, i) in product.images" :key="i" :src="img" @click="current = i" />
      </div>
      <h1>{{ product.name }}</h1>
      <p>{{ 'R$ ' + product.price.toFixed(2).replace('.', ',') }}</p>
      <p v-if="product.stock > 0 && product.stock < 5">Only {{ product.stock }} left!</p>
      <button :disabled="product.stock === 0" @click="add">Add to cart</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const product = ref(null)
const loading = ref(true)
const current = ref(0)

onMounted(async () => {
  const r = await axios.get('/api/products/' + route.params.id)
  product.value = r.data
  loading.value = false
})

function add() {
  cart.add(product.value)
  router.push('/cart')
}
</script>

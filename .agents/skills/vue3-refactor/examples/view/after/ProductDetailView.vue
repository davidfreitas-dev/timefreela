<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useProductDetail } from '@/composables/useProductDetail'
import ProductGallery from '@/components/ProductGallery.vue'
import ProductSummary from '@/components/ProductSummary.vue'
import type { Product } from '@/types'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const productId = computed(() => Number(route.params.id))
const { product, isLoading, hasError } = useProductDetail(productId)

function handleAddToCart(item: Product) {
  cart.add(item)
  router.push({ name: 'cart' })
}
</script>

<template>
  <p v-if="isLoading">Loading...</p>
  <p v-else-if="hasError">Could not load the product.</p>
  <p v-else-if="!product">Product not found.</p>
  <template v-else>
    <ProductGallery :images="product.images" />
    <ProductSummary :product="product" @add-to-cart="handleAddToCart" />
  </template>
</template>

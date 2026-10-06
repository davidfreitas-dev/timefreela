<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from '@/utils/formatCurrency'
import type { Product } from '@/types'

const props = defineProps<{ product: Product }>()
const emit = defineEmits<{ addToCart: [product: Product] }>()

const formattedPrice = computed(() => formatCurrency(props.product.price))
const isOutOfStock = computed(() => props.product.stock === 0)
const isLowStock = computed(() => props.product.stock > 0 && props.product.stock < 5)
</script>

<template>
  <section>
    <h1>{{ product.name }}</h1>
    <p>{{ formattedPrice }}</p>
    <p v-if="isLowStock">Only {{ product.stock }} left!</p>
    <button :disabled="isOutOfStock" @click="emit('addToCart', product)">Add to cart</button>
  </section>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import { useProductList } from '@/composables/useProductList'
import { formatCurrency } from '@/utils/formatCurrency'
import type { Product } from '@/types'

const props = defineProps<{ categoryId: number }>()
const emit = defineEmits<{ select: [product: Product] }>()

const { search, availableProducts, isLoading, hasError } = useProductList(
  toRef(props, 'categoryId')
)

function handleSelect(product: Product) {
  emit('select', product)
}
</script>

<template>
  <div>
    <input v-model="search" placeholder="Search" />
    <p v-if="isLoading">Loading...</p>
    <p v-else-if="hasError">Could not load products.</p>
    <p v-else-if="!availableProducts.length">No products found.</p>
    <ul v-else>
      <li v-for="product in availableProducts" :key="product.id" @click="handleSelect(product)">
        {{ product.name }} - {{ formatCurrency(product.price) }}
      </li>
    </ul>
  </div>
</template>

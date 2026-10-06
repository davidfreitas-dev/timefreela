import { ref, computed, watch, type Ref } from 'vue'
import { fetchProductsByCategory } from '@/services/productService'
import type { Product } from '@/types'

export function useProductList(categoryId: Ref<number>) {
  const products = ref<Product[]>([])
  const search = ref('')
  const isLoading = ref(false)
  const hasError = ref(false)

  const availableProducts = computed(() => {
    const term = search.value.toLowerCase()
    return products.value.filter(
      p => p.stock > 0 && p.name.toLowerCase().includes(term)
    )
  })

  async function load() {
    isLoading.value = true
    hasError.value = false
    try {
      products.value = await fetchProductsByCategory(categoryId.value)
    } catch {
      hasError.value = true
    } finally {
      isLoading.value = false
    }
  }

  watch(categoryId, load, { immediate: true })

  return { search, availableProducts, isLoading, hasError }
}

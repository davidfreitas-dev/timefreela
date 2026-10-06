import { ref, watch, onWatcherCleanup, type Ref } from 'vue'
import { fetchProductById } from '@/services/productService'
import type { Product } from '@/types'

export function useProductDetail(productId: Ref<number>) {
  const product = ref<Product | null>(null)
  const isLoading = ref(false)
  const hasError = ref(false)

  async function load(id: number, signal: AbortSignal) {
    isLoading.value = true
    hasError.value = false
    try {
      product.value = await fetchProductById(id, signal)
    } catch (error) {
      if (!signal.aborted) hasError.value = true
    } finally {
      if (!signal.aborted) isLoading.value = false
    }
  }

  watch(
    productId,
    (id) => {
      const controller = new AbortController()
      onWatcherCleanup(() => controller.abort())
      load(id, controller.signal)
    },
    { immediate: true }
  )

  return { product, isLoading, hasError }
}

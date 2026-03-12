import { ref } from 'vue';
import { useToast } from './useToast';

export function useLoading() {
  const isLoading = ref(false);
  const { showToast } = useToast();

  const withLoading = async <T>(fn: () => Promise<T>, fallbackMessage = 'Ocorreu um erro ao processar a requisição.') => {
    isLoading.value = true;
    try {
      return await fn();
    } catch (error: unknown) {
      console.error(error);
      const err = error as Error;
      showToast('error', err.message || fallbackMessage);
      return undefined;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    withLoading
  };
}

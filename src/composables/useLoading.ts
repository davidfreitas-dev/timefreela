import { ref } from 'vue';
import { FirebaseError } from 'firebase/app';
import { useToast } from '@/composables/useToast';
import { useFirebaseAuthErrorHandler } from '@/composables/useFirebaseAuthErrorHandler';

export function useLoading() {
  const isLoading = ref(false);
  const { showToast } = useToast();
  const { getErrorMessage } = useFirebaseAuthErrorHandler();

  const showError = (error: unknown, fallbackMessage: string) => {
    if (error instanceof FirebaseError) {
      const errorMessage = getErrorMessage(error.code);
      showToast('error', errorMessage);
      return;
    }

    if (error instanceof Error) {
      showToast('error', error.message || fallbackMessage);
      return;
    }

    showToast('error', fallbackMessage);
  };

  const withLoading = async <T>(
    asyncAction: () => Promise<T>,
    fallbackMessage = 'Ocorreu um erro ao processar a requisição. Tente novamente mais tarde.'
  ): Promise<T | undefined> => {
    isLoading.value = true;

    try {
      return await asyncAction();
    } catch (error) {
      showError(error, fallbackMessage);
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

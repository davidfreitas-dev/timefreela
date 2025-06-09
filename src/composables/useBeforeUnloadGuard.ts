import { watch, onBeforeUnmount } from 'vue';

export function useBeforeUnloadGuard(conditionRef: () => boolean) {
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!conditionRef()) return;
    event.preventDefault();
    event.returnValue = '';
  };

  const stopWatch = watch(conditionRef, (value) => {
    if (value) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    } else {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, { immediate: true });

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    stopWatch();
  });
}

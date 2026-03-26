<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';
import { required, email } from '@vuelidate/validators';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/composables/useToast';
import { useLoading } from '@/composables/useLoading';
import { useFirebaseAuthErrorHandler } from '@/composables/useFirebaseAuthErrorHandler';
import { ROUTES } from '@/constants/routes';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';

const router = useRouter();
const authStore = useAuthStore();
const { showToast } = useToast();
const { withLoading, isLoading } = useLoading();
const { getErrorMessage } = useFirebaseAuthErrorHandler();

const formData = ref({
  email: ''
});

const rules = computed(() => ({
  email: { required, email }
}));

const v$ = useVuelidate(rules, formData);

const handleResetPassword = async () => {
  const isValidForm = await v$.value.$validate();
  
  if (!isValidForm) {
    showToast('error', 'Preencha os campos corretamente');
    return;
  }

  await withLoading(async () => {
    try {
      await authStore.sendPasswordResetEmail(formData.value.email);
      showToast('success', 'E-mail de redefinição enviado com sucesso!');
      router.push(ROUTES.LOGIN);
    } catch (error: unknown) {
      const firebaseError = error as { code: string };
      showToast('error', getErrorMessage(firebaseError.code));
    }
  });
};

const logoPath = new URL('@/assets/logo.png', import.meta.url).href;
</script>

<template>
  <div class="flex md:items-center justify-center w-full h-screen">
    <div class="md:bg-background dark:md:bg-accent-dark md:shadow-lg md:rounded-xl md:px-8 px-4 py-4 w-full max-w-lg">
      <div class="flex flex-col items-center my-5">
        <div class="flex items-center">
          <img
            :src="logoPath"
            alt="Logo Time Freela"
            class="h-12"
          >
          <h3 class="text-font dark:text-font-dark text-4xl font-extrabold">
            Time<span class="text-primary ml-0.5">Freela</span>
          </h3>
        </div>
        <span class="font-sans text-sm text-secondary/70 dark:text-secondary-dark/70 mt-1">
          Redefinir sua senha
        </span>
      </div>

      <form class="flex flex-col gap-4 p-3" @submit.prevent="handleResetPassword">
        <p class="text-sm text-secondary dark:text-secondary-dark mb-2 text-center">
          Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha.
        </p>

        <AppInput
          v-model="formData.email"
          type="email"
          label="Endereço de e-mail"
          placeholder="usuario@email.com"
          :error="v$.email.$dirty && v$.email.$error ? 'Informe um endereço de e-mail válido' : ''"
          :disabled="isLoading"
          @blur="v$.email.$touch"
        />

        <AppButton :is-loading="isLoading" class="mt-5">
          Enviar link de redefinição
        </AppButton>

        <router-link :to="ROUTES.LOGIN" class="text-center text-sm text-primary dark:text-primary-dark hover:text-primary-hover dark:hover:text-primary-hover-dark outline-primary dark:outline-primary-dark cursor-pointer m-4">
          Voltar para o login
        </router-link>
      </form>
    </div>
  </div>
</template>

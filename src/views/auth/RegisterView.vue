<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';
import { required, email, minLength, sameAs, helpers } from '@vuelidate/validators';
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
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
});

const fullName = helpers.withMessage(
  'Digite nome e sobrenome',
  (value: string) => {
    if (typeof value !== 'string') return false;
    const parts = value.trim().split(/\s+/);
    return parts.length >= 2;
  }
);

const rules = computed(() => ({
  name: { required, fullName },
  email: { required, email },
  password: { required, minLength: minLength(6) },
  confirmPassword: { required, sameAsPassword: sameAs(formData.value.password) }
}));

const v$ = useVuelidate(rules, formData);

const handleRegister = async () => {
  const isValidForm = await v$.value.$validate();

  if (!isValidForm) {
    showToast('error', 'Preencha os campos corretamente');
    return;
  }

  await withLoading(async () => {
    try {
      await authStore.register(
        formData.value.email,
        formData.value.password,
        formData.value.name
      );
      router.push(ROUTES.DASHBOARD);
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
      <div class="flex flex-col items-center my-3">
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
        <span class="font-sans text-sm text-secondary mt-1">
          Preencha os campos abaixo para se cadastrar
        </span>
      </div>

      <form class="flex flex-col gap-5 p-3" @submit.prevent="handleRegister">
        <AppInput
          v-model="formData.name"
          type="text"
          label="Nome e sobrenome"
          placeholder="João da Silva"
          :error="v$.name.$dirty && v$.name.$error ? 'O nome e sobrenome são obrigatórios' : ''"
          :disabled="isLoading"
          @blur="v$.name.$touch"
        />

        <AppInput
          v-model="formData.email"
          type="email"
          label="Endereço de e-mail"
          placeholder="joaodasilva@email.com"
          :error="v$.email.$dirty && v$.email.$error ? 'Informe um endereço de e-mail válido' : ''"
          :disabled="isLoading"
          @blur="v$.email.$touch"
        />

        <AppInput
          v-model="formData.password"
          type="password"
          label="Senha"
          placeholder="********"
          :error="v$.password.$dirty && v$.password.$error ? 'A senha deve ter no mínimo 6 caracteres' : ''"
          :disabled="isLoading"
          @blur="v$.password.$touch"
        />

        <AppInput
          v-model="formData.confirmPassword"
          type="password"
          label="Confirmar senha"
          placeholder="********"
          :error="v$.confirmPassword.$dirty && v$.confirmPassword.$error ? 'As senhas devem ser iguais' : ''"
          :disabled="isLoading"
          @blur="v$.confirmPassword.$touch"
        />

        <AppButton :is-loading="isLoading">
          Criar conta
        </AppButton>

        <router-link :to="ROUTES.LOGIN" class="text-center text-sm text-primary dark:text-primary-dark hover:text-primary-hover dark:hover:text-primary-hover-dark outline-primary dark:outline-primary-dark cursor-pointer m-4">
          Já tem uma conta? Faça login
        </router-link>
      </form>
    </div>
  </div>
</template>
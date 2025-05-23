<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';
import { required, email, minLength, sameAs, helpers } from '@vuelidate/validators';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useToast } from '@/composables/useToast';
import Input from '@/components/Input.vue';
import Button from '@/components/Button.vue';

const router = useRouter();

const authStore = useAuthStore();
const userStore = useUserStore();

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

const { showToast } = useToast();

const submitForm = async () => {
  const isValidForm = await v$.value.$validate();

  if (!isValidForm) {
    showToast('error', 'Preencha os campos corretamente');
    return;
  }

  await authStore.signUp({
    name: formData.value.name,
    email: formData.value.email,
    password: formData.value.password
  });

  if (!userStore.user) {
    showToast('error', 'Erro ao fazer login. Verifique suas credenciais.');
    return;
  }
  
  router.push({ name: 'Home' });
};

const logoPath = new URL('@/assets/logo.png', import.meta.url).href;
</script>

<template>
  <div class="flex md:items-center justify-center w-full h-screen text-gray-800">
    <div class="md:bg-white md:shadow-lg md:rounded-xl md:px-8 px-4 py-4 w-full max-w-lg">
      <div class="flex flex-col items-center">
        <img
          :src="logoPath"
          alt="Logo Time Freela"
          class="h-16"
        >
        <span class="font-sans text-sm text-secondary mb-2">
          Preencha os campos para se cadastrar
        </span>
      </div>

      <form class="flex flex-col gap-5 p-3" @submit.prevent="submitForm">
        <Input
          v-model="formData.name"
          type="text"
          label="Nome e sobrenome"
          placeholder="João da Silva"
          :error="v$.name.$dirty && v$.name.$error ? 'O nome e sobrenome são obrigatórios' : ''"
          @blur="v$.name.$touch"
        />

        <Input
          v-model="formData.email"
          type="email"
          label="Endereço de e-mail"
          placeholder="joaodasilva@email.com"
          :error="v$.email.$dirty && v$.email.$error ? 'Informe um endereço de e-mail válido' : ''"
          @blur="v$.email.$touch"
        />

        <Input
          v-model="formData.password"
          type="password"
          label="Senha"
          placeholder="********"
          :error="v$.password.$dirty && v$.password.$error ? 'A senha deve ter no mínimo 6 caracteres' : ''"
          @blur="v$.password.$touch"
        />

        <Input
          v-model="formData.confirmPassword"
          type="password"
          label="Confirmar senha"
          placeholder="********"
          :error="v$.confirmPassword.$dirty && v$.confirmPassword.$error ? 'As senhas devem ser iguais' : ''"
          @blur="v$.confirmPassword.$touch"
        />

        <Button :disabled="authStore.isLoading" :is-loading="authStore.isLoading">
          Criar conta
        </Button>

        <router-link to="/login" class="text-center text-sm text-primary hover:text-primary-hover outline-primary cursor-pointer m-4">
          Já tem uma conta? Faça login
        </router-link>
      </form>
    </div>
  </div>
</template>

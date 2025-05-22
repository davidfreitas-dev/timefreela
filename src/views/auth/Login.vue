<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';
import { required, email, minLength } from '@vuelidate/validators';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/composables/useToast';
import Input from '@/components//Input.vue';
import Button from '@/components//Button.vue';

const router = useRouter();

const authStore = useAuthStore();

const formData = ref({
  email: '',
  password: ''
});

const rules = computed(() => {
  return {
    email: { required, email },
    password: { required, minLength: minLength(6) }
  };
});

const v$ = useVuelidate(rules, formData);

const { showToast } = useToast();

const submitForm = async () => {
  const isValidForm = await v$.value.$validate();
  
  if (!isValidForm) {
    showToast('error', 'Preencha os campos corretamente');
    return;
  }

  await authStore.signIn({
    email: formData.value.email,
    password: formData.value.password
  });

  if (!authStore.isAuthenticated) {
    showToast('error', 'Falha na autenticação');
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
          Faça login para usar nossa plataforma
        </span>
      </div>

      <form class="flex flex-col gap-5 p-3" @submit.prevent="submitForm">
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
          label="Sua senha"
          placeholder="**********"
          :error="v$.password.$dirty && v$.password.$error ? 'A senha deve ter no mínimo 6 caracteres' : ''"
          @blur="v$.password.$touch"
        />

        <router-link to="/forgot" class="text-right text-sm text-primary hover:text-primary-hover outline-primary cursor-pointer">
          Esqueci minha senha
        </router-link>

        <Button :disabled="authStore.isLoading" :is-loading="authStore.isLoading">
          Entrar na plataforma
        </Button>

        <router-link to="/register" class="text-center text-sm text-primary hover:text-primary-hover outline-primary cursor-pointer m-4">
          Criar uma conta
        </router-link>
      </form>
    </div>
  </div>
</template>

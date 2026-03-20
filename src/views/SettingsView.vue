<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, email, helpers } from '@vuelidate/validators';
import { useDark } from '@vueuse/core';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useTimerStore } from '@/stores/timerStore';
import { useReportStore } from '@/stores/reportStore';
import { useLoading } from '@/composables/useLoading';
import { useToast } from '@/composables/useToast';
import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppSwitch from '@/components/ui/AppSwitch.vue';
import AppModal from '@/components/ui/AppModal.vue';

const authStore = useAuthStore();
const userStore = useUserStore();
const timerStore = useTimerStore();
const reportStore = useReportStore();
const { showToast } = useToast();

const formData = ref({
  name: '',
  email: ''
});

onMounted(() => {
  if (timerStore.isRunning) {
    timerStore.start();
  }

  if (userStore.profile) {
    formData.value.name = userStore.profile.name;
    formData.value.email = userStore.profile.email;
  }
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
  email: { required, email }
}));

const v$ = useVuelidate(rules, formData);

const needsReauth = computed(() => formData.value.email !== userStore.profile?.email);

const modalRef = ref<InstanceType<typeof AppModal> | null>(null);

const updateUserData = async () => {
  const id = userStore.profile?.id;

  if (!id) {
    throw new Error('Usuário não encontrado');
  }

  await authStore.updateUserInfo(formData.value);

  modalRef.value?.closeModal();
};

const { isLoading: isSaving, withLoading: withSaving } = useLoading();

const handleSave = async (event: Event) => {
  event.preventDefault();

  v$.value.$touch();

  if (v$.value.$invalid) {
    showToast('error', 'Preencha os campos corretamente');
    return;
  }

  if (needsReauth.value) {
    modalRef.value?.openModal();
    return;
  }

  await withSaving(async () => {
    await updateUserData();
    showToast('success', 'Informações atualizadas com sucesso.');
  });
};

const currentPassword = ref('');

const passwordRules = computed(() => ({
  currentPassword: { required }
}));

const vPassword$ = useVuelidate(passwordRules, { currentPassword });

const { isLoading: isConfirming, withLoading: withConfirming } = useLoading();

const confirmPassword = async (event: Event) => {
  event.preventDefault();

  vPassword$.value.$touch();

  if (vPassword$.value.$invalid) return;

  await withConfirming(async () => {
    await authStore.reauthenticateUser(currentPassword.value);
    await updateUserData();
    showToast('success', 'Informações atualizadas com sucesso.');
  });
};

const { isLoading: isExporting, withLoading: withExporting } = useLoading();

const handleBackup = async () => {
  await withExporting(async () => {
    await reportStore.downloadJsonBackup();
    showToast('success', 'Backup exportado com sucesso.');
  });
};

const isDark = useDark({
  selector: 'html', // Aplica a classe .dark na <html>
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
});
</script>

<template>
  <AppContainer>
    <div class="header flex justify-between items-center">
      <AppBreadcrumb title="Configurações" description="Gerencie suas configurações aqui." />
    </div>

    <section class="account my-7">
      <div class="p-6 md:p-8 bg-background dark:bg-accent-dark shadow-md rounded-3xl">
        <h1 class="section-title text-lg font-bold text-secondary dark:text-secondary-dark mb-5">
          Minha Conta
        </h1>
        <form class="flex flex-col gap-4">
          <AppInput
            v-model="formData.name"
            type="text"
            label="Nome e sobrenome"
            placeholder="João da Silva"
            :error="v$.name.$dirty && v$.name.$error ? 'O nome e sobrenome são obrigatórios' : ''"
            @blur="v$.name.$touch"
          />

          <AppInput
            v-model="formData.email"
            type="email"
            label="Endereço de e-mail"
            placeholder="usuario@email.com"
            :error="v$.email.$dirty && v$.email.$error ? 'Informe um endereço de e-mail válido' : ''"
            @blur="v$.email.$touch"
          />

          <div class="flex justify-end mt-2">
            <AppButton
              class="w-fit"
              :is-loading="isSaving"
              @click="handleSave"
            >
              Salvar Alterações
            </AppButton>
          </div>
        </form>
      </div>
    </section>

    <section class="backup my-7">
      <div class="p-6 md:p-8 bg-background dark:bg-accent-dark shadow-md rounded-3xl">
        <h1 class="section-title text-lg font-bold text-secondary dark:text-secondary-dark mb-4">
          Backup de Dados
        </h1>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p class="text-secondary dark:text-secondary-dark text-sm max-w-md">
            Exporte todos os seus projetos e sessões em um único arquivo JSON. Isso permite que você tenha uma cópia de segurança dos seus dados.
          </p>
          <AppButton
            variant="outline"
            :is-loading="isExporting"
            @click="handleBackup"
          >
            Exportar Backup (JSON)
          </AppButton>
        </div>
      </div>
    </section>

    <section class="system my-7">
      <div class="p-6 md:p-8 bg-background dark:bg-accent-dark shadow-md rounded-3xl">
        <h1 class="section-title text-lg font-bold text-secondary dark:text-secondary-dark mb-4">
          Sistema
        </h1>
        <div class="flex justify-between items-center">
          <span class="text-font dark:text-font-dark font-semibold">Modo escuro</span>
          <AppSwitch v-model="isDark" />
        </div>
      </div>
    </section>

    <AppModal
      ref="modalRef"
      title="Confirme sua senha"
      align="center"
    >
      <form class="flex flex-col gap-4">
        <AppInput
          v-model="currentPassword"
          type="password"
          label="Senha atual"
          placeholder="Digite sua senha"
          :error="vPassword$.currentPassword.$dirty && vPassword$.currentPassword.$error ? 'Senha obrigatória' : ''"
          @blur="vPassword$.currentPassword.$touch"
        />

        <div class="flex justify-end">
          <AppButton
            class="w-fit"
            :is-loading="isConfirming"
            @click="confirmPassword"
          >
            Confirmar
          </AppButton>
        </div>
      </form>
    </AppModal>
  </AppContainer>
</template>
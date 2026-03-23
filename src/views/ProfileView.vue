<script setup lang="ts">
import { computed, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';
import { required, email, helpers, minLength, sameAs } from '@vuelidate/validators';
import { useAuthStore } from '@/stores/authStore';
import { useUserStore } from '@/stores/userStore';
import { useTimerStore } from '@/stores/timerStore';
import { useLoading } from '@/composables/useLoading';
import { useToast } from '@/composables/useToast';
import { useFirebaseAuthErrorHandler } from '@/composables/useFirebaseAuthErrorHandler';
import { ROUTES } from '@/constants/routes';
import AppContainer from '@/components/layout/AppContainer.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppModal from '@/components/ui/AppModal.vue';
import AppDialog from '@/components/ui/AppDialog.vue';

const authStore = useAuthStore();
const userStore = useUserStore();
const timerStore = useTimerStore();
const router = useRouter();
const { showToast } = useToast();
const { getErrorMessage } = useFirebaseAuthErrorHandler();

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
const passwordModalRef = ref<InstanceType<typeof AppModal> | null>(null);
const deleteModalRef = ref<InstanceType<typeof AppModal> | null>(null);
const deleteDialogRef = ref<InstanceType<typeof AppDialog> | null>(null);

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
const deletePassword = ref('');

const passwordData = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const passwordRules = computed(() => ({
  currentPassword: { required }
}));

const deletePasswordRules = computed(() => ({
  deletePassword: { required }
}));

const passwordChangeRules = computed(() => ({
  currentPassword: { required },
  newPassword: { required, minLength: minLength(6) },
  confirmPassword: { required, sameAs: sameAs(passwordData.value.newPassword) }
}));

const vPassword$ = useVuelidate(passwordRules, { currentPassword });
const vDeletePassword$ = useVuelidate(deletePasswordRules, { deletePassword });
const vPasswordChange$ = useVuelidate(passwordChangeRules, passwordData);

const { isLoading: isConfirming, withLoading: withConfirming } = useLoading();

const confirmPassword = async (event: Event) => {
  event.preventDefault();

  vPassword$.value.$touch();

  if (vPassword$.value.$invalid) return;

  await withConfirming(async () => {
    try {
      await authStore.reauthenticateUser(currentPassword.value);
      await updateUserData();
      showToast('success', 'Informações atualizadas com sucesso.');
    } catch (error: unknown) {
      const authError = error as { code: string };
      showToast('error', getErrorMessage(authError.code));
      throw error;
    }
  });
};

const { isLoading: isChangingPassword, withLoading: withChangingPassword } = useLoading();

const openPasswordModal = () => {
  passwordData.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  vPasswordChange$.value.$reset();
  passwordModalRef.value?.openModal();
};

const handleUpdatePassword = async (event: Event) => {
  event.preventDefault();
  vPasswordChange$.value.$touch();
  if (vPasswordChange$.value.$invalid) return;

  await withChangingPassword(async () => {
    try {
      await authStore.reauthenticateUser(passwordData.value.currentPassword);
      await authStore.updatePassword(passwordData.value.newPassword);
      showToast('success', 'Senha alterada com sucesso.');
      passwordModalRef.value?.closeModal();
    } catch (error: unknown) {
      const authError = error as { code: string };
      showToast('error', getErrorMessage(authError.code));
      throw error;
    }
  });
};

const { isLoading: isDeleting, withLoading: withDeleting } = useLoading();

const openDeleteConfirm = () => {
  deleteDialogRef.value?.openModal();
};

const onConfirmDeleteData = () => {
  deleteModalRef.value?.openModal();
};

const handleDeleteAccount = async (event: Event) => {
  event.preventDefault();
  vDeletePassword$.value.$touch();
  if (vDeletePassword$.value.$invalid) return;

  await withDeleting(async () => {
    try {
      await authStore.reauthenticateUser(deletePassword.value);
      await authStore.deleteAccount();
      showToast('success', 'Sua conta foi excluída com sucesso.');
      router.push(ROUTES.LOGIN);
    } catch (error: unknown) {
      const authError = error as { code: string };
      showToast('error', getErrorMessage(authError.code));
      throw error;
    }
  });
};
</script>

<template>
  <AppContainer>
    <div class="header flex justify-between items-center">
      <AppBreadcrumb title="Perfil" description="Gerencie suas informações de perfil aqui." />
    </div>

    <section class="account my-7">
      <div class="p-6 md:p-8 bg-background dark:bg-accent-dark shadow-md rounded-3xl">
        <h1 class="section-title text-lg font-bold text-secondary dark:text-secondary-dark mb-5">
          Meus Dados
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

    <section class="security my-7">
      <div class="p-6 md:p-8 bg-background dark:bg-accent-dark shadow-md rounded-3xl">
        <h1 class="section-title text-lg font-bold text-secondary dark:text-secondary-dark mb-4">
          Segurança
        </h1>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="max-w-md">
            <p class="text-secondary dark:text-secondary-dark text-sm">
              Mantenha sua conta segura alterando sua senha periodicamente.
            </p>
          </div>
          <AppButton
            color="secondary"
            @click="openPasswordModal"
          >
            Alterar Senha
          </AppButton>
        </div>
      </div>
    </section>

    <section class="manage-account my-7">
      <div class="p-6 md:p-8 bg-background dark:bg-accent-dark shadow-md rounded-3xl">
        <h1 class="section-title text-lg font-bold text-danger dark:text-danger-dark mb-4">
          Gerenciar Conta
        </h1>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div class="max-w-md">
            <p class="text-secondary dark:text-secondary-dark text-sm">
              Excluir permanentemente sua conta e todos os seus dados.
            </p>
            <p class="text-xs text-danger dark:text-danger-dark mt-1">
              Esta ação é irreversível.
            </p>
          </div>
          <AppButton
            color="danger"
            @click="openDeleteConfirm"
          >
            Excluir Conta
          </AppButton>
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

    <AppModal
      ref="passwordModalRef"
      title="Alterar Senha"
      align="center"
    >
      <form class="flex flex-col gap-4">
        <AppInput
          v-model="passwordData.currentPassword"
          type="password"
          label="Senha atual"
          placeholder="Digite sua senha atual"
          :error="vPasswordChange$.currentPassword.$dirty && vPasswordChange$.currentPassword.$error ? 'Senha atual é obrigatória' : ''"
          @blur="vPasswordChange$.currentPassword.$touch"
        />

        <AppInput
          v-model="passwordData.newPassword"
          type="password"
          label="Nova senha"
          placeholder="Mínimo 6 caracteres"
          :error="vPasswordChange$.newPassword.$dirty && vPasswordChange$.newPassword.$error ? 'A nova senha deve ter no mínimo 6 caracteres' : ''"
          @blur="vPasswordChange$.newPassword.$touch"
        />

        <AppInput
          v-model="passwordData.confirmPassword"
          type="password"
          label="Confirmar nova senha"
          placeholder="Repita a nova senha"
          :error="vPasswordChange$.confirmPassword.$dirty && vPasswordChange$.confirmPassword.$error ? 'As senhas não coincidem' : ''"
          @blur="vPasswordChange$.confirmPassword.$touch"
        />

        <div class="flex justify-end">
          <AppButton
            class="w-fit"
            :is-loading="isChangingPassword"
            @click="handleUpdatePassword"
          >
            Atualizar Senha
          </AppButton>
        </div>
      </form>
    </AppModal>

    <AppModal
      ref="deleteModalRef"
      title="Confirme sua senha para excluir a conta"
      align="center"
    >
      <form class="flex flex-col gap-4">
        <p class="text-sm text-secondary dark:text-secondary-dark">
          Por segurança, digite sua senha para confirmar a exclusão permanente da sua conta e de todos os seus dados.
        </p>
        <AppInput
          v-model="deletePassword"
          type="password"
          label="Sua senha"
          placeholder="Digite sua senha"
          :error="vDeletePassword$.deletePassword.$dirty && vDeletePassword$.deletePassword.$error ? 'Senha obrigatória' : ''"
          @blur="vDeletePassword$.deletePassword.$touch"
        />

        <div class="flex justify-end">
          <AppButton
            color="danger"
            class="w-fit"
            :is-loading="isDeleting"
            @click="handleDeleteAccount"
          >
            Confirmar Exclusão Permanente
          </AppButton>
        </div>
      </form>
    </AppModal>

    <AppDialog
      ref="deleteDialogRef"
      header="Excluir Conta?"
      message="Você tem certeza que deseja excluir sua conta? Todos os seus projetos e sessões serão apagados permanentemente. Esta ação não pode ser desfeita."
      confirm-text="Sim, excluir conta"
      @confirm-action="onConfirmDeleteData"
    />
  </AppContainer>
</template>

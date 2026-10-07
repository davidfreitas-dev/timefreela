<script setup lang="ts">
import { ref } from 'vue';

import AppButton from '@/components/ui/AppButton.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppInputDate from '@/components/ui/AppInputDate.vue';
import AppInputSearch from '@/components/ui/AppInputSearch.vue';

import AppTextarea from '@/components/ui/AppTextarea.vue';
import AppSwitch from '@/components/ui/AppSwitch.vue';
import AppCheckbox from '@/components/ui/AppCheckbox.vue';
import AppBadge from '@/components/ui/AppBadge.vue';
import AppChip from '@/components/ui/AppChip.vue';
import AppCombobox from '@/components/ui/AppCombobox.vue';
import AppListbox from '@/components/ui/AppListbox.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppSpinnerLoader from '@/components/ui/AppSpinnerLoader.vue';
import AppBreadcrumb from '@/components/ui/AppBreadcrumb.vue';

const inputValue = ref('');
const dateValue = ref<Date | null>(null);
const selectValue = ref(null);
const selectOptions = [
  { label: 'Opção 1', value: 1 },
  { label: 'Opção 2', value: 2 },
  { label: 'Opção 3', value: 3 },
];

const switchActive = ref(true);
const checkActive = ref(true);

const colorGroups = [
  {
    title: 'Primary',
    colors: [
      { name: 'primary', class: 'bg-primary dark:bg-primary-dark' },
      { name: 'primary-hover', class: 'bg-primary-hover dark:bg-primary-hover-dark' },
      { name: 'primary-focus', class: 'bg-primary-focus dark:bg-primary-focus-dark' },
      { name: 'primary-pressed', class: 'bg-primary-pressed dark:bg-primary-pressed-dark' },
      { name: 'primary-accent', class: 'bg-primary-accent dark:bg-primary-accent-dark' },
    ]
  },
  {
    title: 'Success',
    colors: [
      { name: 'success', class: 'bg-success dark:bg-success-dark' },
      { name: 'success-hover', class: 'bg-success-hover dark:bg-success-hover-dark' },
      { name: 'success-focus', class: 'bg-success-focus dark:bg-success-focus-dark' },
      { name: 'success-pressed', class: 'bg-success-pressed dark:bg-success-pressed-dark' },
      { name: 'success-accent', class: 'bg-success-accent dark:bg-success-accent-dark' },
    ]
  },
  {
    title: 'Warning',
    colors: [
      { name: 'warning', class: 'bg-warning dark:bg-warning-dark' },
      { name: 'warning-hover', class: 'bg-warning-hover dark:bg-warning-hover-dark' },
      { name: 'warning-focus', class: 'bg-warning-focus dark:bg-warning-focus-dark' },
      { name: 'warning-pressed', class: 'bg-warning-pressed dark:bg-warning-pressed-dark' },
      { name: 'warning-accent', class: 'bg-warning-accent dark:bg-warning-accent-dark' },
    ]
  },
  {
    title: 'Danger',
    colors: [
      { name: 'danger', class: 'bg-danger dark:bg-danger-dark' },
      { name: 'danger-hover', class: 'bg-danger-hover dark:bg-danger-hover-dark' },
      { name: 'danger-focus', class: 'bg-danger-focus dark:bg-danger-focus-dark' },
      { name: 'danger-pressed', class: 'bg-danger-pressed dark:bg-danger-pressed-dark' },
      { name: 'danger-accent', class: 'bg-danger-accent dark:bg-danger-accent-dark' },
    ]
  },
  {
    title: 'Neutrals',
    colors: [
      { name: 'font', class: 'bg-font dark:bg-font-dark' },
      { name: 'secondary', class: 'bg-secondary dark:bg-secondary-dark' },
      { name: 'disabled', class: 'bg-disabled dark:bg-disabled-dark' },
      { name: 'neutral', class: 'bg-neutral dark:bg-neutral-dark' },
      { name: 'accent', class: 'bg-accent dark:bg-accent-dark' },
      { name: 'background', class: 'bg-background dark:bg-background-dark' },
    ]
  },
];
</script>

<template>
  <div class="mb-10">
    <AppBreadcrumb 
      title="Design System" 
      description="Catálogo de componentes e estilos da aplicação TimeFreela." 
    />
  </div>

  <!-- Cores -->
  <section class="bg-background dark:bg-accent-dark rounded-3xl p-6 md:p-8 shadow-md mb-12">
    <h2 class="text-2xl font-bold text-font dark:text-font-dark mb-6 border-b pb-2 border-neutral dark:border-neutral-dark">
      Cores
    </h2>

    <div class="space-y-10">
      <div v-for="group in colorGroups" :key="group.title">
        <p class="text-[11px] font-bold uppercase tracking-[0.15em] text-secondary dark:text-secondary-dark mb-3">
          {{ group.title }}
        </p>
        <div class="border-t border-neutral dark:border-neutral-dark mb-5" />

        <div class="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
          <div
            v-for="color in group.colors"
            :key="color.name"
            class="rounded-xl overflow-hidden border border-neutral dark:border-neutral-dark"
          >
            <div :class="['h-22.5 w-full', color.class]" />
            <div class="bg-accent dark:bg-background-dark px-3 py-2.5">
              <p class="text-[12px] font-semibold leading-snug text-font dark:text-font-dark">
                {{ color.name }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Buttons -->
  <section class="bg-background dark:bg-accent-dark rounded-3xl p-6 md:p-8 shadow-md mb-12">
    <h2 class="text-2xl font-bold text-font dark:text-font-dark mb-6 border-b pb-2 border-neutral dark:border-neutral-dark">
      Botões
    </h2>
 
    <div class="space-y-8">
      <div>
        <h3 class="text-lg font-semibold text-font dark:text-font-dark mb-4">
          Cores
        </h3>
        <div class="flex flex-wrap items-center gap-6">
          <AppButton color="primary">
            Primary
          </AppButton>
          <AppButton color="secondary">
            Secondary
          </AppButton>
          <AppButton color="success">
            Success
          </AppButton>
          <AppButton color="danger">
            Danger
          </AppButton>
          <AppButton color="outline">
            Outline
          </AppButton>
          <AppButton disabled>
            Disabled
          </AppButton>
          <AppButton :is-loading="true">
            Loading
          </AppButton>
        </div>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-font dark:text-font-dark mb-4">
          Tamanhos
        </h3>
        <div class="flex flex-wrap items-center gap-6">
          <AppButton size="small">
            Small
          </AppButton>
          <AppButton>Default</AppButton>
        </div>
      </div>
      <div>
        <h3 class="text-lg font-semibold text-font dark:text-font-dark mb-4">
          Com Ícones
        </h3>
        <div class="flex flex-wrap items-center gap-6">
          <AppButton>
            <AppIcon name="add" class="w-5 h-5" />
            Ícone Esquerda
          </AppButton>
          <AppButton>
            Ícone Direita
            <AppIcon name="chevron_right" class="w-5 h-5" />
          </AppButton>
          <AppButton icon-only>
            <AppIcon name="delete" class="w-5 h-5" />
          </AppButton>
        </div>
      </div>
    </div>
  </section>

  <!-- Formulários -->
  <section class="bg-background dark:bg-accent-dark rounded-3xl p-6 md:p-8 shadow-md mb-12">
    <h2 class="text-2xl font-bold text-font dark:text-font-dark mb-6 border-b pb-2 border-neutral dark:border-neutral-dark">
      Inputs & Formulários
    </h2>

    <div class="space-y-12">
      <!-- AppInput -->
      <div>
        <h3 class="text-lg font-semibold text-font dark:text-font-dark mb-4 border-b border-neutral dark:border-neutral-dark pb-2">
          AppInput, AppInputSearch & AppInput
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AppInput
            v-model="inputValue"
            label="Default"
            placeholder="Digite algo..."
          />
          <AppInput
            v-model="inputValue"
            label="Disabled"
            placeholder="Não clicável"
            disabled
          />
          <AppInput
            v-model="inputValue"
            label="Com Erro"
            placeholder="Digite algo..."
            error="Este campo é obrigatório"
          />
          <AppInput
            v-model="inputValue"
            label="Senha"
            placeholder="Digite a senha"
            type="password"
          />
          <AppInputSearch
            v-model="inputValue"
            label="Pesquisar"
            placeholder="Buscar projetos..."
          />
          <AppInputSearch
            v-model="inputValue"
            label="Pesquisar (Disabled)"
            placeholder="Buscar projetos..."
            disabled
          />
          <AppInput
            v-model="inputValue"
            mask-type="currency"
            label="Moeda"
            placeholder="R$ 0,00"
          />
          <AppInput
            v-model="inputValue"
            label="Moeda (Disabled)"
            placeholder="R$ 0,00"
            disabled
          />
        </div>
      </div>

      <!-- AppTextarea -->
      <div>
        <h3 class="text-lg font-semibold text-font dark:text-font-dark mb-4 border-b border-neutral dark:border-neutral-dark pb-2">
          AppTextarea
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AppTextarea
            v-model="inputValue"
            label="Default"
            placeholder="Deixe um comentário..."
          />
          <AppTextarea
            v-model="inputValue"
            label="Disabled"
            placeholder="Não clicável"
            disabled
          />
          <AppTextarea
            v-model="inputValue"
            label="Com Erro"
            placeholder="Comentário..."
            error="Descrição muito curta"
          />
        </div>
      </div>

      <!-- Seleção (Listbox, Combobox) -->
      <div>
        <h3 class="text-lg font-semibold text-font dark:text-font-dark mb-4 border-b border-neutral dark:border-neutral-dark pb-2">
          Seleção (Listbox, Combobox)
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="space-y-4">
            <AppListbox
              v-model="selectValue"
              :options="selectOptions"
              label="AppListbox Default"
            />
            <AppListbox
              v-model="selectValue"
              :options="selectOptions"
              label="AppListbox com Erro"
              error="Selecione uma opção"
            />
            <AppListbox
              v-model="selectValue"
              :options="selectOptions"
              label="AppListbox Disabled"
              disabled
            />
          </div>

          <div class="space-y-4">
            <AppCombobox
              v-model="selectValue"
              :options="selectOptions"
              label="AppCombobox Default"
              placeholder="Pesquisar..."
            />
            <AppCombobox
              v-model="selectValue"
              :options="selectOptions"
              label="AppCombobox Clearable & Loading"
              clearable
              loading
              placeholder="Pesquisar..."
            />
            <AppCombobox
              v-model="selectValue"
              :options="selectOptions"
              label="AppCombobox com Erro"
              error="Nenhum item válido"
            />
            <AppCombobox
              v-model="selectValue"
              :options="selectOptions"
              label="AppCombobox Disabled"
              disabled
            />
          </div>
        </div>
      </div>

      <!-- AppInputDate -->
      <div>
        <h3 class="text-lg font-semibold text-font dark:text-font-dark mb-4 border-b border-neutral dark:border-neutral-dark pb-2">
          AppInputDate
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AppInputDate v-model="dateValue" label="Date Default" />
          <AppInputDate
            v-model="dateValue"
            label="Date & Time"
            mode="datetime"
          />
          <AppInputDate
            v-model="dateValue"
            label="Disabled"
            disabled
          />
        </div>
      </div>
    </div>
  </section>

  <!-- Controles -->
  <section class="bg-background dark:bg-accent-dark rounded-3xl p-6 md:p-8 shadow-md mb-12">
    <h2 class="text-2xl font-bold text-font dark:text-font-dark mb-6 border-b pb-2 border-neutral dark:border-neutral-dark">
      Controles
    </h2>
 
    <div class="flex flex-wrap gap-16">
      <div class="space-y-4">
        <h3 class="font-semibold text-font dark:text-font-dark">
          AppSwitch
        </h3>
        <div class="flex items-center gap-4">
          <AppSwitch v-model="switchActive" /> <span class="text-font dark:text-font-dark">Ativo</span>
        </div>
      </div>
 
      <div class="space-y-4">
        <h3 class="font-semibold text-font dark:text-font-dark">
          AppCheckbox
        </h3>
        <AppCheckbox v-model="checkActive" label="Checkbox" />
      </div>
    </div>
  </section>
 
  <!-- Badges & Stat Cards -->
  <section class="bg-background dark:bg-accent-dark rounded-3xl p-6 md:p-8 shadow-md mb-12">
    <h2 class="text-2xl font-bold text-font dark:text-font-dark mb-6 border-b pb-2 border-neutral dark:border-neutral-dark">
      Badges & Cards
    </h2>
 
    <div class="space-y-8">
      <div>
        <h3 class="font-semibold text-font dark:text-font-dark mb-4">
          Badges
        </h3>
        <div class="space-y-6">
          <div>
            <h4 class="text-sm text-secondary dark:text-secondary-dark mb-2">Accent (Default)</h4>
            <div class="flex flex-wrap gap-4 items-center">
              <AppBadge label="Primary" color="primary" />
              <AppBadge label="Success" color="success" />
              <AppBadge label="Warning" color="warning" />
              <AppBadge label="Danger" color="danger" />
            </div>
          </div>
          <div>
            <h4 class="text-sm text-secondary dark:text-secondary-dark mb-2">Solid</h4>
            <div class="flex flex-wrap gap-4 items-center">
              <AppBadge label="Primary" color="primary" variant="solid" />
              <AppBadge label="Success" color="success" variant="solid" />
              <AppBadge label="Warning" color="warning" variant="solid" />
              <AppBadge label="Danger" color="danger" variant="solid" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 class="font-semibold text-font dark:text-font-dark mb-4">
          Chips
        </h3>
        <div class="space-y-6">
          <div>
            <h4 class="text-sm text-secondary dark:text-secondary-dark mb-2">Solid (Default)</h4>
            <div class="flex flex-wrap gap-4 items-center">
              <AppChip label="Primary" color="primary" closable />
              <AppChip label="Secondary" color="secondary" closable />
              <AppChip label="Success" color="success" closable />
              <AppChip label="Warning" color="warning" closable />
              <AppChip label="Danger" color="danger" closable />
            </div>
          </div>
          <div>
            <h4 class="text-sm text-secondary dark:text-secondary-dark mb-2">Outline</h4>
            <div class="flex flex-wrap gap-4 items-center">
              <AppChip label="Primary" color="primary" variant="outline" closable />
              <AppChip label="Secondary" color="secondary" variant="outline" closable />
              <AppChip label="Success" color="success" variant="outline" closable />
              <AppChip label="Warning" color="warning" variant="outline" closable />
              <AppChip label="Danger" color="danger" variant="outline" closable />
            </div>
          </div>
          <div>
            <h4 class="text-sm text-secondary dark:text-secondary-dark mb-2">Accent</h4>
            <div class="flex flex-wrap gap-4 items-center">
              <AppChip label="Primary" color="primary" variant="accent" closable />
              <AppChip label="Secondary" color="secondary" variant="accent" closable />
              <AppChip label="Success" color="success" variant="accent" closable />
              <AppChip label="Warning" color="warning" variant="accent" closable />
              <AppChip label="Danger" color="danger" variant="accent" closable />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Ícones e Loaders -->
  <section class="bg-background dark:bg-accent-dark rounded-3xl p-6 md:p-8 shadow-md mb-12">
    <h2 class="text-2xl font-bold text-font dark:text-font-dark mb-6 border-b pb-2 border-neutral dark:border-neutral-dark">
      Outros (Ícones, Loaders)
    </h2>
 
    <div class="space-y-8">
      <div>
        <h3 class="font-semibold text-font dark:text-font-dark mb-4">
          AppSpinnerLoader (Cores)
        </h3>
        <div class="flex flex-wrap items-center gap-6 mb-8">
          <AppSpinnerLoader color="primary" text="Primary" />
          <AppSpinnerLoader color="secondary" text="Secondary" />
          <AppSpinnerLoader color="success" text="Success" />
          <AppSpinnerLoader color="warning" text="Warning" />
          <AppSpinnerLoader color="danger" text="Danger" />
          <div class="bg-primary p-2 rounded flex items-center">
            <AppSpinnerLoader color="white" text="White" />
          </div>
        </div>
          
        <h3 class="font-semibold text-font dark:text-font-dark mb-4">
          AppSpinnerLoader (Tamanhos)
        </h3>
        <div class="flex flex-wrap items-center gap-6">
          <AppSpinnerLoader size="sm" text="Small" />
          <AppSpinnerLoader size="md" text="Medium" />
          <AppSpinnerLoader size="lg" text="Large" />
        </div>
      </div>

      <div>
        <h3 class="font-semibold text-font dark:text-font-dark mb-4">
          Ícones
        </h3>
        <div class="flex flex-wrap gap-4 text-font dark:text-font-dark">
          <AppIcon name="home" class="w-6 h-6" />
          <AppIcon name="settings" class="w-6 h-6" />
          <AppIcon name="edit" class="w-6 h-6" />
          <AppIcon name="delete" class="w-6 h-6" />
          <AppIcon name="visibility" class="w-6 h-6" />
          <AppIcon name="add" class="w-6 h-6" />
          <AppIcon name="check" class="w-6 h-6" />
          <AppIcon name="close" class="w-6 h-6" />
          <AppIcon name="search" class="w-6 h-6" />
          <AppIcon name="chevron_right" class="w-6 h-6" />
          <AppIcon name="chevron_left" class="w-6 h-6" />
        </div>
      </div>
    </div>
  </section>
</template>

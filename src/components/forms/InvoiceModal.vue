<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useUserStore } from '@/stores/userStore';
import { useProjectStore } from '@/stores/projectStore';
import { useReportStore } from '@/stores/reportStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useToast } from '@/composables/useToast';
import { invoiceService, type InvoiceData } from '@/services/invoiceService';
import type { Session } from '@/types';
import dayjs from '@/lib/dayjs';

import AppModal from '@/components/ui/AppModal.vue';
import AppInput from '@/components/ui/AppInput.vue';
import AppButton from '@/components/ui/AppButton.vue';
import AppIcon from '@/components/ui/AppIcon.vue';
import AppCheckbox from '@/components/ui/AppCheckbox.vue';
import AppTextarea from '@/components/ui/AppTextarea.vue';

const props = defineProps<{
  sessions: Session[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'success'): void;
}>();

const userStore = useUserStore();
const projectStore = useProjectStore();
const reportStore = useReportStore();
const sessionStore = useSessionStore();
const { showToast } = useToast();

const modalRef = ref<InstanceType<typeof AppModal> | null>(null);
const markAsBilled = ref(true);

const invoiceNumber = ref(invoiceService.generateInvoiceNumber());
const issueDate = ref(dayjs().format('DD/MM/YYYY'));
const dueDate = ref(dayjs().add(15, 'days').format('DD/MM/YYYY'));

// Dados do Prestador (Freelancer)
const issuerName = ref(userStore.user?.name || '');
const issuerDocument = ref('');
const issuerEmail = ref(userStore.user?.email || '');
const issuerPhone = ref('');

// Dados do Cliente
const clientName = ref('');
const clientDocument = ref('');
const clientEmail = ref('');
const clientAddress = ref('');

// Dados de Pagamento
const pixKey = ref('');
const pixBeneficiary = ref(userStore.user?.name || '');
const bankName = ref('');
const bankAgency = ref('');
const bankAccount = ref('');
const notes = ref('Agradecemos pela parceria! Envie o comprovante Pix após o pagamento.');

// Ajustes Financeiros
const discount = ref<number | string>(0);
const tax = ref<number | string>(0);

const STORAGE_KEY = 'timefreela_invoice_profile';

const loadSavedProfile = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.issuerDocument) issuerDocument.value = data.issuerDocument;
      if (data.issuerPhone) issuerPhone.value = data.issuerPhone;
      if (data.pixKey) pixKey.value = data.pixKey;
      if (data.pixBeneficiary) pixBeneficiary.value = data.pixBeneficiary;
      if (data.bankName) bankName.value = data.bankName;
      if (data.bankAgency) bankAgency.value = data.bankAgency;
      if (data.bankAccount) bankAccount.value = data.bankAccount;
    }
  } catch (err) {
    console.warn('Erro ao carregar dados de emissor salvos:', err);
  }
};

const saveProfile = () => {
  try {
    const toSave = {
      issuerDocument: issuerDocument.value,
      issuerPhone: issuerPhone.value,
      pixKey: pixKey.value,
      pixBeneficiary: pixBeneficiary.value,
      bankName: bankName.value,
      bankAgency: bankAgency.value,
      bankAccount: bankAccount.value,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (err) {
    console.warn('Erro ao salvar dados de emissor:', err);
  }
};

onMounted(() => {
  loadSavedProfile();
  // Se as sessões pertencerem a um projeto com título, sugerir nome do cliente baseado no projeto
  if (props.sessions.length > 0) {
    const firstProject = projectStore.items.find(p => p.id === props.sessions[0].projectId);
    if (firstProject && !clientName.value) {
      clientName.value = `Cliente - ${firstProject.title}`;
    }
  }
});

const calculatedItems = computed(() => {
  return props.sessions.map(s => {
    const project = projectStore.items.find(p => p.id === s.projectId);
    const amount = reportStore.calculateSessionAmount({
      ...s,
      billingType: s.billingType || project?.billingType,
      billingAmount: s.billingAmount !== undefined ? s.billingAmount : project?.billingAmount,
    });

    return {
      description: s.projectTitle || project?.title || 'Serviços prestados',
      projectTitle: project?.title || s.projectTitle || 'Geral',
      durationSeconds: s.duration,
      hourlyRateOrAmount: project?.billingAmount || 0,
      totalAmount: Math.round(amount),
      date: s.date,
    };
  });
});

const subtotalCents = computed(() => {
  return calculatedItems.value.reduce((acc, item) => acc + item.totalAmount, 0);
});

const discountCents = computed(() => Math.round(Number(discount.value || 0) * 100));
const taxCents = computed(() => Math.round(Number(tax.value || 0) * 100));

const totalFinalCents = computed(() => {
  return Math.max(0, subtotalCents.value - discountCents.value + taxCents.value);
});

const openModal = () => {
  invoiceNumber.value = invoiceService.generateInvoiceNumber();
  loadSavedProfile();
  modalRef.value?.openModal();
};

const closeModal = () => {
  modalRef.value?.closeModal();
  emit('close');
};

const handleGeneratePdf = async () => {
  if (!clientName.value.trim()) {
    showToast('error', 'Por favor, informe o nome do cliente.');
    return;
  }

  saveProfile();

  const invoiceData: InvoiceData = {
    invoiceNumber: invoiceNumber.value,
    issueDate: issueDate.value,
    issuer: {
      name: issuerName.value || 'Freelancer',
      document: issuerDocument.value,
      email: issuerEmail.value,
      phone: issuerPhone.value,
    },
    client: {
      name: clientName.value,
      document: clientDocument.value,
      email: clientEmail.value,
      address: clientAddress.value,
    },
    items: calculatedItems.value,
    discountCents: discountCents.value,
    taxCents: taxCents.value,
    payment: {
      pixKeyType: 'email',
      pixKey: pixKey.value,
      pixBeneficiary: pixBeneficiary.value,
      bankName: bankName.value,
      bankAgency: bankAgency.value,
      bankAccount: bankAccount.value,
      dueDate: dueDate.value,
      notes: notes.value,
    },
  };

  try {
    invoiceService.downloadPdf(invoiceData);
    showToast('success', `Fatura ${invoiceNumber.value} gerada com sucesso!`);

    // Marcar sessões como faturadas se selecionado
    if (markAsBilled.value && props.sessions.length > 0) {
      const ids = props.sessions.map(s => s.id);
      await sessionStore.setBillingStatus(ids, true);
      showToast('info', `${ids.length} sessão(ões) marcada(s) como faturada(s).`);
    }

    closeModal();
    emit('success');
  } catch (err) {
    console.error('Erro ao gerar fatura PDF:', err);
    showToast('error', 'Ocorreu um erro ao gerar a fatura.');
  }
};

defineExpose({
  openModal,
  closeModal,
});
</script>

<template>
  <AppModal
    ref="modalRef"
    title="Emitir Fatura / Invoice Formal (PDF)"
  >
    <div class="space-y-6 max-h-[75vh] overflow-y-auto px-1">
      <!-- Identificação e Datas -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-neutral/40 dark:bg-neutral-dark/40 border border-neutral dark:border-neutral-dark">
        <AppInput
          v-model="invoiceNumber"
          label="Número da Fatura"
          placeholder="#FAT-2026-001"
        />
        <AppInput
          v-model="issueDate"
          label="Data de Emissão"
          placeholder="DD/MM/AAAA"
        />
        <AppInput
          v-model="dueDate"
          label="Data de Vencimento"
          placeholder="DD/MM/AAAA"
        />
      </div>

      <!-- Dados do Freelancer / Emissor -->
      <div>
        <h4 class="text-sm font-bold text-font dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <AppIcon name="person" size="sm" class="text-primary" />
          <span>Seus Dados (Prestador)</span>
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            v-model="issuerName"
            label="Seu Nome / Razão Social"
            placeholder="Nome Completo ou MEI"
          />
          <AppInput
            v-model="issuerDocument"
            label="Seu CPF / CNPJ"
            placeholder="000.000.000-00"
          />
          <AppInput
            v-model="issuerEmail"
            label="Seu E-mail"
            placeholder="seuemail@exemplo.com"
          />
          <AppInput
            v-model="issuerPhone"
            label="Seu Telefone / WhatsApp"
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>

      <!-- Dados do Cliente -->
      <div>
        <h4 class="text-sm font-bold text-font dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <AppIcon name="folder" size="sm" class="text-primary" />
          <span>Dados do Cliente / Tomador</span>
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            v-model="clientName"
            label="Nome do Cliente / Empresa *"
            placeholder="Empresa Contratante Ltda"
          />
          <AppInput
            v-model="clientDocument"
            label="CNPJ ou CPF do Cliente"
            placeholder="00.000.000/0001-00"
          />
          <AppInput
            v-model="clientEmail"
            label="E-mail de Cobrança do Cliente"
            placeholder="financeiro@empresa.com"
          />
          <AppInput
            v-model="clientAddress"
            label="Endereço / Cidade do Cliente"
            placeholder="São Paulo - SP"
          />
        </div>
      </div>

      <!-- Dados de Pagamento (PIX e Bancários) -->
      <div>
        <h4 class="text-sm font-bold text-font dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
          <AppIcon name="table_chart" size="sm" class="text-primary" />
          <span>Dados para Pagamento (PIX e Banco)</span>
        </h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AppInput
            v-model="pixKey"
            label="Chave Pix"
            placeholder="E-mail, CPF, CNPJ ou chave aleatória"
          />
          <AppInput
            v-model="pixBeneficiary"
            label="Nome do Titular da Chave"
            placeholder="Nome que aparece no Pix"
          />
          <AppInput
            v-model="bankName"
            label="Banco (opcional)"
            placeholder="Ex: Nubank, Itaú, Inter"
          />
          <div class="grid grid-cols-2 gap-2">
            <AppInput
              v-model="bankAgency"
              label="Agência"
              placeholder="0001"
            />
            <AppInput
              v-model="bankAccount"
              label="Conta Corrente"
              placeholder="123456-7"
            />
          </div>
        </div>
        <div class="mt-3">
          <AppTextarea
            v-model="notes"
            label="Instruções / Observações no Rodapé da Fatura"
            rows="2"
          />
        </div>
      </div>

      <!-- Resumo Financeiro & Totais -->
      <div class="p-4 rounded-2xl bg-neutral/50 dark:bg-neutral-dark/50 border border-neutral dark:border-neutral-dark">
        <h4 class="text-sm font-bold text-font dark:text-white mb-3">
          Resumo Financeiro ({{ sessions.length }} sessões selecionadas)
        </h4>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div class="text-sm">
            <span class="text-secondary dark:text-secondary-dark block">Subtotal dos Serviços</span>
            <span class="font-bold text-base font-mono text-font dark:text-white">
              {{ invoiceService.formatCurrency(subtotalCents) }}
            </span>
          </div>

          <div>
            <AppInput
              v-model="discount"
              label="Desconto (R$)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
            />
          </div>

          <div>
            <AppInput
              v-model="tax"
              label="Impostos / Retenções (R$)"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
            />
          </div>
        </div>

        <div class="flex justify-between items-center pt-3 border-t border-neutral dark:border-neutral-dark">
          <span class="text-base font-bold text-font dark:text-white">
            TOTAL FINAL DA FATURA:
          </span>
          <span class="text-2xl font-bold font-mono text-primary dark:text-primary-dark">
            {{ invoiceService.formatCurrency(totalFinalCents) }}
          </span>
        </div>

        <div class="mt-4 pt-3 border-t border-neutral dark:border-neutral-dark flex items-center">
          <AppCheckbox
            v-model="markAsBilled"
            label="Marcar automaticamente as sessões incluídas como Faturadas"
          />
        </div>
      </div>

      <!-- Ações do Modal -->
      <div class="flex justify-end gap-3 pt-4 border-t border-neutral dark:border-neutral-dark">
        <AppButton color="secondary" @click="closeModal">
          Cancelar
        </AppButton>
        <AppButton @click="handleGeneratePdf">
          <AppIcon name="download" />
          <span>Baixar Fatura PDF</span>
        </AppButton>
      </div>
    </div>
  </AppModal>
</template>

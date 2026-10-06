# Design System, Componentes e Formulários

Ao implementar interfaces de usuário no Convocai, **sempre utilize os componentes base existentes** em `src/components/`. Não crie elementos HTML nativos (como `<button>` ou `<input>`) se houver um `App` correspondente.

## 1. APIs dos Componentes Base (Design System)

### AppButton
Use para todos as ações do usuário.
```vue
<AppButton variant="fill" color="primary" size="medium" :is-loading="false" :disabled="false">
  <template #left-icon><AppIcon name="plus" /></template>
  Texto
</AppButton>
```
- **variant**: `fill` | `outline` | `link` | `rounded` | `ghost`
- **color**: `primary` | `secondary` | `info` | `white`
- **size**: `large` | `medium` | `small` | `full`

### AppInput
Use para campos de texto em formulários.
```vue
<AppInput
  v-model="val"
  label="Rótulo *"
  placeholder="Digite aqui..."
  :error="errorMsg"
  @blur="touchFn"
/>
```

### AppModal (Modais de Conteúdo / Formulário)
Use para exibir formulários ou conteúdos longos flutuantes.
```vue
<AppModal ref="modalRef" title="Título" size="md" align="center">
  <!-- Conteúdo do Modal -->
</AppModal>
```
- **Props**: `title`, `size: 'sm' | 'md' | 'lg'`, `align: 'top' | 'center' | 'bottom'`
- **Eventos**: `@on-modal-close`
- **Expose**: `openModal()`, `closeModal()`

### AppDialog (Alertas de Confirmação)
Use exclusivamente para confirmações (ex: "Tem certeza que deseja excluir?").
```vue
<AppDialog
  ref="dialogRef"
  header="Confirmar"
  message="Sua mensagem."
  @confirm-action="acaoConfirmar"
/>
```
- **Props**: `header`, `message`
- **Eventos**: `@confirm-action`
- **Expose**: `openModal()`

---

## 2. Formulários e Validação (Vuelidate)

Formulários de criação e edição devem ser criados na pasta `src/components/forms/{EntityName}Form.vue` (ex: `AddressForm.vue`). A interface de dados deve ser extraída do respectivo Service.

Utilize o `@vuelidate/core` e os validadores globais (ou customizados do projeto).
Sempre confira os helpers em `src/composables/useFormValidator.ts` (ex: `requiredTrimmed`, `zipCode`, `uf`, `onlyLetters`).

---

## 3. Notificações (useToast)
Sempre notifique o usuário sobre o resultado de operações assíncronas.

```typescript
import { useToast } from '@/composables/useToast';
const toast = useToast();

toast.success('Criado com sucesso!');
toast.error('Ocorreu um erro.');
toast.info('Carregando...');
toast.warning('Atenção.');
```

---

## 4. Checklist de Validação Final (View / Form)

Antes de considerar uma View concluída, valide se:
- [ ] TypeScript está limpo (sem `any` ou `unknown`).
- [ ] Imports internos usam o alias absoluto `@/`.
- [ ] Há um loader (`<AppSpinnerLoaderLoader />`) protegendo chamadas assíncronas.
- [ ] O `AppModal` invoca `closeModal()` corretamente após um envio com sucesso.
- [ ] O form reseta seus dados reativos (limpa o estado local) quando o usuário cancela ou fecha.

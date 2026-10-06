# Arquitetura Frontend e Componentização

A arquitetura do Convocai separa claramente estado global, lógica de chamadas HTTP e componentes de UI. O fluxo de dados é estritamente unidirecional.

## A Cadeia de Responsabilidade

1. **API Client (`src/services/api/`)**: Instância configurada do Axios (com interceptors e tratamento base de JWT).
2. **Services (`src/services/`)**: Agrupam as chamadas aos endpoints (ex: `authService.ts`, `membersService.ts`). Não armazenam estado. Retornam Promises.
3. **Stores (`src/stores/`)**: Gerenciadores de estado global usando Pinia. As Stores "chamam" os Services, tratam os dados retornados e os armazenam reativamente. Usam o plugin `pinia-plugin-persistedstate` se o estado precisar persistir entre reloads.
4. **Views (`src/views/`)**: São as páginas da aplicação. São "Componentes Inteligentes" (Smart Components). Eles injetam as Stores (`useMembersStore()`), solicitam dados no `onMounted` e passam esses dados via `props` para os componentes filhos.
5. **Components (`src/components/`)**: Elementos visuais (Cards, Modais, Botões, Forms). São "Componentes Burros" (Dumb Components).

---

## Smart vs Dumb Components

O erro mais comum em desenvolvimento Vue é acoplar stores globais dentro de componentes visuais pequenos.

### Dumb Components (O Padrão para `src/components/`)
- Eles **NÃO** sabem o contexto em que estão sendo usados.
- Eles **NÃO** importam o `vue-router` ou o `pinia`.
- Eles **recebem** todos os dados que precisam via `defineProps`.
- Eles **avisam** o mundo externo sobre interações via `defineEmits`.

*Exemplo Correto:*
Um `AppMemberCard.vue` recebe `prop: { member: Member }` e emite `@select-member="member.id"`.

*Exemplo Errado:*
Um `AppMemberCard.vue` importa `useMembersStore` e chama `membersStore.select(props.member.id)` internamente.

### Smart Components (O Padrão para `src/views/`)
- Eles representam páginas inteiras ou painéis orquestradores.
- Eles interagem ativamente com a Pinia e o Vue Router.
- Eles ouvem os eventos (`@select-member`) emitidos pelos *Dumb Components* e então executam a ação lógica chamando a Store correspondente.

## Lógica Compartilhada (Composables)
Lógicas reativas e de ciclo de vida que precisam ser reutilizadas (ex: manipular breakpoints, interagir com janelas, ou listeners complexos) devem ser isoladas na pasta `src/composables/` seguindo a convenção `useFeatureName.ts`.

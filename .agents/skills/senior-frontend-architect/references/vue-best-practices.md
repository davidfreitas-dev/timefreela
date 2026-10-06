# Vue 3: Workflow e Melhores Práticas Arquiteturais

Siga estritamente este workflow de melhores práticas para garantir uma interface sustentável, testável e performática.

## 1. Princípios Core
- **Estado Previsível**: Mantenha uma única fonte de verdade e derive o restante (via `computed`).
- **Fluxo de Dados Explícito**: Props descem (Props down), Eventos sobem (Events up) na grande maioria dos casos.
- **Leitura em 1º Lugar**: Escreva código claro e auto-documentado.

---

## 2. Estrutura SFC (Single-File Component)
- **Ordem Obrigatória**: Mantenha as seções do arquivo estritamente nesta ordem: `<script setup lang="ts">` → `<template>` → `<style scoped>`.
- **Templates Declarativos e Seguros**: Não insira lógica complexa (matemática, manipulações de array/string) no `<template>`. Extraia tudo para propriedades `computed` no script.

---

## 3. Limites e Divisão de Componentes (Splitting Triggers)
Não crie componentes "Monstro" (Mega Components). Prefira a composição.

**Regras Objetivas de Divisão**: Divida o componente IMEDIATAMENTE se qualquer uma destas condições for verdadeira:
1. Ele possui, ao mesmo tempo, orquestração de estado/dados E marcação visual complexa para várias seções.
2. Ele tem 3 ou mais seções visuais distintas (ex: formulário + filtros + lista + rodapé/status).
3. Um bloco de template se repete ou tem potencial para ser reutilizado em outro lugar (ex: linhas de tabela, cards).

**Regra das Views Magras (Route Views)**:
- Os componentes de nível de Rota (`src/views/`) devem ser "finos" (Thin). Eles servem como "App Shell", wire de Providers/Stores e composição de features.
- NUNCA coloque a implementação visual e lógica inteira de uma feature diretamente na View.

**Regra de Componentes de CRUD/Listagem**:
Para telas de listas e cadastros, quebre no mínimo nestas partes:
- 1 Componente Container (A View)
- 1 Componente de Formulário / Input
- 1 Componente de Lista e/ou Item
- 1 Componente de Status / Ações

---

## 4. Fluxo de Dados e Reatividade

- **`ref` vs `reactive`**: Use `ref()` por padrão para manter a consistência e segurança ao reatribuir dados. Use `reactive()` apenas quando agrupar estados que formam um único domínio inseparável e cuja referência principal nunca será sobrescrita.
- **Desestruturação de Props**: NUNCA use desestruturação clássica de JS no `defineProps` se for usar o dado reativamente no script (use os macros atualizados do Vue ou `toRefs`).
- **Contratos Claros**: Use `defineProps` e `defineEmits` rigorosamente tipados usando as interfaces de `src/types/`.
- **Limites do `v-model`**: Use `v-model` APENAS para criar contratos que sejam verdadeiramente bidirecionais (ex: componentes de Input customizados).
- **Limites do `provide/inject`**: Use apenas para injetar dependências profundas na árvore de componentes ou contextos globais compartilhados. Não use como muleta para fugir da passagem de `props`.

---

## 5. Design de Composables
- **Responsabilidade**: Extraia lógica para `src/composables/` quando for reutilizável, contiver estado local complexo ou for pesada em "side-effects".
- **Assinatura**: Inicie sempre com `use` (ex: `useUserSession.ts`). APIs pequenas, tipadas e previsíveis.
- **Retorno Seguro**: Sempre retorne propriedades reativas embaladas em `ref` a partir do composable, para permitir a desestruturação limpa por quem os importa sem perder a reatividade.

---

## 6. Features Opcionais (Use apenas quando demandado)
Não adicione complexidade prematura. Use estas features nativas APENAS se o requisito funcional exigir:
- `<Teleport>`: Para modais, overlays e portais.
- `<KeepAlive>`: Para cache de views que não podem perder estado ao trocar de aba.
- `<Suspense>`: Para criar fronteiras de carregamento assíncrono (fallback) na árvore.
- `<Transition>` / `<TransitionGroup>`: Para efeitos visuais de entrada/saída ou mutações animadas em listas.

---

## 7. Performance (Pós-Funcionalidade)
A otimização de performance deve ser feita **após** a funcionalidade principal estar correta e validada.
- **Virtualização**: Use para grandes listas de renderização que geram gargalos.
- **Diretivas `v-once` / `v-memo`**: Use para impedir re-renderizações desnecessárias em sub-árvores visuais estáticas ou pesadas.
- **Evite Over-abstraction**: Em listas com centenas de itens sendo alteradas rapidamente, evite abstrair cada pedacinho do item em componentes ultra aninhados, pois a criação de instâncias Vue tem um custo de performance.

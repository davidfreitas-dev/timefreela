# Time Freela - Documentação Oficial

## 📚 Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Como Executar o Projeto](#3-como-executar-o-projeto)
4. [Estrutura de Navegação (Mapa de Páginas)](#4-estrutura-de-navegação-mapa-de-páginas)
5. [Arquitetura Frontend (Vue 3 + Pinia)](#5-arquitetura-frontend-vue-3--pinia)
6. [Integração com Firestore (Data Model)](#6-integração-com-firestore-data-model)
7. [Testes Manuais](#7-testes-manuais)
8. [Deploy](#8-deploy)
9. [Glossário](#9-glossário)

---

## 1. Visão Geral do Projeto

### Propósito
TimeFreela é um web app criado para **programadores freelancers** que desejam **cronometrar, organizar e documentar seus trabalhos com precisão e profissionalismo**, oferecendo também controle financeiro por projeto.

### Funcionalidades Implementadas
- **Autenticação**: Login e Registro via Firebase Auth.
- **Gestão de Projetos**: Controle de valor/hora ou preço fixo.
- **Timer em Tempo Real**: Rastreamento de sessões com persistência (mesmo ao fechar o navegador).
- **Sessões**: Histórico detalhado e registro manual de horas.
- **Financeiro**: Cálculo automático de valores pendentes e faturados.
- **Relatórios**: Visualização gráfica com Chart.js e exportação em PDF (jsPDF).

---

## 2. Stack Tecnológica

- **Framework**: [Vue 3](https://vuejs.org/) (Composition API)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **Estado Global**: [Pinia](https://pinia.vuejs.org/) (com `pinia-plugin-persistedstate`)
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend/DB/Auth**: [Firebase](https://firebase.google.com/) (Firestore & Auth)
- **Componentes UI**: [Headless UI](https://headlessui.com/)
- **Gráficos**: [Chart.js](https://www.chartjs.org/) + [Vue-Chartjs](https://vue-chartjs.org/)
- **Manipulação de Datas**: [Day.js](https://day.js.org/)
- **Validação**: [Vuelidate](https://vuelidate-next.netlify.app/)

---

## 3. Como Executar o Projeto

### Pré-requisitos
- Node.js (v18 ou superior)
- Conta no Firebase

### Passo a Passo

1. **Clonar o repositório**
   ```bash
   git clone <url-do-repositorio>
   cd timefreela
   ```

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Configurar Variáveis de Ambiente**
   Crie um arquivo `.env` na raiz do projeto com as chaves do seu projeto Firebase (use o `.env.example` como base):
   ```env
   VITE_FIREBASE_API_KEY=sua_api_key
   VITE_FIREBASE_AUTH_DOMAIN=seu_projeto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu_projeto_id
   VITE_FIREBASE_STORAGE_BUCKET=seu_projeto.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   VITE_FIREBASE_APP_ID=seu_app_id
   ```

4. **Rodar em desenvolvimento**
   ```bash
   npm run dev
   ```

5. **Build para produção**
   ```bash
   npm run build
   ```

---

## 4. Estrutura de Navegação (Mapa de Páginas)

- `/login` – Acesso à conta
- `/register` – Criação de perfil
- `/dashboard` – Resumo geral e métricas
- `/projects` – Listagem e gestão de projetos
- `/sessions` – Histórico de todas as sessões trabalhadas
- `/timer` – Interface principal de controle de tempo
- `/reports` – Gráficos e exportação de PDF
- `/settings` – Perfil do usuário

---

## 5. Arquitetura Frontend (Vue 3 + Pinia)

### Estrutura de Pastas
```
src/
├── api/          # Configuração direta de chamadas Firestore
├── assets/       # Imagens e ícones estáticos
├── components/   # Componentes reutilizáveis (UI e Layout)
├── composables/  # Lógica compartilhada (useTimer, useBilling, etc)
├── constants/    # Enums e strings constantes
├── lib/          # Instâncias de bibliotecas (Firebase, Dayjs, jsPDF)
├── services/     # Regras de negócio e abstração do Firebase
├── stores/       # Gerenciamento de estado (Pinia)
├── types/        # Definições de interfaces TypeScript
└── views/        # Componentes de página (Roteamento)
```

---

## 6. Integração com Firestore (Data Model)

### Principais Coleções:
- **users**: Perfil e preferências.
- **projects**: Configurações de faturamento e status.
- **sessions**: Registros de tempo vinculados a projetos e usuários.

---

## 7. Testes Manuais

Para garantir a qualidade da aplicação antes de cada release, siga o roteiro detalhado em:
👉 **[TESTING_GUIDE.md](./TESTING_GUIDE.md)**

---

## 8. Deploy

O projeto está configurado para deploy automático no **Firebase Hosting** via GitHub Actions sempre que houver merge na branch `main`.

---

## 9. Glossário

| Termo            | Definição |
|------------------|----------|
| Sessão           | Intervalo de tempo trabalhado em um projeto. |
| Faturada         | Sessão que já foi cobrada ou paga pelo cliente. |
| Hourly Rate      | Valor cobrado por cada hora trabalhada. |
| Fixed Price      | Valor total fechado para o projeto, independente das horas. |
| Timer Persistence| Capacidade do cronômetro continuar contando mesmo após fechar a aba. |
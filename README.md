<img src="src/assets/logo.png" alt="Logo Time Freela" width="400">

# Documentação Oficial

## 📚 Índice

1. [Visão Geral do Projeto](#1-visão-geral-do-projeto)
2. [Requisitos Funcionais](#2-requisitos-funcionais)
3. [Requisitos Não Funcionais](#3-requisitos-não-funcionais)
4. [Estrutura de Navegação (Mapa de Páginas)](#4-estrutura-de-navegação-mapa-de-páginas)
5. [Arquitetura Frontend (Vue 3 + Pinia)](#5-arquitetura-frontend-vue-3--pinia)
6. [Autenticação (Firebase Auth)](#6-autenticação-firebase-auth)
7. [Integração com Firestore](#7-integração-com-firestore)
8. [Geração de Relatórios](#8-geraçã-de-relatórios)
9. [Gestão Financeira](#9-gestão-financeira)
10. [Design e UX](#10-design-e-ux)
11. [Testes](#11-testes)
12. [Deploy](#12-deploy)
13. [Glossário](#13-glossário)
14. [Extras (Planejados/Futuros)](#14-extras-planejadosfuturos)

## 1. Visão Geral do Projeto

### Propósito
TimeFreela é um web app criado para **programadores freelancers** que desejam **cronometrar, organizar e documentar seus trabalhos com precisão e profissionalismo**, oferecendo também controle financeiro por projeto.

### Público-alvo
- Desenvolvedores autônomos
- Profissionais de tecnologia que trabalham com múltiplos clientes
- Agências com times freelancers

### Funcionalidades-chave
- Cronômetro e registro manual de tempo
- Organização por projeto e tags
- Relatórios em PDF/CSV
- Painel financeiro com valor/hora
- UI responsiva e intuitiva

### Benefícios
- Controle profissional de tempo e faturamento
- Agilidade na criação de relatórios
- Redução de erros manuais
- Pronto para expansão (preço fixo, pacotes mensais)

## 2. Requisitos Funcionais

- Autenticação Firebase (Google e email/senha)
- Projetos com título, cliente, descrição e valor/hora
- Cronômetro com início, pausa e fim
- Registro manual de sessões
- Sessões organizadas por projeto/período
- Relatórios PDF/CSV
- Marcação de sessões como faturadas
- Tags/categorias para projetos
- Dashboard com horas, faturamento, sessões pendentes
- Valor/hora por projeto
- Painel financeiro com filtros e totais
- Expansões futuras para preço fixo e pacotes

## 3. Requisitos Não Funcionais

- Responsividade mobile
- Armazenamento em nuvem (Firestore)
- Carregamento abaixo de 2s
- Regras de segurança no Firestore
- Backup automático via Firebase
- UI moderna com TailwindCSS
- Acessibilidade com `aria`, contraste e navegação por teclado

## 4. Estrutura de Navegação (Mapa de Páginas)

- `/login` – Login
- `/dashboard` – Visão geral
- `/projects` – Lista de projetos
  - `/projects/:id` – Detalhes do projeto
- `/timer` – Cronômetro
- `/reports` – Relatórios
- `/profile` – Perfil
- `/settings` – Configurações

## 5. Arquitetura Frontend (Vue 3 + Pinia)

### Estrutura de Pastas
```
src/
├── components/
├── views/
├── stores/
├── composables/
├── router/
├── assets/
└── utils/
```

### Stores
- `authStore`, `projectStore`, `sessionStore`, `reportStore`

### Composables
- `useTimer`, `useBilling`, `useExport`

### Roteamento
- SPA com vue-router, lazy loading, middleware de proteção

## 6. Autenticação (Firebase Auth)

- Login com Google/email
- Persistência com `onAuthStateChanged`
- Middleware de proteção
- Armazenado na `authStore`

## 7. Integração com Firestore

### Estrutura
```
users/{userId}
  - profile
  - settings

projects/{projectId}
  - userId
  - title
  - description
  - tags
  - hourlyRate

sessions/{sessionId}
  - projectId
  - userId
  - startTime
  - endTime
  - duration
  - isManual
  - isBilled
```

### Segurança
- Regras baseadas em `userId`
- Escritas com batch para múltiplas sessões

## 8. Geração de Relatórios

- PDF com jsPDF
- CSV com agrupamentos
- Filtros por projeto, cliente, status
- Totais de horas, valores e faturamento

## 9. Gestão Financeira

- Valor/hora por projeto
- Sessões mostram valor estimado
- Marcação: a faturar, faturada, não faturável
- Painel financeiro com totais
- Planejado: preço fixo e pacotes mensais

## 10. Design e UX

- TailwindCSS, responsivo
- Cores: azul, cinza escuro, branco
- Dark mode nativo
- Animações com `framer-motion`
- UI acessível

## 11. Testes

- Unitários com Vitest
- Integração nas stores
- Componentes com Vue Test Utils
- Cobertura mínima recomendada: 80%

## 12. Deploy

- Firebase Hosting
- Domínio customizado
- CI/CD com GitHub Actions

## 13. Glossário

| Termo            | Definição |
|------------------|----------|
| Sessão           | Tempo cronometrado/manual de trabalho |
| Faturada         | Sessão paga ou enviada para cliente |
| Valor/hora       | Preço por hora definido no projeto |
| Projeto fixo     | Projeto com valor fechado |
| Pacote mensal    | Cobrança recorrente mensal |
| Tag              | Classificação de projeto ou sessão |

## 14. Extras (Planejados/Futuros)

- Modo escuro
- Mini-timer flutuante
- Integração com Notion/Trello
- Notificações por e-mail sobre faturamento
- Suporte a contratos, pacotes e valor por funcionalidade
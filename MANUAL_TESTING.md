# Guia de Testes Manuais - TimeFreela

Este documento descreve o passo a passo para testar manualmente as principais funcionalidades da aplicação TimeFreela.

---

## 1. Autenticação e Perfil

### 1.1 Cadastro de Usuário
- **Caminho:** `/register`
- **Passos:**
  1. Acesse a tela de registro.
  2. Tente enviar o formulário vazio (deve exibir erros de validação).
  3. Preencha um e-mail inválido (deve validar formato).
  4. Preencha apenas o primeiro nome (deve exibir erro "Digite nome e sobrenome").
  5. Preencha Nome completo, E-mail e Senha válidos.
  6. Clique em "Cadastrar".
- **Resultado Esperado:** Usuário redirecionado para o Dashboard com mensagem de sucesso.

### 1.2 Login e Logout
- **Caminho:** `/login`
- **Passos:**
  1. Realize o logout (clicando no botão de sair no menu).
  2. Tente acessar `/` (deve redirecionar para `/login`).
  3. Insira credenciais inválidas (deve exibir erro do Firebase).
  4. Insira credenciais válidas e clique em "Entrar".
- **Resultado Esperado:** Acesso liberado ao sistema.

### 1.3 Gerenciamento de Perfil
- **Caminho:** `/profile`
- **Passos:**
  1. **Alterar Dados:** Altere seu nome e clique em "Salvar Alterações".
  2. **Alterar E-mail:** Tente alterar o e-mail (deve abrir um modal pedindo a senha atual). Insira a senha correta para confirmar.
  3. **Alterar Senha:** Clique em "Alterar Senha", preencha a senha atual, a nova senha (mín. 6 caracteres) e a confirmação.
  4. **Excluir Conta:** Clique em "Excluir Conta", confirme no diálogo de aviso e depois insira sua senha no modal de segurança.
- **Resultado Esperado:** As informações devem ser atualizadas corretamente. No caso da exclusão, o usuário deve ser redirecionado para o login e todos os seus dados removidos.

---

## 2. Gestão de Projetos

### 2.1 Criar Novo Projeto
- **Caminho:** `/projects/new`
- **Passos:**
  1. Preencha Título (mín. 3 caracteres) e Descrição.
  2. Adicione tags separadas por vírgula (ex: `web, dev`).
  3. Selecione "Valor por hora" e defina um valor.
  4. Alterne para "Valor fixo" e defina um tempo estimado em horas.
  5. Clique em "Confirmar".
- **Resultado Esperado:** Projeto listado na tela de projetos.

### 2.2 Listagem e Edição
- **Caminho:** `/projects`
- **Passos:**
  1. Verifique se o projeto criado aparece na lista.
  2. Use a barra de pesquisa para filtrar pelo nome do projeto.
  3. Clique no ícone de editar em um projeto.
  4. Altere o status para "Inativo" e salve.
- **Resultado Esperado:** O projeto deve refletir as mudanças na listagem.

---

## 3. Gestão de Sessões e Cronômetro

### 3.1 Cronômetro (Timer)
- **Caminho:** `/timer` ou Widget na Sidebar
- **Passos:**
  1. Selecione um projeto no seletor do cronômetro.
  2. Clique em "Iniciar".
  3. Clique em "Pausar" e depois em "Retomar".
  4. Atualize a página (F5) enquanto o cronômetro corre (deve persistir).
  5. Tente fechar a aba/janela do navegador com o cronômetro rodando (deve exibir um aviso de confirmação de saída).
  6. Clique em "Parar e Salvar".
- **Resultado Esperado:** O cronômetro deve ser salvo no histórico de sessões.

### 3.2 Lançamento Manual de Sessão
- **Caminho:** `/sessions/new`
- **Passos:**
  1. Selecione um projeto.
  2. Escolha uma data e horários de início/término.
  3. Marque a opção "Sessão faturada".
  4. Tente colocar um horário de término menor que o de início (deve exibir erro).
  5. Clique em "Confirmar".
- **Resultado Esperado:** Sessão registrada com sucesso.

---

## 4. Dashboard e Relatórios

### 4.1 Visualização de Dados
- **Caminho:** `/dashboard`
- **Passos:**
  1. Verifique os cards: "Horas Trabalhadas", "Faturamento Estimado", "Receita Faturada" e "Receita Pendente".
  2. Verifique se o gráfico de barras exibe dados para o ano selecionado.
  3. Altere o filtro de ano no gráfico e verifique se a tabela de faturamento abaixo também atualiza para o período.
- **Resultado Esperado:** Os dados devem ser consistentes em todos os componentes.

### 4.2 Filtros e Exportação
- **Caminho:** `/dashboard` (Seção inferior)
- **Passos:**
  1. Use o filtro de data (intervalo) para selecionar um período específico.
  2. Filtre por status (Todos / Faturados / Não Faturados).
  3. Pesquise por um projeto específico na barra de busca da tabela.
  4. Clique em "Exportar PDF" e "Exportar CSV".
- **Resultado Esperado:** Download dos arquivos com os dados respeitando os filtros aplicados.

---

## 5. Configurações e Backup

### 5.1 Sistema e Temas
- **Caminho:** `/settings`
- **Passos:**
  1. Alterne o interruptor de "Modo Escuro".
- **Resultado Esperado:** O tema do sistema deve mudar instantaneamente e persistir após o recarregamento.

### 5.2 Backup e Restauração
- **Caminho:** `/settings`
- **Passos:**
  1. Clique em "Exportar Backup (JSON)".
  2. Verifique o arquivo baixado.
  3. Clique em "Restaurar Backup (JSON)" e selecione o arquivo.
  4. Confirme no diálogo de aviso que detalha a quantidade de projetos e sessões a serem importados.
- **Resultado Esperado:** O sistema deve recarregar com os dados vindos do arquivo JSON, substituindo os atuais.

---

## 6. Responsividade e UX
- **Passos:**
  1. Reduza o tamanho da janela do navegador (simulando mobile).
  2. Verifique se o menu lateral se transforma em um menu retrátil (Drawer) ou desaparece para dar lugar ao menu mobile.
  3. Verifique se os cards do Dashboard se empilham verticalmente.
  4. Verifique se as tabelas permitem rolagem horizontal ou se adaptam.
- **Resultado Esperado:** Interface totalmente utilizável e visualmente correta em dispositivos móveis.

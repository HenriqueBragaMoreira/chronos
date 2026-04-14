================================================================================
                        CHRONOS — ROADMAP DE DESENVOLVIMENTO
================================================================================

Projeto: Chronos — App desktop de gerenciamento de tarefas domésticas com
         recorrência, notificações e dashboard de produtividade
Stack: Tauri v2 (Rust) | Frontend: React 19 + Vite + Tailwind + shadcn/ui
       | DB: PostgreSQL (Docker local / Supabase prod) | ORM: sqlx
Última atualização: 2026-04-12

================================================================================
FASE 1 — SETUP & INFRAESTRUTURA
================================================================================

1.1  [done] Criar projeto Tauri v2 com React 19 + TypeScript + Vite
     - Scaffold inicial com pnpm create tauri-app
     - Refs: NFR-001

1.2  [done] Configurar Tailwind CSS v4 com plugin Vite
     - Instalar tailwindcss e @tailwindcss/vite
     - Adicionar plugin ao vite.config.ts
     - Substituir index.css por @import "tailwindcss"
     - Refs: FR-022

1.3  [done] Configurar path alias @/ no TypeScript e Vite
     - Adicionar baseUrl e paths no tsconfig.json
     - Adicionar resolve.alias no vite.config.ts
     - Refs: NFR-001

1.4  [done] Inicializar shadcn/ui com tema zinc e dark mode
     - Executar shadcn init com componentes base (button, utils)
     - Gerar CSS variables para light e dark mode
     - Configurar components.json com aliases
     - Refs: FR-022

1.5  [done] Configurar React Router v7 com layout e rotas
     - Instalar react-router
     - Criar BrowserRouter com 4 rotas: /, /tasks, /calendar, /settings
     - Criar RootLayout com sidebar + Outlet
     - Refs: NFR-001

1.6  [done] Criar sidebar de navegação com NavLink ativo
     - 4 itens: Dashboard, Tarefas, Calendário, Configurações
     - Estilo ativo com destaque visual
     - Labels em pt-BR
     - Refs: FR-024

1.7  [done] Criar páginas placeholder para cada rota
     - dashboard.tsx, tasks.tsx, calendar.tsx, settings.tsx
     - Conteúdo stub com título e descrição

1.8  [done] Configurar Docker Compose com PostgreSQL 16
     - Container chronos-db com PostgreSQL 16 Alpine na porta 5434
     - Volume persistente pgdata
     - Refs: FR-028

1.9  [done] Criar .env e .env.example com connection string
     - DATABASE_URL=postgresql://chronos:chronos@localhost:5434/chronos
     - Adicionar .env ao .gitignore
     - Refs: FR-028

1.10 [done] Adicionar sqlx com suporte a PostgreSQL no Cargo.toml
     - sqlx 0.8 com features: runtime-tokio, postgres, chrono, uuid, migrate
     - tokio, dotenvy, chrono, uuid como dependências
     - Refs: FR-028, FR-029

1.11 [done] Criar módulo db.rs com pool de conexão e auto-migrations
     - PgPoolOptions com max 5 conexões
     - sqlx::migrate!() roda migrations pendentes no startup
     - Refs: FR-028, FR-029

1.12 [done] Criar AppState com PgPool gerenciado via Tauri state
     - Struct AppState com campo db: PgPool
     - Pool inicializado no setup hook do Tauri Builder
     - Refs: FR-028

1.13 [done] Criar migration inicial com schema completo
     - Tabela tasks: id, name, description, category, priority, due_date,
       due_time, recurrence_type, recurrence_value, is_deleted, timestamps
     - Tabela task_occurrences: id, task_id, due_date, completed, completed_at
     - Tabela settings: singleton (id=1), notification_time, theme, default_view
     - Indexes em campos frequentemente consultados
     - Refs: FR-028, FR-029

1.14 [done] Configurar tauri-plugin-notification com capabilities
     - Adicionar tauri-plugin-notification no Cargo.toml
     - Habilitar feature tray-icon no tauri
     - Permissões: notify, request-permission, is-permission-granted, etc.
     - Refs: FR-010, FR-011

1.15 [done] Criar documentação do projeto
     - docs/REQUIREMENTS.md com 34 requisitos (FR + NFR)
     - docs/BUSINESS-RULES.md com 15 regras de negócio
     - AGENTS.md + CLAUDE.md (symlink) com guidelines

================================================================================
FASE 2 — MODELS & STRUCTS RUST (API)
================================================================================

2.1  [done] Criar struct Task com derive Serialize/Deserialize
     - Campos mapeados 1:1 com tabela tasks
     - Usar chrono::NaiveDate para due_date, Option<NaiveTime> para due_time
     - Usar uuid::Uuid para id
     - Refs: FR-001, FR-028

2.2  [done] Criar struct TaskOccurrence com derive Serialize/Deserialize
     - Campos mapeados 1:1 com tabela task_occurrences
     - Campo derivado overdue_since calculado em runtime
     - Refs: FR-008, BR-002

2.3  [done] Criar struct CreateTaskRequest para input de criação
     - Todos os campos exceto id, is_deleted e timestamps
     - Validação: name não vazio, due_date obrigatório
     - recurrence_value obrigatório quando recurrence_type != none
     - Refs: FR-001, FR-006

2.4  [done] Criar struct UpdateTaskRequest para input de edição
     - Todos os campos como Option<T> (partial update)
     - id obrigatório para identificar a tarefa
     - Refs: FR-002

2.5  [done] Criar struct TaskWithOccurrence para resposta combinada
     - Task + occurrence atual (pendente ou atrasada)
     - Status derivado: pending, completed, overdue
     - Campo overdue_days: Option<i64> para exibição no frontend
     - Refs: BR-004, FR-005, FR-008

2.6  [done] Criar struct Settings com derive Serialize/Deserialize
     - Campos mapeados 1:1 com tabela settings
     - Refs: FR-025, FR-026, FR-027

2.7  [done] Criar enums para tipos com variantes fixas
     - RecurrenceType: None, Weekly, Interval, Monthly
     - Priority: Low, Medium, High
     - Theme: Light, Dark, System
     - DefaultView: Dashboard, CalendarMonthly, CalendarWeekly, List
     - Impl Display e FromStr para conversão com banco
     - Refs: FR-006, BR-005

================================================================================
FASE 3 — TAURI COMMANDS: CRUD DE TAREFAS (API)
================================================================================

3.1  [done] Implementar command create_task
     - Receber CreateTaskRequest, inserir na tabela tasks
     - Gerar primeira task_occurrence com due_date da tarefa
     - Retornar Task criada
     - Refs: FR-001, BR-004

3.2  [done] Implementar command get_tasks com filtros
     - Parâmetros opcionais: filter (today/overdue/all), category, priority
     - JOIN com task_occurrences para trazer occurrence atual
     - Calcular status derivado (pending/completed/overdue) em runtime
     - Ordenação por due_date (padrão), prioridade ou nome
     - Excluir tarefas com is_deleted = true
     - Refs: FR-005, BR-004

3.3  [done] Implementar command get_task por id
     - Buscar tarefa + occurrence atual
     - Retornar TaskWithOccurrence
     - Refs: FR-002

3.4  [done] Implementar command update_task
     - Receber UpdateTaskRequest, atualizar campos não-nulos
     - Se recurrence_type mudar, recalcular próxima occurrence
     - Atualizar updated_at
     - Refs: FR-002

3.5  [not started] Implementar command delete_task (soft delete)
     - Setar is_deleted = true (não apaga do banco)
     - Preservar task_occurrences existentes para histórico
     - Exigir confirmação via frontend (não na API)
     - Refs: FR-003, BR-014

3.6  [not started] Implementar command complete_task
     - Receber task_id e occurrence_id
     - Setar completed = true e completed_at = now()
     - Se tarefa é recorrente: gerar próxima occurrence (delegar para Fase 5)
     - Retornar occurrence atualizada
     - Refs: FR-004, BR-001

3.7  [not started] Implementar command get_categories
     - SELECT DISTINCT category FROM tasks WHERE is_deleted = false
     - Retornar lista de strings para autocomplete no frontend
     - Refs: BR-015

3.8  [not started] Registrar todos os commands no invoke_handler do Tauri
     - Adicionar ao tauri::generate_handler![]
     - Remover command greet placeholder
     - Refs: FR-028

================================================================================
FASE 4 — COMPONENTES UI: FORMULÁRIO DE TAREFAS (DESKTOP-UI)
================================================================================

4.1  [not started] Instalar componentes shadcn necessários
     - sheet, dialog, input, textarea, select, label, badge, separator,
       popover, calendar, command, sonner (toast)
     - Refs: FR-023

4.2  [not started] Criar componente TaskForm (Sheet lateral)
     - Campos: nome (input), descrição (textarea), categoria (combobox com
       autocomplete de categorias existentes), prioridade (select: alta/média/baixa),
       data de vencimento (date picker), horário (time input, opcional),
       tipo de recorrência (select: nenhuma/semanal/intervalo/mensal),
       valor de recorrência (condicional: dia da semana / número de dias / dia do mês)
     - Reutilizado para criação e edição (recebe task opcional como prop)
     - Refs: FR-001, FR-002, FR-006, FR-023

4.3  [not started] Implementar validação client-side no TaskForm
     - Nome obrigatório (não vazio)
     - Data de vencimento obrigatória
     - Valor de recorrência obrigatório quando tipo != nenhuma
     - Valor de recorrência semanal: dropdown com dias da semana em pt-BR
     - Valor de recorrência intervalo: input numérico (mín 1)
     - Valor de recorrência mensal: input numérico (1-31)
     - Refs: FR-001, FR-006

4.4  [not started] Conectar TaskForm ao backend via invoke()
     - Chamar create_task ou update_task conforme modo (criar/editar)
     - Exibir toast de sucesso/erro com sonner
     - Fechar Sheet após sucesso
     - Atualizar lista de tarefas após mutação
     - Refs: FR-001, FR-002

4.5  [not started] Criar componente CategoryCombobox
     - Buscar categorias existentes via get_categories
     - Permitir digitar nova categoria (texto livre)
     - Autocomplete com match parcial
     - Refs: BR-015

================================================================================
FASE 5 — PÁGINA DE TAREFAS (DESKTOP-UI)
================================================================================

5.1  [not started] Criar componente TaskItem para item individual
     - Exibir: checkbox, nome, categoria (badge), prioridade (badge colorido),
       data de vencimento formatada DD/MM/YYYY
     - Se atrasada: badge "Atrasada há X dias — desde DD/MM"
     - Checkbox para marcar como concluída (chama complete_task)
     - Clique no item abre Sheet de edição
     - Refs: FR-004, FR-005, FR-008, BR-002, BR-004

5.2  [not started] Criar componente TaskList com listagem
     - Buscar tarefas via get_tasks no mount
     - Renderizar lista de TaskItem
     - Estado de loading (skeleton)
     - Estado vazio com mensagem e CTA para criar tarefa
     - Refs: FR-005

5.3  [not started] Criar barra de filtros na TaskList
     - Filtro por período: Hoje, Atrasadas, Todas
     - Filtro por categoria: dropdown com categorias existentes
     - Filtro por prioridade: Alta, Média, Baixa
     - Ordenação: Data (padrão), Prioridade, Nome
     - Refs: FR-005

5.4  [not started] Criar botão "Nova Tarefa" que abre TaskForm
     - Botão flutuante ou fixo no topo da página
     - Abre Sheet em modo criação (sem task preenchida)
     - Refs: FR-001, FR-023

5.5  [not started] Implementar confirmação de exclusão de tarefa
     - Dialog de confirmação: "Tem certeza que deseja excluir esta tarefa?"
     - Para recorrentes: informar que ocorrências futuras serão canceladas
     - Chamar delete_task após confirmação
     - Refs: FR-003

5.6  [not started] Implementar página tasks.tsx completa
     - Compor TaskList + filtros + botão nova tarefa
     - Integrar TaskForm (Sheet)
     - Gerenciar estado de abertura do Sheet (criar/editar)
     - Refs: FR-001 a FR-005

================================================================================
FASE 6 — LÓGICA DE RECORRÊNCIA (API)
================================================================================

6.1  [not started] Criar módulo recurrence.rs com função calculate_next_date
     - Input: recurrence_type, recurrence_value, current_due_date
     - Output: NaiveDate da próxima ocorrência
     - Refs: BR-001, BR-005, BR-006, BR-007

6.2  [not started] Implementar cálculo para recorrência semanal
     - Próxima data = próximo dia da semana configurado após current_due_date
     - recurrence_value = 0 (domingo) a 6 (sábado)
     - Ex: current_due_date=terça, value=2 → próxima terça
     - Refs: BR-005

6.3  [not started] Implementar cálculo para recorrência por intervalo
     - Próxima data = current_due_date + N dias
     - N = recurrence_value
     - Refs: BR-006

6.4  [not started] Implementar cálculo para recorrência mensal
     - Próxima data = mesmo dia do próximo mês
     - Fallback: se dia não existe no mês, usar último dia
     - Ex: dia 31 em fevereiro → dia 28 (ou 29 em bissexto)
     - Refs: BR-007

6.5  [not started] Integrar geração de occurrence no complete_task
     - Após completar, chamar calculate_next_date
     - Inserir nova task_occurrence com a data calculada
     - Refs: FR-007, BR-001

6.6  [not started] Implementar query get_today_tasks
     - Retornar tarefas pendentes de hoje + todas as atrasadas (overdue)
     - Atrasadas: occurrence.due_date < today AND completed = false
     - Incluir campo overdue_days = today - due_date
     - Refs: FR-005, BR-002, BR-003, BR-010

================================================================================
FASE 7 — TESTES: CRUD & RECORRÊNCIA (API)
================================================================================

7.1  [not started] Configurar ambiente de testes Rust com banco de teste
     - Criar helper para setup de PgPool de teste (banco separado ou transações)
     - Garantir isolamento entre testes
     - Refs: NFR-005

7.2  [not started] Escrever testes unitários para calculate_next_date
     - Testar weekly: todas as variações de dia da semana
     - Testar interval: intervalos de 1, 7, 15, 30 dias
     - Testar monthly: meses com 28, 29, 30, 31 dias
     - Testar monthly fallback: dia 31 em fevereiro, abril, etc.
     - Refs: BR-005, BR-006, BR-007

7.3  [not started] Escrever testes de integração para create_task
     - Criar tarefa simples (sem recorrência)
     - Criar tarefa recorrente e verificar occurrence gerada
     - Validar campos obrigatórios (rejeitar nome vazio, sem data)
     - Refs: FR-001

7.4  [not started] Escrever testes de integração para complete_task
     - Completar tarefa simples: verificar completed_at
     - Completar tarefa recorrente: verificar nova occurrence gerada
     - Verificar que próxima data é baseada na original (não na conclusão)
     - Refs: FR-004, FR-007, BR-001

7.5  [not started] Escrever testes de integração para delete_task
     - Verificar soft delete (is_deleted = true, registro permanece)
     - Verificar que occurrences históricas são preservadas
     - Refs: FR-003, BR-014

7.6  [not started] Escrever testes para get_tasks com filtros
     - Filtro today: retorna apenas pendentes de hoje + atrasadas
     - Filtro overdue: retorna apenas atrasadas
     - Filtro por categoria e prioridade
     - Ordenação por data, prioridade, nome
     - Refs: FR-005

================================================================================
FASE 8 — CONFIGURAÇÕES (API + DESKTOP-UI)
================================================================================

8.1  [not started] Implementar command get_settings
     - Buscar row singleton (id=1) da tabela settings
     - Retornar struct Settings
     - Refs: FR-025, FR-026, FR-027

8.2  [not started] Implementar command update_settings
     - Atualizar campos da row singleton
     - Atualizar updated_at
     - Refs: FR-025, FR-026, FR-027

8.3  [not started] Criar página settings.tsx com formulário
     - Campo: horário de notificação (time picker, padrão 08:00)
     - Campo: som de notificação (toggle on/off)
     - Campo: tema (select: Claro, Escuro, Sistema)
     - Campo: visualização padrão (select: Dashboard, Calendário Mensal,
       Calendário Semanal, Lista)
     - Salvar automaticamente ao alterar (sem botão "salvar")
     - Refs: FR-025, FR-026, FR-027

8.4  [not started] Implementar ThemeProvider com toggle funcional
     - Ler preferência de tema do banco (via get_settings)
     - Aplicar classe .dark no <html> conforme tema selecionado
     - Modo "Sistema": respeitar prefers-color-scheme do OS
     - Persistir escolha no banco
     - Refs: FR-022, FR-026

8.5  [not started] Adicionar toggle de tema no header ou sidebar
     - Ícone sol/lua com transição
     - Acessível em qualquer tela
     - Refs: FR-022

================================================================================
FASE 9 — TRAY ICON & NOTIFICAÇÕES (API)
================================================================================

9.1  [not started] Criar módulo tray.rs com setup do tray icon
     - Ícone padrão do app na bandeja do sistema
     - Menu de contexto: "Abrir Chronos", "Tarefas de Hoje", separador, "Sair"
     - "Abrir" restaura a janela principal
     - "Tarefas de Hoje" restaura a janela e navega para /tasks?filter=today
     - "Sair" encerra o app completamente
     - Refs: FR-013

9.2  [not started] Configurar minimize-to-tray ao fechar janela
     - Interceptar evento de fechar janela (close_requested)
     - Em vez de encerrar, esconder a janela (window.hide())
     - Manter app rodando em background
     - Refs: FR-013, NFR-004

9.3  [not started] Implementar badge numérico no tray icon
     - Contar: tarefas pendentes hoje + todas as atrasadas
     - Atualizar badge em tempo real quando tarefas mudam
     - Usar set_badge_count ou gerar ícone dinâmico com número
     - Refs: FR-011, BR-010

9.4  [not started] Criar módulo scheduler.rs para notificações programadas
     - Loop assíncrono (tokio::spawn) que verifica o horário a cada minuto
     - Quando horário atual = notification_time configurado: disparar notificação
     - Prevenir disparo duplicado no mesmo dia (flag de "já notificou hoje")
     - Refs: FR-010, BR-008

9.5  [not started] Implementar disparo de notificação do sistema
     - Usar tauri-plugin-notification para enviar notificação nativa
     - Título: "Chronos — Tarefas do dia"
     - Corpo: listar nomes das tarefas pendentes e atrasadas
     - Refs: FR-010, BR-008, BR-009

9.6  [not started] Implementar som de notificação
     - Tocar som ao disparar notificação
     - Respeitar configuração notification_sound_enabled do settings
     - Refs: FR-012

9.7  [not started] Registrar tray e scheduler no setup do Tauri Builder
     - Inicializar tray no app.setup()
     - Spawnar scheduler como task assíncrona
     - Refs: FR-010, FR-013

================================================================================
FASE 10 — CALENDÁRIO (DESKTOP-UI)
================================================================================

10.1 [not started] Criar componente MonthlyCalendarView
     - Grade 7x5/6 com dias do mês
     - Cabeçalho com navegação (mês anterior/próximo)
     - Nomes dos dias em pt-BR (Dom, Seg, Ter, ...)
     - Refs: FR-019, FR-024

10.2 [not started] Renderizar tarefas nos dias do calendário mensal
     - Dots ou badges coloridos por status (pendente, concluída, atrasada)
     - Cores: verde (concluída), azul (pendente), vermelho (atrasada)
     - Clicar no dia expande lista de tarefas daquele dia
     - Refs: FR-019, BR-004

10.3 [not started] Criar componente WeeklyCalendarView
     - 7 colunas com mais espaço por dia
     - Exibir nome da tarefa + horário (se configurado) + descrição parcial
     - Navegação: semana anterior/próxima
     - Refs: FR-020

10.4 [not started] Renderizar tarefas na visualização semanal
     - Cards com mais detalhes que a visão mensal
     - Mesmas cores de status
     - Clicar na tarefa abre Sheet de edição
     - Refs: FR-020, BR-004

10.5 [not started] Criar toggle entre visualização mensal e semanal
     - Botões ou tabs: "Mensal" / "Semanal"
     - Persistir preferência na navegação (não no banco, só em state)
     - Refs: FR-021

10.6 [not started] Implementar command get_tasks_by_date_range
     - Parâmetros: start_date, end_date
     - Retornar todas as occurrences no range com dados da task
     - Otimizado para carregar um mês ou uma semana de dados
     - Refs: FR-019, FR-020

10.7 [not started] Implementar página calendar.tsx completa
     - Compor MonthlyCalendarView + WeeklyCalendarView + toggle
     - Integrar TaskForm (Sheet) para edição ao clicar em tarefa
     - Buscar dados via get_tasks_by_date_range
     - Refs: FR-019, FR-020, FR-021

================================================================================
FASE 11 — DASHBOARD (API + DESKTOP-UI)
================================================================================

11.1 [not started] Instalar biblioteca de gráficos (recharts)
     - Adicionar recharts como dependência
     - Refs: FR-016, FR-017

11.2 [not started] Implementar command get_completion_rate
     - Parâmetros: period (week/month/year)
     - Calcular: concluídas no prazo / total vencidas no período × 100
     - "No prazo" = completed_at <= due_date
     - Retornar: { on_time: number, late: number, missed: number, rate: number }
     - Refs: FR-014, BR-011

11.3 [not started] Implementar command get_streak
     - Calcular dias consecutivos sem tarefas atrasadas (a partir de hoje)
     - Calcular recorde histórico de streak
     - Retornar: { current: number, record: number }
     - Refs: FR-015, BR-012

11.4 [not started] Implementar command get_category_distribution
     - Agrupar tarefas por categoria
     - Contar pendentes + concluídas por categoria
     - Retornar: Vec<{ category: string, count: number }>
     - Refs: FR-016

11.5 [not started] Implementar command get_history
     - Parâmetros: granularity (week/month)
     - Agrupar occurrences por período
     - Retornar: Vec<{ period: string, completed: number, pending: number }>
     - Refs: FR-017

11.6 [not started] Implementar command get_most_forgotten
     - Calcular frequência de atraso por tarefa recorrente
     - Frequência = vezes atrasada / total de occurrences × 100
     - Retornar top 5 ordenadas por frequência decrescente
     - Refs: FR-018, BR-013

11.7 [not started] Criar componente CompletionRateCard
     - Exibir score % em destaque
     - Indicador visual: verde (>70%), amarelo (40-70%), vermelho (<40%)
     - Breakdown: no prazo / atrasadas / não feitas
     - Seletor de período (semana/mês/ano)
     - Refs: FR-014

11.8 [not started] Criar componente StreakCard
     - Número grande com streak atual
     - Subtítulo com recorde
     - Ícone de fogo/troféu
     - Refs: FR-015

11.9 [not started] Criar componente CategoryChart
     - Gráfico de pizza ou barras com distribuição por categoria
     - Legendas com nomes e contagens
     - Refs: FR-016

11.10 [not started] Criar componente HistoryChart
      - Gráfico de barras empilhadas: feitas vs pendentes por período
      - Toggle semana/mês
      - Refs: FR-017

11.11 [not started] Criar componente MostForgottenList
      - Lista top 5 tarefas mais esquecidas
      - Exibir nome + frequência de atraso (%)
      - Badge com categoria
      - Refs: FR-018

11.12 [not started] Implementar página dashboard.tsx completa
      - Layout em grid responsivo com todos os cards
      - Buscar dados de todas as métricas no mount
      - Loading state (skeleton cards)
      - Refs: FR-014 a FR-018

================================================================================
FASE 12 — TESTES DO FRONTEND (DESKTOP-UI)
================================================================================

12.1 [not started] Configurar Vitest + React Testing Library no projeto
     - Instalar vitest, @testing-library/react, @testing-library/jest-dom
     - Configurar vitest.config.ts com jsdom environment
     - Adicionar script "test" no package.json
     - Refs: NFR-005

12.2 [not started] Escrever testes para TaskForm
     - Validação de campos obrigatórios
     - Exibição condicional de valor de recorrência
     - Modo criação vs edição (preenchimento de valores)
     - Refs: FR-001, FR-002, FR-006

12.3 [not started] Escrever testes para TaskList e TaskItem
     - Renderização da lista com dados mock
     - Filtros alteram tarefas exibidas
     - Checkbox de conclusão chama invoke
     - Badge de atraso exibe dias corretos
     - Refs: FR-004, FR-005, FR-008

12.4 [not started] Escrever testes para componentes do Dashboard
     - CompletionRateCard exibe score correto
     - StreakCard exibe streak e recorde
     - Gráficos renderizam sem erro com dados mock
     - Refs: FR-014, FR-015

12.5 [not started] Escrever testes para componentes do Calendário
     - MonthlyCalendarView renderiza dias do mês correto
     - Navegação mês anterior/próximo funciona
     - Tarefas aparecem nos dias corretos
     - Refs: FR-019, FR-020

================================================================================
FASE 13 — POLISH & ACESSIBILIDADE (DESKTOP-UI)
================================================================================

13.1 [not started] Adicionar loading states (skeleton) em todas as páginas
     - Skeleton para lista de tarefas
     - Skeleton para cards do dashboard
     - Skeleton para calendário
     - Refs: NFR-003

13.2 [not started] Adicionar empty states com ilustração e CTA
     - Lista vazia: "Nenhuma tarefa encontrada. Crie sua primeira tarefa!"
     - Dashboard sem dados: "Comece adicionando tarefas para ver suas métricas"
     - Refs: FR-005

13.3 [not started] Revisar todos os textos em pt-BR
     - Labels, placeholders, mensagens de erro, tooltips
     - Datas no formato DD/MM/YYYY
     - Dias da semana e meses em português
     - Refs: FR-024

13.4 [not started] Revisar acessibilidade (ARIA, contraste, teclado)
     - Labels em todos os inputs
     - Navegação por teclado no sidebar e formulários
     - Contraste adequado em ambos os temas
     - Focus visible em elementos interativos

13.5 [not started] Adicionar animações de transição suaves
     - Transição ao abrir/fechar Sheet
     - Transição ao completar tarefa (fade out ou strikethrough)
     - Transição entre views do calendário

================================================================================
FASE 14 — AUTH & SUPABASE                                          [DEFERRED]
================================================================================

14.1 [deferred] Integrar Supabase Auth com OAuth (Google, GitHub)
     - Usar Supabase Auth JS SDK para fluxo OAuth no frontend
     - Refs: FR-030

14.2 [deferred] Implementar registro com email/senha
     - Formulário de registro e login
     - Refs: FR-031

14.3 [deferred] Configurar validação de JWT no Rust
     - Validar token Supabase antes de executar queries
     - Refs: FR-032

14.4 [deferred] Configurar Row Level Security no Supabase
     - Policies por user_id em todas as tabelas
     - Refs: FR-032

14.5 [deferred] Trocar connection string para Supabase PostgreSQL
     - Configuração por ambiente (dev = local, prod = Supabase)
     - Refs: FR-028

================================================================================
FASE 15 — MOBILE                                                   [DEFERRED]
================================================================================

15.1 [deferred] Configurar build Android com Tauri v2 mobile
     - Refs: FR-033

15.2 [deferred] Configurar build iOS com Tauri v2 mobile
     - Refs: FR-033

15.3 [deferred] Adaptar UI para telas menores (responsive mobile)
     - Refs: FR-033

15.4 [deferred] Implementar sync de dados via Supabase
     - Depende de auth (Fase 14) estar implementado
     - Refs: FR-034

================================================================================
RESUMO
================================================================================

Fase  1 — Setup & Infraestrutura              : 15/15 tarefas concluídas
Fase  2 — Models & Structs Rust (API)          :  0/7  tarefas concluídas
Fase  3 — Tauri Commands: CRUD (API)           :  0/8  tarefas concluídas
Fase  4 — Componentes UI: Formulário (UI)      :  0/5  tarefas concluídas
Fase  5 — Página de Tarefas (UI)               :  0/6  tarefas concluídas
Fase  6 — Lógica de Recorrência (API)          :  0/6  tarefas concluídas
Fase  7 — Testes: CRUD & Recorrência (API)     :  0/6  tarefas concluídas
Fase  8 — Configurações (API + UI)             :  0/5  tarefas concluídas
Fase  9 — Tray Icon & Notificações (API)       :  0/7  tarefas concluídas
Fase 10 — Calendário (UI)                      :  0/7  tarefas concluídas
Fase 11 — Dashboard (API + UI)                 :  0/12 tarefas concluídas
Fase 12 — Testes do Frontend (UI)              :  0/5  tarefas concluídas
Fase 13 — Polish & Acessibilidade (UI)         :  0/5  tarefas concluídas
Fase 14 — Auth & Supabase                      :  0/5  tarefas (deferred)
Fase 15 — Mobile                               :  0/4  tarefas (deferred)
--------------------------------------------------------------------------
TOTAL                                          : 15/103 tarefas concluídas

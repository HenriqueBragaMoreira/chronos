# Requirements

## Status Reference

| Status | Meaning |
|--------|---------|
| `draft` | Written but not yet reviewed — may be vague or incomplete |
| `refined` | Reviewed and clarified by user, ready to implement |
| `in-progress` | Actively being implemented by the agent |
| `implemented` | Code written by agent, awaiting user review |
| `verified` | User reviewed and approved — only the user sets this |
| `deferred` | Intentionally postponed, not abandoned |
| `cancelled` | No longer relevant, kept for historical context |

---

## Functional Requirements

### Task Management

#### FR-001: Criar tarefa

- **Status**: `refined`
- **Description**: O usuário pode criar uma tarefa preenchendo: nome (obrigatório), data de vencimento (obrigatório), tipo de recorrência, valor da recorrência, categoria/tag, prioridade (alta/média/baixa), descrição/notas (texto livre) e horário específico (opcional). O formulário de criação deve ser exibido em um Dialog ou Sheet lateral, nunca em uma página separada.

#### FR-002: Editar tarefa

- **Status**: `refined`
- **Description**: O usuário pode editar qualquer campo de uma tarefa existente. A edição usa o mesmo componente de formulário da criação (Dialog/Sheet). Alterar a recorrência de uma tarefa recalcula a próxima ocorrência a partir da data original.

#### FR-003: Excluir tarefa

- **Status**: `refined`
- **Description**: O usuário pode excluir uma tarefa. Deve haver confirmação antes da exclusão. Excluir uma tarefa recorrente exclui todas as ocorrências futuras. O histórico de conclusões passadas é preservado para o dashboard.

#### FR-004: Marcar tarefa como concluída

- **Status**: `refined`
- **Description**: O usuário pode marcar uma tarefa como concluída. Registra automaticamente a data/hora de conclusão (`completed_at`). Para tarefas recorrentes, ao marcar como concluída, a próxima ocorrência é gerada automaticamente baseada na data original da agenda (não na data de conclusão).

#### FR-005: Listar tarefas com filtros

- **Status**: `refined`
- **Description**: Visualização em lista com filtros: hoje, atrasadas, por categoria, por prioridade. Ordenação por data de vencimento (padrão), prioridade ou nome. Tarefas atrasadas devem ter destaque visual indicando há quanto tempo estão atrasadas.

---

### Recurrence System

#### FR-006: Configurar tipo de recorrência

- **Status**: `refined`
- **Description**: Ao criar/editar uma tarefa, o usuário escolhe o tipo de recorrência:
  - `none` — tarefa única
  - `weekly` — dia fixo da semana (ex: toda terça)
  - `interval` — a cada N dias (ex: a cada 7 dias, a cada 15 dias)
  - `monthly` — dia fixo do mês (ex: todo dia 15)

#### FR-007: Gerar próxima ocorrência automaticamente

- **Status**: `refined`
- **Description**: Quando uma tarefa recorrente é marcada como concluída, o sistema gera automaticamente a próxima ocorrência. A data da próxima ocorrência é calculada a partir da data original da agenda, não da data em que foi concluída.

#### FR-008: Exibir instância única de atraso

- **Status**: `refined`
- **Description**: Para tarefas recorrentes não concluídas, o sistema exibe apenas uma instância de atraso (a mais recente). Essa instância mostra desde quando a tarefa está atrasada (ex: "Atrasada há 5 dias — desde 21/04"). Não acumula múltiplas instâncias.

#### FR-009: Rollover automático de tarefas recorrentes

- **Status**: `refined`
- **Description**: Todas as tarefas recorrentes possuem rollover automático. Se a tarefa não foi feita no dia, ela aparece no dia atual como atrasada até ser concluída. Não é configurável por tarefa — é comportamento padrão do sistema.

---

### Notifications

#### FR-010: Notificações do sistema em horário fixo

- **Status**: `refined`
- **Description**: O app envia notificações nativas do sistema operacional no horário fixo configurado pelo usuário (ex: "8:00" todos os dias). A notificação lista as tarefas pendentes e atrasadas do dia. Usa `tauri-plugin-notification`.

#### FR-011: Tray icon com badge

- **Status**: `refined`
- **Description**: O app exibe um ícone na bandeja do sistema com badge numérico indicando a quantidade de tarefas pendentes (hoje + atrasadas). O badge atualiza em tempo real conforme tarefas são concluídas ou vencem.

#### FR-012: Som de notificação

- **Status**: `refined`
- **Description**: As notificações emitem um som ao serem disparadas. O som pode ser habilitado/desabilitado nas configurações.

#### FR-013: App em segundo plano (tray)

- **Status**: `refined`
- **Description**: O app sempre roda em segundo plano na bandeja do sistema. Fechar a janela minimiza para a bandeja em vez de encerrar o app. Clique no ícone da bandeja restaura a janela. Menu de contexto no tray com opções: "Abrir", "Tarefas de Hoje" e "Sair".

---

### Dashboard

#### FR-014: Taxa de conclusão

- **Status**: `refined`
- **Description**: Exibe a porcentagem de tarefas concluídas no prazo vs atrasadas vs não feitas. Filtrável por período (semana, mês, ano).

#### FR-015: Contador de streak

- **Status**: `refined`
- **Description**: Exibe o número de dias consecutivos sem tarefas atrasadas. O streak reseta quando qualquer tarefa ultrapassa a data de vencimento sem ser concluída.

#### FR-016: Distribuição por categoria

- **Status**: `refined`
- **Description**: Gráfico (pizza ou barras) mostrando a distribuição de tarefas por categoria/tag. Inclui tanto tarefas concluídas quanto pendentes.

#### FR-017: Histórico semanal/mensal

- **Status**: `refined`
- **Description**: Gráfico de barras mostrando tarefas feitas vs pendentes por período (semana ou mês). O usuário alterna entre visualização semanal e mensal.

#### FR-018: Ranking de tarefas mais esquecidas

- **Status**: `refined`
- **Description**: Lista das tarefas recorrentes que mais frequentemente ficam atrasadas. Ordenadas pela frequência de atraso. Ajuda o usuário a identificar padrões.

---

### Calendar View

#### FR-019: Visualização mensal

- **Status**: `refined`
- **Description**: Calendário mensal mostrando tarefas nos respectivos dias. Tarefas concluídas, pendentes e atrasadas têm cores distintas. Clicar em um dia mostra as tarefas daquele dia. Clicar em uma tarefa abre o formulário de edição.

#### FR-020: Visualização semanal

- **Status**: `refined`
- **Description**: Calendário semanal com mais detalhes por dia (horários, descrição parcial). Mesmas interações da visualização mensal.

#### FR-021: Toggle entre visualizações

- **Status**: `refined`
- **Description**: O usuário alterna livremente entre visualização mensal e semanal. A preferência padrão é configurável em Settings.

---

### UI/UX

#### FR-022: Toggle dark/light theme

- **Status**: `refined`
- **Description**: O app suporta tema claro e escuro. Toggle acessível em qualquer tela (header ou settings). Persiste a preferência do usuário entre sessões.

#### FR-023: Formulário de tarefa como Dialog/Sheet

- **Status**: `refined`
- **Description**: Criação e edição de tarefas acontecem em um Dialog centralizado ou Sheet lateral (slide-in). Nunca em uma página separada. O componente é reutilizado para criação e edição.

#### FR-024: Idioma pt-BR

- **Status**: `refined`
- **Description**: Toda a interface do app é em português do Brasil. Datas formatadas no padrão brasileiro (DD/MM/YYYY). Dias da semana e meses em português.

---

### Settings

#### FR-025: Configurar horário de notificação

- **Status**: `refined`
- **Description**: O usuário define o horário fixo em que recebe notificações diárias (ex: 08:00). Padrão: 08:00.

#### FR-026: Configurar tema

- **Status**: `refined`
- **Description**: Opções: Claro, Escuro ou Sistema (segue preferência do OS).

#### FR-027: Configurar visualização padrão

- **Status**: `refined`
- **Description**: O usuário escolhe a visualização padrão ao abrir o app: Dashboard, Calendário Mensal, Calendário Semanal ou Lista.

---

### Data & Storage

#### FR-028: PostgreSQL como banco de dados

- **Status**: `refined`
- **Description**: Todas as operações de banco passam por Rust (sqlx) via Tauri commands. Em desenvolvimento: container Docker com PostgreSQL local. Em produção: conexão ao PostgreSQL do Supabase. A camada de acesso é a mesma (sqlx) — apenas a connection string muda.

#### FR-029: Migrations com sqlx

- **Status**: `refined`
- **Description**: Schema do banco gerenciado via sqlx migrations. Migrations versionadas e rastreadas no git. O app roda migrations pendentes automaticamente ao iniciar.

---

### Auth (Future)

#### FR-030: OAuth login

- **Status**: `deferred`
- **Description**: Login via Google e GitHub usando Supabase Auth. Último step do desenvolvimento. Será implementado quando a sync entre dispositivos for necessária.

#### FR-031: Registro com email/senha

- **Status**: `deferred`
- **Description**: Opção de criar conta com email e senha. Supabase Auth gerencia credenciais.

#### FR-032: Integração Supabase Auth

- **Status**: `deferred`
- **Description**: Supabase Auth JS SDK para o fluxo OAuth no frontend. Rust valida o JWT recebido para autorizar operações no banco. Row Level Security (RLS) no Supabase para isolar dados por usuário.

---

### Mobile (Future)

#### FR-033: Build mobile com Tauri v2

- **Status**: `deferred`
- **Description**: Compilar o app para Android e iOS usando Tauri v2 mobile. Reutilizar o máximo da base de código existente. Adaptar UI para telas menores.

#### FR-034: Sync entre desktop e mobile

- **Status**: `deferred`
- **Description**: Sincronização de dados entre desktop e mobile via Supabase. Depende de FR-030/FR-032 (auth) estar implementado.

---

## Non-Functional Requirements

#### NFR-001: Desktop-first

- **Status**: `refined`
- **Description**: Foco total em macOS como plataforma primária. Windows e Linux como plataformas secundárias (Tauri suporta nativamente).

#### NFR-002: Funcionamento offline

- **Status**: `refined`
- **Description**: O app deve funcionar 100% sem internet na versão desktop (o PostgreSQL roda localmente). Operações de sync com Supabase são assíncronas e não bloqueiam o uso.

#### NFR-003: Startup rápido

- **Status**: `refined`
- **Description**: O app deve abrir em menos de 2 segundos. Tauri já é leve; evitar operações pesadas no startup.

#### NFR-004: Uso leve de recursos em background

- **Status**: `refined`
- **Description**: Quando minimizado na bandeja, o app deve consumir recursos mínimos (CPU e memória). Apenas o scheduler de notificações deve estar ativo.

#### NFR-005: Testes desde o início

- **Status**: `refined`
- **Description**: Frontend testado com Vitest + React Testing Library. Backend Rust testado com testes nativos (`cargo test`). Cobertura mínima para lógica de negócio (recorrência, rollover, cálculos de dashboard).

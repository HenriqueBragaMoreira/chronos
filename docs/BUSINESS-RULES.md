# Business Rules

## Task Lifecycle

### BR-001: Próxima ocorrência baseada na data original

- **Status**: `refined`
- **When**: Uma tarefa recorrente é marcada como concluída
- **Then**: A próxima ocorrência é calculada a partir da data original da agenda, não da data em que foi concluída. Ex: tarefa toda terça, feita na quinta → próxima ocorrência = terça seguinte.
- **Rationale**: Manter a cadência original da tarefa evita drift progressivo no calendário. Se usasse a data de conclusão, uma tarefa "toda terça" feita sempre 2 dias atrasada se tornaria efetivamente "toda quinta".

### BR-002: Instância única de atraso com indicador temporal

- **Status**: `refined`
- **When**: Uma tarefa recorrente ultrapassa a data de vencimento sem ser concluída
- **Then**: O sistema exibe apenas uma instância de atraso (a mais recente pendente). Essa instância mostra desde quando está atrasada (ex: "Atrasada há 12 dias — desde 14/04"). Não acumula múltiplas instâncias atrasadas.
- **Rationale**: Acumular instâncias sobrecarrega o usuário e gera ansiedade. Uma instância com indicador temporal comunica a urgência sem poluir a lista.

### BR-003: Rollover automático é comportamento padrão

- **Status**: `refined`
- **When**: Qualquer tarefa recorrente não é concluída no dia de vencimento
- **Then**: A tarefa aparece automaticamente no dia atual como atrasada. Não é configurável por tarefa — todas as recorrentes têm rollover.
- **Rationale**: Tarefas domésticas esquecidas ainda precisam ser feitas. Não faz sentido uma tarefa "desaparecer" só porque o dia passou.

### BR-004: Estados de uma tarefa

- **Status**: `refined`
- **When**: Em qualquer momento do ciclo de vida
- **Then**: Uma tarefa pode estar em um dos seguintes estados:
  - `pending` — dentro do prazo, ainda não concluída
  - `completed` — marcada como concluída pelo usuário
  - `overdue` — ultrapassou a data de vencimento sem conclusão
- **Rationale**: Estados simples e mutuamente exclusivos. O estado `overdue` é derivado automaticamente (date > due_date && !completed).

---

## Recurrence

### BR-005: Recorrência semanal usa dia fixo

- **Status**: `refined`
- **When**: Uma tarefa tem `recurrence_type = weekly`
- **Then**: A tarefa se repete no dia da semana configurado (ex: toda terça-feira). O `recurrence_value` armazena o dia (0=domingo, 1=segunda, ..., 6=sábado).
- **Rationale**: Padrão intuitivo para tarefas domésticas semanais.

### BR-006: Recorrência por intervalo conta da data original

- **Status**: `refined`
- **When**: Uma tarefa tem `recurrence_type = interval`
- **Then**: A próxima ocorrência = data original + N dias (onde N = `recurrence_value`). Mesmo que o usuário complete atrasado, o intervalo respeita a data base original.
- **Rationale**: Consistente com BR-001. Mantém a cadência previsível.

### BR-007: Recorrência mensal com fallback para último dia

- **Status**: `refined`
- **When**: Uma tarefa tem `recurrence_type = monthly` e o dia configurado não existe no mês (ex: dia 31 em fevereiro)
- **Then**: A tarefa cai no último dia do mês. Ex: dia 31 → 28 de fevereiro (ou 29 em ano bissexto).
- **Rationale**: Comportamento previsível e sem perda de ocorrências.

---

## Notifications

### BR-008: Notificações disparam no horário configurado

- **Status**: `refined`
- **When**: O relógio do sistema atinge o horário configurado pelo usuário
- **Then**: O app envia uma notificação nativa listando tarefas pendentes do dia e tarefas atrasadas. Apenas uma notificação por dia no horário configurado.
- **Rationale**: Horário fixo cria hábito. Múltiplas notificações ao dia seriam intrusivas.

### BR-009: Apenas tarefas pendentes/atrasadas geram notificação

- **Status**: `refined`
- **When**: O sistema prepara a notificação diária
- **Then**: Apenas tarefas com status `pending` (vencendo hoje) ou `overdue` são incluídas. Tarefas já concluídas no dia são excluídas.
- **Rationale**: Evitar ruído. Notificar sobre tarefas já feitas não agrega valor.

### BR-010: Badge do tray = pendentes hoje + atrasadas

- **Status**: `refined`
- **When**: A qualquer momento enquanto o app está na bandeja
- **Then**: O número no badge = tarefas pendentes para hoje + todas as tarefas atrasadas de dias anteriores. Atualiza em tempo real quando tarefas são concluídas.
- **Rationale**: Número único que comunica "o que preciso resolver". Inclui atrasadas porque continuam sendo responsabilidade.

---

## Dashboard

### BR-011: Cálculo da taxa de conclusão

- **Status**: `refined`
- **When**: O dashboard exibe a taxa de conclusão
- **Then**: Taxa = (tarefas concluídas no prazo / total de tarefas vencidas no período) × 100. "No prazo" = `completed_at <= due_date`. O período é selecionável (semana/mês/ano).
- **Rationale**: Métrica clara que incentiva fazer no dia certo, não apenas fazer.

### BR-012: Streak reseta com qualquer atraso

- **Status**: `refined`
- **When**: Qualquer tarefa ultrapassa `due_date` sem ser marcada como `completed`
- **Then**: O streak (dias consecutivos sem atraso) reseta para zero. O streak atual e o recorde são exibidos.
- **Rationale**: Streak rigoroso incentiva consistência. Exibir o recorde mantém motivação após reset.

### BR-013: Ranking "mais esquecidas" por frequência de atraso

- **Status**: `refined`
- **When**: O dashboard exibe o ranking de tarefas mais esquecidas
- **Then**: Calcula a frequência de atraso = (vezes atrasada / total de ocorrências) × 100. Ordena por frequência decrescente. Exibe as top 5.
- **Rationale**: Identificar padrões permite ao usuário ajustar sua rotina ou o agendamento da tarefa.

---

## Data Integrity

### BR-014: Histórico de conclusões é imutável

- **Status**: `refined`
- **When**: Uma tarefa é excluída
- **Then**: O registro de conclusões passadas (`task_completions`) é preservado para manter a integridade dos dados do dashboard. A tarefa é marcada como excluída (soft delete) mas seus históricos permanecem consultáveis.
- **Rationale**: Excluir uma tarefa não deve distorcer as métricas históricas do dashboard.

### BR-015: Categorias são definidas pelo usuário

- **Status**: `refined`
- **When**: O usuário cria ou edita uma tarefa
- **Then**: As categorias são texto livre ou selecionadas de categorias previamente usadas (autocomplete). Não há lista fixa de categorias — o usuário cria conforme necessidade.
- **Rationale**: Flexibilidade total. Categorias pré-definidas limitam e podem não refletir a realidade do usuário.

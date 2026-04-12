# Chronos

App desktop (Tauri v2) de gerenciamento de tarefas domésticas com recorrência, notificações e dashboard de produtividade.

## Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + React Router v7
- **Backend**: Rust (Tauri v2 commands) + sqlx (PostgreSQL)
- **Database**: PostgreSQL (container Docker local em dev, Supabase em prod)
- **Tests**: Vitest + React Testing Library (frontend), cargo test (backend)

## Docs

- `docs/REQUIREMENTS.md` — requisitos funcionais e não-funcionais
- `docs/BUSINESS-RULES.md` — regras de domínio e restrições

When implementing features or fixing bugs, update the relevant requirement/rule
status in these docs to keep them synced with the codebase.

## Architecture

```
React (UI) → invoke() → Rust/Tauri commands → sqlx → PostgreSQL
```

All DB operations go through Rust. The frontend never touches the database directly.

## Behavioral Guidelines

### Plan Mode

- Planos detalhados com justificativas para cada decisão
- Listar questões não resolvidas ao final do plano
- Incluir impacto em requirements/business rules existentes

### Communication

- Comunicação em português do Brasil
- Código, commits, nomes de variáveis e comentários em inglês
- Commits seguem Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`)

### Language & Locale

- Interface do app: pt-BR
- Datas: DD/MM/YYYY
- Dias da semana e meses: em português

### Testing

- Todo código de lógica de negócio deve ter testes
- Frontend: Vitest + React Testing Library
- Backend: `cargo test`
- Testar especialmente: lógica de recorrência, rollover, cálculos de dashboard

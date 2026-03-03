# Remind.me

PWA de organização pessoal com **Supabase** (Auth + Postgres + Edge Functions): projetos, tarefas, lembretes, calendário e integração opcional com GitHub para auto-tick por commit/release.

## Stack

- **Next.js 15** + TypeScript + Tailwind
- **Supabase**: Auth, Postgres, RLS, Edge Functions
- **PWA**: manifest + service worker + Web Push

## Estrutura

```
apps/web/          # Next.js PWA
  src/
    app/           # Rotas (dashboard, projects, tasks, settings, integrations/github)
    components/    # UI, quick-add, tasks, github, settings
    lib/           # Supabase client/server, date-parser (PT-BR), normalization
    types/         # Tipos TypeScript
    pwa/           # Registro do Service Worker
supabase/
  migrations/       # 001_init, 002_github_integration, 003_rls
  functions/       # send-reminders, github-webhook, test-push
```

## Setup

1. **Supabase**
   - Crie um projeto em [supabase.com](https://supabase.com).
   - Rode as migrations em ordem: `001_init.sql`, `002_github_integration.sql`, `003_rls.sql`.

2. **App**
   - Em `apps/web`: `npm install` e depois `npm run dev`.
   - Crie `.env.local` a partir de `apps/web/.env.example` e preencha:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (para notificações; gere com `npx web-push generate-vapid-keys`).

3. **Edge Functions**
   - No Supabase: Settings → Edge Functions → defina secrets `VAPID_PRIVATE_KEY`, `VAPID_PUBLIC_KEY`.
   - Deploy: `supabase functions deploy send-reminders`, `github-webhook`, `test-push`.
   - Para lembretes: agende um cron (ex.: a cada 1 min) chamando a URL da função `send-reminders` (via pg_cron + pg_net ou serviço externo).

4. **GitHub**
   - Em Integrações → GitHub, adicione um repositório (owner/repo).
   - No GitHub, em Settings → Webhooks, adicione a URL da Edge Function `github-webhook` e os eventos *push* e *release*.
   - Opcional: defina o secret no GitHub e no Supabase (secret por repo ou env).

## Funcionalidades MVP

- **Projetos**: CRUD, categorias (trabalho/faculdade/pessoal), cor.
- **Tarefas**: título, prazo, prioridade, checklist; Smart lists (Hoje, Esta semana, Atrasados, Sem data).
- **Quick Add**: linguagem natural em PT-BR (ex.: "Entregar notebook próxima quarta 20h") com preview antes de salvar.
- **Notificações**: Web Push (PWA); inscrição em Configurações; Edge Function `send-reminders` para enviar lembretes.
- **GitHub**: vincular repo; regras por tarefa (frase alvo, match contains/tokens/fuzzy/tag); webhook push/release → auto-tick ou sugestão; auditoria.

## Comandos

```bash
cd apps/web
npm install
npm run dev
```

Build: `npm run build`  
Lint: `npm run lint`

# Configurar Supabase no Remind.me

Siga estes passos para conectar o app ao Supabase.

---

## 1. Criar o projeto no Supabase

1. Acesse **[supabase.com](https://supabase.com)** e faça login.
2. Clique em **New project**.
3. Escolha sua organização (ou crie uma).
4. Preencha:
   - **Name**: por exemplo `remind-me`
   - **Database Password**: crie uma senha forte e **guarde** (para acessar o banco se precisar).
   - **Region**: escolha a mais próxima (ex.: South America (São Paulo)).
5. Clique em **Create new project** e espere alguns minutos.

---

## 2. Pegar URL e Chave (API)

1. No menu lateral do projeto, vá em **Project Settings** (ícone de engrenagem).
2. Clique em **API** no submenu.
3. Você verá:
   - **Project URL** — ex.: `https://xxxxxxxx.supabase.co`
   - **Project API keys** → **anon public** — uma chave longa (começa com `eyJ...`)

Copie esses dois valores; vamos usá-los no passo 4.

---

## 3. Rodar as migrations (criar tabelas)

As tabelas e regras de segurança ficam nos arquivos em `supabase/migrations/`. Você precisa executar o SQL no Supabase na ordem:

1. No Supabase, vá em **SQL Editor**.
2. Clique em **New query**.
3. Abra o arquivo **`supabase/migrations/001_init.sql`** do projeto (no Cursor/VS Code), copie **todo** o conteúdo e cole no editor SQL.
4. Clique em **Run** (ou Ctrl+Enter).
5. Repita para **`002_github_integration.sql`**: copie, cole, Run.
6. Repita para **`003_rls.sql`**: copie, cole, Run.

Se der algum erro (por exemplo “relation already exists”), pode ser que você já tenha rodado aquela migration antes. Pode ignorar ou ajustar conforme a mensagem.

---

## 4. Colocar URL e chave no app

1. Abra o arquivo **`apps/web/.env.local`** no projeto.
2. Preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

(Substitua pelos seus **Project URL** e **anon public** do passo 2.)

3. Salve o arquivo.
4. Reinicie o servidor do Next.js (`npm run dev` em `apps/web`) para carregar as variáveis.

Depois disso, o login/cadastro e os dados do app devem funcionar.

---

## 5. (Opcional) Notificações Web Push

Para o PWA enviar notificações de lembretes:

1. No terminal, na pasta `apps/web`, rode:
   ```bash
   npx web-push generate-vapid-keys
   ```
2. Serão mostradas duas chaves (public e private). No **`.env.local`** coloque a chave **pública**:
   ```env
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=sua-chave-publica-aqui
   ```
3. No Supabase: **Project Settings** → **Edge Functions** → **Secrets** (ou **Settings** da função). Adicione:
   - `VAPID_PUBLIC_KEY` = mesma chave pública
   - `VAPID_PRIVATE_KEY` = chave privada que o comando gerou

Assim a Edge Function `send-reminders` consegue enviar push. O passo 4 já deixa o app funcionando mesmo sem isso.

---

## Resumo rápido

| Onde | O quê |
|------|--------|
| Supabase → Project Settings → API | Copiar **Project URL** e **anon public** |
| Supabase → SQL Editor | Rodar em ordem: `001_init.sql`, `002_github_integration.sql`, `003_rls.sql` |
| `apps/web/.env.local` | Colocar `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| (Opcional) Terminal | `npx web-push generate-vapid-keys` e configurar VAPID no .env e no Supabase |

Se quiser, na próxima mensagem você me manda até onde chegou (ex.: “já criei o projeto e rodei as migrations”) e te ajudo no que faltar ou em algum erro que aparecer.

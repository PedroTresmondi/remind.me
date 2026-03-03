# GitHub Webhook — próximos passos

Você já criou o webhook no repositório. Para o auto-tick funcionar de ponta a ponta:

---

## 1. Publicar a Edge Function no Supabase

O webhook chama a URL do Supabase, mas a função precisa estar publicada.

### Opção A — Pelo Dashboard do Supabase

1. Acesse [supabase.com/dashboard](https://supabase.com/dashboard) → projeto **remind.me**.
2. No menu: **Edge Functions**.
3. Clique em **Create a new function**.
4. Nome: `github-webhook`.
5. Cole o conteúdo do arquivo **`supabase/functions/github-webhook/index.ts`** do repositório (todo o conteúdo).
6. Em **Settings** da função, **desative** "Enforce JWT verification" (o GitHub não envia JWT).
7. Salve/Deploy.

### Opção B — Pela CLI do Supabase

Na pasta do projeto (raiz do remind.me):

```bash
npx supabase link --project-ref bbegonqcifuurkhhpzxd
npx supabase functions deploy github-webhook --no-verify-jwt
```

(O `--no-verify-jwt` é necessário porque o webhook do GitHub não envia token JWT.)

---

## 2. Conferir a URL do webhook no GitHub

No GitHub: **Settings → Webhooks** do repositório.

- **Payload URL** deve ser exatamente:
  ```
  https://bbegonqcifuurkhhpzxd.supabase.co/functions/v1/github-webhook
  ```
- **Content type:** `application/json`.
- **Events:** pelo menos **Push events** e **Releases** (ou "Let me select individual events" e marcar Push + Release).

Se configurou um **Secret**, anote; vamos usar no passo 4.

---

## 3. No app Remind.me — vincular o repositório

1. Abra o app (sua URL da Vercel ou localhost).
2. Faça login.
3. Vá em **Configurações** (ou menu) → **Integrações → GitHub**.
4. Em "Adicionar repositório":
   - **owner:** seu usuário do GitHub (ex.: `PedroTreamon`).
   - **repo:** nome do repositório (ex.: `remind.me`).
   - **Webhook secret:** opcional; se você colocou um secret no webhook do GitHub, pode colar aqui (o app salva e a Edge Function usa para validar a assinatura).
5. Clique em **Adicionar repo**.

Assim o Supabase passa a saber que esse `owner/repo` pertence à sua conta e pode processar os eventos do webhook.

---

## 4. (Opcional) Secret do webhook

Se você definiu um **Secret** no webhook do GitHub:

- **Sem Edge Function publicada:** não adianta configurar no app ainda.
- **Com Edge Function publicada:** você pode guardar o secret no Supabase para a função validar a assinatura:
  - No app, ao adicionar o repo, preencha o campo "Webhook secret" com esse mesmo valor.
  - Ou no Supabase: **Project Settings → Edge Functions → Secrets** (ou configuração da função) e adicione um secret com o valor que você colocou no GitHub.

A função usa o secret para validar o header `X-Hub-Signature-256`.

---

## 5. Criar uma regra de automação em uma tarefa

1. No app, crie uma tarefa (ou abra uma existente), ex.: "Fazer deploy do remind.me".
2. Role até o bloco **Regra de automação GitHub**.
3. Selecione o repositório que você vinculou (ex.: `PedroTreamon/remind.me`).
4. **Frase alvo:** texto que deve aparecer no commit ou no release para dar match, ex.:
   - `deploy` — qualquer commit/release que contenha "deploy".
   - `fix login` — se aparecer "fix login" no texto.
   - Ou use o modo **Tag #todo:slug**: na frase alvo coloque ex. `deploy-app` e no commit/release escreva `#todo:deploy-app`.
5. Escolha **Match:** Fuzzy ou Contém.
6. **Ação:** Auto-tick (marca sozinho) ou Sugestão (mostra para você confirmar).
7. Clique em **Adicionar regra**.

A partir daí, quando você fizer push ou criar um release nesse repo com um texto que dê match, a tarefa (ou o item da checklist) será marcada como concluída automaticamente (ou sugerida).

---

## Resumo

| Passo | O quê |
|-------|--------|
| 1 | Publicar a Edge Function `github-webhook` no Supabase (e desativar JWT). |
| 2 | Conferir URL e eventos do webhook no GitHub. |
| 3 | No app, em Integrações → GitHub, adicionar o repo (owner/repo). |
| 4 | (Opcional) Configurar o mesmo secret do webhook no app ou no Supabase. |
| 5 | Em uma tarefa, criar uma regra de automação (repo + frase alvo + tipo de match). |

Depois disso, faça um push ou crie um release no repo e confira no app se a tarefa foi marcada (e em **Integrações → GitHub** você pode ver o histórico de eventos, se a função estiver logando).

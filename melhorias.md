çf# Remind.me - Melhorias (backlog de produto + UX)

Documento consolidado com ideias de melhoria para o **Remind.me**, focado em:
- usabilidade alta (rápido de capturar e editar)
- experiência próxima de **Calendário + Lembretes do iOS** (sem copiar visualmente)
- fluxo de **uma página principal (hub)** com drawers/sheets
- confiabilidade (parser, notificações, timezone, automações)
- escalabilidade de produto (design system, dados, integrações)

---

## 1) Direção do produto (princípios)

### Objetivo da UX
- **Adicionar algo em segundos** (captura rápida)
- **Ver o que importa hoje** sem navegar por várias telas
- **Editar sem perder contexto** (drawer/sheet em vez de trocar de rota)
- **Separar compromisso vs execução** (eventos x tarefas)
- **Automatizar quando possível** (GitHub, lembretes, presets)

### Padrão recomendado (hub em uma página)
- **Uma página principal** como centro do uso diário
- **Não** deixar tudo expandido ao mesmo tempo
- Usar camadas de interface:
  - Camada 1: quick add + smart cards + vista ativa
  - Camada 2: mini calendário / projetos / filtros
  - Camada 3: drawer/sheet de detalhe (task/event)

### Estilo de interação inspirado em iOS (adaptado)
- captura rápida
- smart lists (Hoje, Programado, Inbox, etc.)
- ações rápidas (swipe / hover / long-press)
- detalhes opcionais (expandir só quando precisa)
- visual limpo com hierarquia forte

---

## 2) Melhorias por feature (categoria por categoria)

---

## 2.1 Autenticação

### O que melhorar
- Melhorar UX de sessão:
  - tela de loading/skeleton ao validar sessão
  - evitar flash de conteúdo / redirecionamento brusco
- Tratamento de sessão expirada:
  - refresh silencioso quando possível
  - toast amigável + redirecionamento para login quando necessário
- Mensagens de erro de login mais claras (credenciais / rede / indisponibilidade)

### O que incluir
- **Onboarding pós-login (primeira execução)**:
  - timezone
  - hora padrão de lembrete
  - ativar notificações
  - criar projeto inicial (Trabalho / Faculdade / Pessoal)
- Opção de login com **magic link** (além de senha), se fizer sentido no fluxo

### Prioridade
- **Agora**: loading/session UX + onboarding inicial
- **Depois**: refinamentos de sessão multi-dispositivo

---

## 2.2 Dashboard (hub principal)

### O que melhorar
- Transformar o hub em **estado ativo controlado pelos cards**:
  - clicar em um smart card atualiza a lista abaixo (sem navegar)
  - título dinâmico da seção: `Vista ativa: Hoje`, `Programado`, `Inbox`, etc.
  - estado visual forte para card selecionado
- Melhorar mini agenda:
  - agrupar por dia (Hoje, Amanhã, próximos dias)
  - mostrar tipo (evento/tarefa)
  - clicar abre drawer do item
- Melhorar busca no hub:
  - buscar em título, descrição, subitens e projeto (não só título)
  - debounce (200-300ms)
  - highlight do termo encontrado

### O que incluir
- **Fixados do dia (Top 3)**
- **Painel de planejamento** (resumo):
  - X itens sem data
  - Y atrasados
  - Z entregas nesta semana
- **Atividade recente**:
  - item criado
  - concluído
  - reagendado
  - auto-tick por GitHub

### Prioridade
- **Agora**: vista ativa robusta + mini agenda melhor + busca ampliada
- **Depois**: fixados + atividade recente

---

## 2.3 Captura rápida (Quick Add / compositor)

### O que melhorar (UX + parser)
- Adicionar **score de confiança** do parser
- Quando confiança for baixa/média, mostrar aviso discreto:
  - "Interpretei 'proxima quarta' como 11/03"
  - botão para corrigir rapidamente
- Tornar os **chips do preview editáveis**:
  - tipo
  - data
  - hora
  - projeto
  - prioridade
  - lembrete preset
- Melhorar navegação por teclado:
  - Enter = salvar
  - Shift+Enter = abrir mais opções
  - Tab = navegar entre chips
  - Esc = fechar/limpar preview
- **Parser contextual**:
  - se o usuário estiver no calendário em um dia selecionado, input com `20h` assume a data daquele dia
  - se a vista ativa for Inbox, não forçar data

### Ditado por voz (Web Speech API)
- Mostrar estado visual `Ouvindo...`
- Botão para cancelar gravação
- Não salvar automaticamente após transcrever
- Jogar texto no campo e deixar parser gerar preview para confirmação

### O que incluir
- **Comandos power-user opcionais**:
  - `#projeto`
  - `!alta`, `!media`, `!baixa`
  - `@20h`
  - `~amanha`
  - `*evento`, `*tarefa`
- **Autocomplete de projeto** ao digitar `#`
- **Histórico de templates recentes** (chips mais usados)
- Suporte a múltiplos itens com preview por item (já existe, mas refinar visual e edição)

### Prioridade
- **Agora**: score de confiança + chips editáveis + parser contextual
- **Depois**: autocomplete + histórico de templates

---

## 2.4 Tarefas

### O que melhorar (lista)
- Padronizar `TaskRow` em visual compacto estilo Lembretes:
  - checkbox/círculo grande (44x44 no mobile)
  - título
  - subtítulo (data/hora + projeto)
  - badges discretos (Atrasado, Alta, GitHub)
  - ações no hover (desktop) / long-press (mobile)
- Ações rápidas consistentes:
  - concluir
  - adiar 1h
  - mover para amanhã
  - editar
  - excluir
- **Undo** consistente via toast em concluir/excluir

### Swipe no mobile
- Swipe parcial mostra ação
- Swipe completo confirma ação
- Feedback visual claro (ícone + cor)
- Se item não tiver data, esconder ação "adiar 1h"

### Detalhe da tarefa (drawer/sheet)
- Edição inline para:
  - título
  - data/hora
  - projeto
  - prioridade
- Seções recolhíveis:
  - subitens
  - lembretes
  - automação GitHub
  - notas
  - histórico
- Ações rápidas no topo do drawer:
  - concluir
  - adiar
  - reagendar
  - excluir

### Lista Programado (refino)
- Agrupar por:
  - Hoje
  - Amanhã
  - Esta semana
  - Próxima semana
  - Futuro
- Separar por grupo:
  - Dia inteiro
  - Horarios
- Headers com sticky (se possível)

### O que incluir
- **Recorrência de tarefas** (diário, semanal, mensal, personalizar)
- **Checklist avançada**:
  - Enter cria novo item
  - Backspace em vazio remove
  - reordenar
  - progresso `% concluído`
- **Duplicar tarefa**
- **Arquivar tarefa** (além de excluir)
- **Links/notas** (Figma, GitHub, Docs)

### Prioridade
- **Agora**: recorrência simples + checklist melhor + drawer refinado
- **Depois**: arquivar + duplicar + links/notas

---

## 2.5 Eventos

### O que melhorar
- Melhorar criação rápida no calendário:
  - click no dia abre popover com título + hora + duração
  - botão "Mais opções" expande local/notas/lembretes
- UX de horário:
  - presets de duração (30m / 1h / 2h)
  - toggle `Dia inteiro`
  - se usuário digitar só `reuniao amanha`, sugerir horário padrão de evento (configurável)
- Visual no calendário:
  - cor por projeto
  - diferenciar evento vs tarefa com prazo
  - all-day em seção separada

### O que incluir
- **Local**
- **Link de reunião** (Meet/Zoom)
- **Recorrência de eventos**
- (Depois) exportação ICS
- (Depois) buffer de deslocamento (travel buffer)

### Prioridade
- **Agora**: local + dia inteiro + presets de duração
- **Depois**: recorrência + links de reunião

---

## 2.6 Projetos

### O que melhorar
- Enriquecer projeto com:
  - categoria (`trabalho`, `faculdade`, `pessoal`)
  - prazo opcional do projeto
  - contadores (pendentes, atrasados, sem data)
- Melhorar página de projeto:
  - filtros por status, prioridade, data
  - seções (pendentes / concluídas / agenda do projeto)
- Melhorar drawer de projetos no hub:
  - quick switch de projeto
  - preview dos principais projetos
  - botão "novo projeto"

### O que incluir
- **Progresso do projeto** (% concluído)
- **Projeto fixado**
- **Templates de projeto**:
  - Projeto da faculdade
  - Projeto de cliente
  - Evento/ativação

### Prioridade
- **Agora**: categoria + contadores + filtros
- **Depois**: progresso + templates

---

## 2.7 Calendário

### O que melhorar
- Integrar calendário e hub:
  - click no dia filtra a vista ativa
  - mini calendário dentro do hub com interação real (não decorativo)
- Mostrar tarefas com prazo no calendário (com toggle)
- Diferenciar visualmente:
  - evento (bloco)
  - tarefa com prazo (indicador/linha)
- Destacar:
  - hoje
  - dia selecionado
  - dias com itens

### Vistas úteis
- **Agenda semanal** (muito útil no dia a dia)
- Vista do dia com seções:
  - Dia inteiro
  - Horarios

### Criação rápida
- Popover ao clicar no dia
- (Depois) click + drag em slot de horário para criar evento com duração

### O que incluir
- **Toggles por fonte/lista/projeto** (estilo Apple Calendar)
- Indicadores de densidade (bolinhas + contador)
- Atalhos de navegação:
  - `T` = hoje
  - setas = navegar período
- (Depois) importar/exportar ICS

### Prioridade
- **Agora**: tarefas no calendário + toggles por projeto + agenda semanal
- **Depois**: drag and drop + ICS

---

## 2.8 Lembretes e notificações

### O que melhorar (UX)
- Permitir **múltiplos lembretes por item**
- Presets + personalizado
- Presets inteligentes quando item não tem hora:
  - 9h do dia
  - noite anterior
- Tela de status de push:
  - permissão do navegador
  - subscription ativa?
  - último teste enviado
- Botão **Enviar notificação de teste**
- Tratamento de subscription inválida (desativar e pedir reinscrição)

### Toasts in-app
- Padrão unificado para sucesso/erro/info
- Undo com timeout consistente (ex.: 5s)

### O que incluir
- **Snooze / Lembrar mais tarde**:
  - 10 min
  - 1h
  - amanhã
  - fim de semana
- Notificações de automação GitHub (opcional)
- (Depois) resumo diário opt-in

### Prioridade
- **Agora**: status push + teste + snooze
- **Depois**: resumo diário + GitHub notification opcional

---

## 2.9 Integrações (GitHub)

### O que melhorar (UX e confiança)
- Regra em linguagem humana:
  - "Quando commit/release em repo X combinar com 'mudar ui', marcar item"
- Modo de ação:
  - Auto
  - Assistido (requer confirmação)
- Mostrar transparência no sistema:
  - último webhook recebido
  - último match
  - último auto-tick
- Setup de webhook com passo a passo visual e status

### O que incluir
- **Modo assistido** (confirmar sugestão quando score médio)
- **Histórico / logs da automação**
- **Links para commit/release** nos logs
- **Simulador de regra** (colar texto e ver score/match)
- **Issues/PRs** além de commit/release (expansão da integração)

### Prioridade
- **Agora**: modo assistido + status webhook + histórico/logs
- **Depois**: issues/PR + simulador

---

## 2.10 Configurações

### O que melhorar
Organizar por seções:
- Conta
- Notificações
- Data e hora
- Captura rápida
- Aparência
- Integrações

### Configs importantes para comportamento
- Hora padrão para tarefa sem hora
- Hora padrão de evento
- Duração padrão de evento
- Regra de parser para "proxima quarta" / interpretação de datas ambíguas
- Comportamento ao concluir:
  - esconder da vista ativa imediatamente
  - mover para concluídos

### O que incluir
- **Tema** (escuro / claro / automático)
- **Densidade da interface** (compacta / confortável)
- **Ajuda de atalhos de teclado**
- **Export/backup** (JSON/CSV)
- (Depois) idioma

### Prioridade
- **Agora**: prefs de parser + horários/duração padrão + comportamento de conclusão
- **Depois**: tema + export/import

---

## 2.11 Design system e UX

### O que melhorar (consistência)
Padronizar tokens e variantes:
- spacing: 4, 8, 12, 16, 20, 24, 32
- radius
- alturas padrão de botão/input (44px)
- cores semânticas (success, warning, danger, info, muted)
- transições curtas e consistentes
- sombras leves (1-2 níveis)

### Componentes a padronizar
- Button (primary, secondary, ghost, danger)
- Badge/Chip (neutral, info, warning, danger, success)
- Card (smart list)
- ListItemRow (task/event/project)
- EmptyState
- SectionHeader
- Sheet / Drawer container
- Toast

### Estados e microinterações
- hover / active / focus-visible / disabled
- loading / skeleton
- selected state (smart cards)
- animação curta ao concluir item
- animação de entrada de drawer/sheet

### Acessibilidade (muito importante)
- foco visível
- labels em ícones
- aria em drawer/sheet/toast
- navegação por teclado
- contraste no dark mode

### O que incluir
- **Command palette (Cmd/Ctrl + K)**
- Atalhos básicos:
  - `Q` quick add
  - `/` busca
  - `N` novo item
  - `Esc` fechar drawer/sheet
- Skeletons mais bonitos
- Empty states contextuais
- Onboarding hints discretos (primeira execução)

### Prioridade
- **Agora**: acessibilidade + variantes consistentes + atalhos básicos
- **Depois**: command palette + onboarding hints

---

## 2.12 PWA

### O que melhorar
- CTA discreto para instalação (especialmente iPhone):
  - instruções Safari > compartilhar > Adicionar a Tela de Início
- Estado offline/online visível
- Suporte offline básico:
  - abrir app offline
  - mostrar dados recentes
- Atualização de app (Service Worker):
  - detectar nova versão
  - toast "Nova versão disponível" + botão atualizar

### O que incluir
- (Depois) fila offline de ações simples (criar/concluir)
- (Depois) background sync leve
- (Depois) Web Share Target (compartilhar texto para o app)

### Prioridade
- **Agora**: update prompt + estado offline
- **Depois**: fila offline + share target

---

## 2.13 Backend / dados

### O que melhorar (infra + integridade)
- `updated_at` automático com trigger
- Índices para queries frequentes:
  - `tasks(user_id, status, due_at)`
  - `tasks(user_id, project_id)`
  - `reminders(status, trigger_at)`
- Considerar `archived_at` / soft delete (tasks/events)

### APIs / queries focadas em tela
Criar queries/endpoints focados no hub, evitando round trips demais:
- `dashboard_summary`
- `smart_cards_counts`
- `active_view_items`
- `mini_agenda`

### Observabilidade
- Logs da `send-reminders`
- Retry policy simples para push falho
- Tabela de falhas / auditoria de envio
- Auditoria de automações (GitHub) visível no app

### Datas / timezone
- Salvar UTC sempre
- Parser usando timezone configurada do usuário
- Exibir datas no timezone do usuário

### O que incluir
- Jobs agendados de manutenção:
  - limpeza de subscriptions inválidas
  - retries de envio
- Export de dados (JSON/CSV)
- Métricas pessoais (futuro):
  - concluídos por dia/semana
  - atraso médio
  - uso de quick add

### Prioridade
- **Agora**: queries focadas no hub + logs/retry push + updated_at trigger
- **Depois**: export + métricas + jobs extras

---

## 3) Melhorias globais de UX (inspiradas em iOS Calendar + Reminders)

### 3.1 Estrutura "uma página só" (recomendada)
#### Desktop
- Topo fixo: quick add + chips + busca + botão adicionar
- Coluna principal: smart cards + vista ativa (lista/agenda)
- Coluna lateral: mini calendário + próximos eventos + fixados
- Drawer lateral: detalhe do item selecionado

#### Mobile / PWA
- Topo compacto
- FAB para adicionar
- Lista/agenda como foco principal
- Bottom sheet para criar/editar
- Tab bar inferior (Hoje, Calendario, Listas, Inbox, Mais)

### 3.2 Padrões de interação importantes
- Click no dia do calendário = criação rápida / filtro da vista
- Click no item = abre drawer/sheet (sem trocar de tela)
- Swipe/long-press no mobile para ações rápidas
- Hover no desktop para ações rápidas
- Undo toast em ações destrutivas

### 3.3 Smart lists mais "Reminders-like"
Cards fixos recomendados:
- Hoje
- Programado
- Todos
- Atrasados
- Inbox
- Sem data
- Concluídos
- Projetos

Melhorias nos cards:
- contador em destaque
- preview de 1-2 itens
- ícone discreto
- estado ativo visual
- estado vazio contextual

### 3.4 "Vista ativa" como centro do uso diário
- Cards controlam a vista abaixo
- Título da vista muda dinamicamente
- Modos (futuro): Lista / Agenda / Calendario
- Agrupar por data quando fizer sentido
- Separar Dia inteiro vs Horarios

---

## 4) Features novas que valem muito (não deixar de considerar)

### 4.1 Recorrência (explícita como feature principal)
- Tarefas e eventos recorrentes
- Presets simples:
  - diário
  - semanal
  - mensal
- Regra ao concluir: gerar próxima ocorrência

### 4.2 Inbox Triage Mode
Modo de triagem da Inbox com foco em organizar rápido:
- um item por vez
- ações rápidas:
  - definir data
  - definir projeto
  - converter em evento
  - concluir
  - excluir
- ótimo para manter o sistema limpo

### 4.3 Fixados / Top 3 do dia
- bloco na home com prioridades do dia
- ajuda foco real e reduz dispersão

### 4.4 Modo foco
Mostra só o essencial:
- quick add
- agenda de hoje
- top 3
- item selecionado

### 4.5 Activity / Histórico
- log de ações do usuário e automações
- aumenta confiança no sistema e ajuda debugging de UX

### 4.6 Export / Backup
- export JSON/CSV
- (depois) import
- muito útil mesmo em app pessoal

### 4.7 Command Palette
- `Cmd/Ctrl + K`
- criar item, navegar, buscar, executar ações
- ganho enorme no desktop

---

## 5) Melhorias de design e qualidade visual (Pacote UX)

### 5.1 Hierarquia visual
- Título da tela > subtítulos de seção > títulos de item > metadados
- Metadados com contraste menor e sem competir com o conteúdo principal
- Evitar excesso de cor por item

### 5.2 Contraste e tema escuro
- Fundo da página, card e linha com níveis diferentes (dark mode em camadas)
- Bordas suaves
- Hover sutil (sem exagero)
- Focus ring claro e consistente

### 5.3 Linhas de item (em vez de cards pesados na lista)
- Checkbox grande e fácil de tocar
- Título + subtítulo
- Data/hora curta
- Ações discretas no hover

### 5.4 Estados vazios contextuais
Trocar "Nenhum item" por mensagens úteis, ex:
- Hoje: "Sem tarefas hoje. Quer adicionar uma entrega ou lembrete?"
- Atrasados: "Tudo em dia. Boa."
- Inbox: "Capture ideias no campo acima."

### 5.5 Microinterações consistentes
- Drawer/sheet: fade + slide curto
- Concluir item: animação leve + toast
- Card selecionado: transição de borda/fundo
- Seções recolhíveis: height animation discreta

### 5.6 Mobile-first (PWA no iPhone)
- safe areas (notch e barra inferior)
- FAB com menu rápido
- bottom sheet em vez de modal central
- alvos de toque >= 44px

---

## 6) Roadmap sugerido (priorização por fase)

## Fase 1 - Alto valor / baixa-média complexidade (agora)
1. Vista ativa robusta no hub (cards controlam a lista abaixo)
2. Drawer/sheet de detalhe refinado (inline + seções recolhíveis)
3. Quick Add com score de confiança + chips editáveis + parser contextual
4. Recorrência simples (tarefas e/ou eventos)
5. Push status + teste + snooze
6. Acessibilidade + atalhos básicos (`Q`, `/`, `N`, `Esc`)
7. Melhorias visuais de ListItemRow + smart cards

## Fase 2 - Experiência madura (próximo)
8. Agenda semanal + integração forte com calendário no hub
9. Inbox Triage Mode
10. Fixados / Top 3 do dia
11. Configurações de parser e comportamento (horários padrões, regra de datas)
12. Logs/histórico no app (atividade + automações)
13. PWA update prompt + estado offline

## Fase 3 - Diferencial forte (depois)
14. GitHub modo assistido + histórico de matches + status webhook
15. Command Palette (`Cmd/Ctrl + K`)
16. Export/backup JSON/CSV
17. Offline actions queue (básico)
18. Integração GitHub com issues/PRs

---

## 7) Sugestões de implementação para o Cursor (por blocos)

### Bloco A - Hub + vista ativa
- Cards controlam estado `activeView`
- Lista principal reage sem navegar de rota
- Drawer/sheet abre item selecionado sem perder contexto

### Bloco B - Quick Add confiável
- Parser com score de confiança
- Preview com chips editáveis
- Parser contextual (dia selecionado / inbox)
- Atalhos de teclado

### Bloco C - Tarefas e agenda com UX boa
- `ListItemRow` unificado para tarefa/evento
- Swipe/hover actions
- Programado agrupado com sticky headers
- Dia inteiro vs Horarios

### Bloco D - Notificações e confiabilidade
- Tela de status push
- Teste de notificação
- Snooze
- Logs e retry de `send-reminders`

### Bloco E - GitHub diferencial
- Modo assistido
- Histórico de automação
- Status de webhook
- Simulador de regra (futuro)

---

## 8) Checklist de qualidade (para não se perder durante a evolução)

### UX
- [ ] Adicionar item em poucos segundos sem formulário pesado
- [ ] Editar item sem trocar de página
- [ ] Cards controlam a vista ativa de forma clara
- [ ] Estado vazio sempre explica o próximo passo
- [ ] Mobile confortável (toques, safe area, sheet)

### Confiabilidade
- [ ] Parser mostra interpretação e confiança
- [ ] Timezone consistente (salvar UTC, exibir local)
- [ ] Push com teste e status visível
- [ ] Ações importantes com Undo
- [ ] Automações GitHub com logs e transparência

### Consistência visual
- [ ] Tokens e componentes padronizados
- [ ] Mesma hierarquia visual entre telas
- [ ] Estados de hover/focus/disabled consistentes
- [ ] Dark mode com contraste suficiente

### Performance / dados
- [ ] Queries focadas no hub (menos round-trips)
- [ ] Índices nas tabelas principais
- [ ] Skeleton/loading onde fizer sentido
- [ ] Logs de reminders e retries

---

## 9) Observações finais

O Remind.me já tem uma base excelente e um diferencial muito forte com:
- captura rápida em PT-BR
- hub de produtividade
- PWA + push
- automação com GitHub

As próximas melhorias devem priorizar **fluidez e confiança**, não apenas volume de features.

A regra para guiar a evolução pode ser:
- **menos cliques**
- **mais contexto**
- **mais transparência do que o sistema está fazendo**
- **mais consistência visual**


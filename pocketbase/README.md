# Loloverse · Backend Seguro em PocketBase (VM Oracle ARM64 + Cloudflare)

Este diretório contém toda a camada de banco de dados, regras de acesso (**RBAC**), proteção **LGPD**, motor anti-trapaça (**hooks transacionais**) e infraestrutura otimizada para rodar o **PocketBase** com segurança na sua **VM Oracle Cloud (Ubuntu ARM64 · 1 OCPU · 1 GB RAM)**.

---

## 1. Arquitetura de Segurança (Defesa em Profundidade)

1. **Cadastro Exclusivo por Google OAuth2 + Código de Convite 1-para-1 (inclusive Alunos):**
   - A coleção `users` bloqueia criação direta pela API (`createRule = '@request.context = "oauth2"'` + hook `onRecordCreateRequest`).
   - No primeiro login via Google (`onRecordAuthWithOAuth2Request`), o servidor exige um `inviteCode` ativo, não expirado, não usado e vinculado **exatamente ao mesmo e-mail retornado pelo Google**.
   - A reserva do convite acontece dentro de uma transação atômica SQLite (`$app.runInTransaction`) — sem *race conditions*.
   - `role` e `class` são sempre carimbados pelo servidor a partir do convite (o cliente não consegue escalar privilégio).
   - Se o convite for de `student`, a Ficha RPG inicial na coleção `students` nasce automaticamente no servidor.

2. **Conta de Admin Segura (Fora do Modo Google):**
   - **Superuser PocketBase (`_superusers`):** gerencia infraestrutura, backups e OAuth2 via painel `/_/` (acessível **somente por túnel SSH**, bloqueado na internet pública!).
   - **Conta Admin Escolar (`users` com `role = "admin"` e `allowPasswordLogin = true`):** pode fazer login no app Loloverse com **e-mail + senha forte (>= 12/14 caracteres)** fora do Google.
   - Contas comuns (alunos, professores e coordenadores convidados via Google) nascem com `allowPasswordLogin = false`: o hook `onRecordAuthWithPasswordRequest` bloqueia qualquer tentativa de login por senha nessas contas e registra o evento em `activity_logs` (`seguranca`).
   - O Admin também pode criar exceções institucionais (ex.: coordenação sem conta Google) via `POST /api/loloverse/admin/accounts`.

3. **Motor RPG & Economia 100% Server-Side (Anti-Cheat):**
   - Escrita direta do cliente em `students`, `quest_completions`, `redemptions` e `activity_logs` é **bloqueada (`null`)**.
   - XP, Nível, Ouro, HP, Bússola de Competências, Frequência, Intervenções e Resgates da Lojinha executam exclusivamente nos endpoints transacionais de [02_rpg_economy.pb.js](./pb_hooks/02_rpg_economy.pb.js).
   - Índice único `(quest, student)` em `quest_completions` impede duplicação de recompensas no nível do banco de dados.

4. **Privacidade Escolar (LGPD) em REST e Realtime:**
   - O hook [04_privacy_audit.pb.js](./pb_hooks/04_privacy_audit.pb.js) intercepta `onRecordEnrich` (que roda em `list`, `view` e **Realtime SSE**):
     - Oculta `lastInterventionNote` e `interventionsCount` de qualquer conta de aluno.
     - Oculta notas (`bimesterAverage`, `previousAverage`) e frequência (`attendanceRate`, `attendanceToday`, `deliveryRate`) de **outros colegas** quando um aluno lista a turma.
     - Oculta `allowPasswordLogin` e `inviteCodeUsed` de contas que não sejam `admin` ou `coordinator`.

5. **Hardening de Rede & VM Oracle 1 OCPU / 1 GB RAM:**
   - PocketBase roda como binário Go nativo (sem overhead de Docker), com usuário não-root `pocketbase`, escutando **apenas em `127.0.0.1:8090`**.
   - `GOMEMLIMIT=512MiB` + `MemoryMax=700M` + swap de segurança de 2 GB (`vm.swappiness=10`).
   - Exposição recomendada via **Cloudflare Tunnel (`cloudflared`)**: **zero portas HTTP/HTTPS abertas** no firewall da VM, HTTPS automático compatível com a Vercel, e rota `/_/` retornando `404` publicamente.

---

## 2. Mapa das 14 Coleções & Matriz RBAC

| Coleção | Leitura (`list`/`view`) | Escrita Direta (`create`/`update`/`delete`) | Observações |
| :--- | :--- | :--- | :--- |
| `users` | Usuários ativos | `create`: só OAuth2 · `update`: só campos cosméticos próprios · `delete`: bloqueado | `authRule = "active = true"`, `emailVisibility = false` |
| `invites` | Coordenação / Admin | Coordenação / Admin | Código único vinculado 1-para-1 ao e-mail |
| `classes` | Usuários ativos | Coordenação / Admin (`delete`: só Admin) | Turmas escolares |
| `students` | Staff vê todos; Aluno vê própria turma | **Bloqueada (`null`)** | Mutações só via `/api/loloverse/*`; campos sensíveis ocultos por LGPD |
| `quests` | Staff vê todas; Aluno vê da sua turma | Staff (Prof / Coord / Admin) | Missões diárias, tarefas e desafios coletivos |
| `quest_completions` | Staff / Turma | **Bloqueada (`null`)** | Índice único `(quest, student)` |
| `shop_rewards` | Staff vê tudo; Aluno só `approved = true` | Coordenação / Admin | Governança econômica |
| `redemptions` | Staff vê tudo; Aluno só os próprios | `create/delete`: bloqueado · `update`: só `status` por Staff | Vouchers da Lojinha |
| `study_rooms` | Usuários ativos | Staff | Entrada/saída de vagas via endpoint atômico |
| `channel_categories` | Usuários ativos | Staff | Categorias do Espaço Híbrido |
| `chat_channels` | Usuários ativos | Staff | Canais com flag `staffOnlyTopics` |
| `channel_topics` | Usuários ativos | Staff ou Aluno (em canais abertos, sem `pinned`) | Anti-spoofing no hook |
| `chat_messages` | Usuários ativos | Criação autenticada (anti-spoofing de autor/cargo) | Reações 1-por-usuário via endpoint |
| `activity_logs` | Staff (Prof / Coord / Admin) | **Bloqueada (`null`)** | Trilha de auditoria imutável |

---

## 3. Endpoints Server-Side (`/api/loloverse/...`)

| Método | Rota | Quem pode chamar | Função |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/loloverse/invites/verify` | Público (antes do Google) | Pré-valida par `{ email, code }` sem enumerar e-mails |
| `POST` | `/api/loloverse/invites/generate` | Coordenação / Admin | Gera 1 ou até 100 convites vinculados a e-mails |
| `POST` | `/api/loloverse/admin/accounts` | Admin | Cria conta institucional com `allowPasswordLogin = true` |
| `POST` | `/api/loloverse/behavior-feedback` | Prof / Coord / Admin | Aplica preset do Pulso da Turma (XP, Ouro, HP, Competência) |
| `POST` | `/api/loloverse/attendance` | Prof / Coord / Admin | Registra chamada (`presente`, `atraso`, `falta`) e ajusta HP |
| `POST` | `/api/loloverse/interventions` | Coordenação / Admin | Registra acolhimento do Radar de Cuidado (`+HP`) |
| `POST` | `/api/loloverse/quests/{id}/complete` | Aluno (própria turma) / Staff | Conclui missão com atomicidade e evolução de nível |
| `POST` | `/api/loloverse/rewards/{id}/redeem` | Aluno | Resgata recompensa aprovada verificando Ouro e estoque |
| `POST` | `/api/loloverse/messages/{id}/react` | Usuário ativo | Alterna reação por usuário (`1 voto por emoji`) |
| `POST` | `/api/loloverse/study-rooms/{id}/join` | Usuário ativo | Ocupa vaga respeitando `maxSeats` e atualiza presença |
| `POST` | `/api/loloverse/study-rooms/leave` | Usuário ativo | Libera vaga da mesa de estudo |
| `POST` | `/api/loloverse/presence` | Aluno | Atualiza apenas o próprio status e atividade de estudo |

---

## 4. Resumo do Deploy na VM Oracle (quando formos subir)

1. Na VM Ubuntu ARM64, clonar o repositório e executar:
   ```bash
   sudo bash pocketbase/deploy/install-oracle-arm64.sh
   ```
2. Criar a conta `_superuser` pela CLI e (opcionalmente) o bootstrap do Admin escolar via `/opt/loloverse-pb/.env`.
3. Abrir túnel SSH seguro do seu computador para acessar o painel administrativo sem expô-lo na internet:
   ```bash
   ssh -L 8090:127.0.0.1:8090 ubuntu@SEU_IP_ORACLE
   ```
   Acessar `http://127.0.0.1:8090/_/` e configurar:
   - **Settings → Application:** nome `Loloverse`, URL `https://api.seudominio.com.br`
   - **Settings → Backups:** ativar backups automáticos agendados (ex.: Cloudflare R2 — gratuito até 10 GB)
   - **Collections → users → Options → OAuth2:** adicionar provedor **Google** com Client ID e Client Secret do Google Cloud Console (Authorized Redirect URI: `https://api.seudominio.com.br/api/oauth2-redirect`).
4. Subir o **Cloudflare Tunnel** com [cloudflared-config.example.yml](./deploy/cloudflared-config.example.yml) apontando `api.seudominio.com.br` para `http://127.0.0.1:8090` (com `/_/` retornando `404`).
5. Configurar `NEXT_PUBLIC_POCKETBASE_URL=https://api.seudominio.com.br` na **Vercel**.

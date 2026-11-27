# PROJECT_LOG · Loloverse (Handoff & Histórico Técnico)

> **Para agentes e desenvolvedores:** Leia este arquivo antes de fazer alterações no repositório. Ele registra o estado atual do **Loloverse**, decisões de produto obrigatórias, arquitetura, contas de teste, histórico de entregas e o fluxo de deploy.

---

## 1. Status Atual (Onde Paramos)

- **Versão / Release:** `v0.1.0` (MVP Funcional em Testes)
- **Branch principal:** `main`
- **Repositório GitHub:** `https://github.com/diogolabs/loloverse`
- **Deploy:** Integrado à **Vercel** (push na branch `main` publica automaticamente; releases registrados no GitHub).
- **Momento atual:** O usuário realizou o deploy na Vercel, confirmou que a plataforma está no ar e está executando testes funcionais pelo navegador antes de enviar a primeira rodada de feedback e ajustes.

---

## 2. Diretrizes Obrigatórias de Produto & Marca

Qualquer nova feature ou ajuste deve respeitar rigorosamente estas regras definidas com o criador do projeto:

1. **Linguagem 100% própria do Loloverse (ZERO referências a marcas externas ou frameworks de terceiros):**
   - **Não** mencionar nomes de outros aplicativos educacionais, ferramentas de chat ou frameworks teóricos na interface, no código-fonte ou na documentação.
   - Usar sempre a nomenclatura proprietária do Loloverse:
     - **Espaço Híbrido** (mesas de estudo ao vivo + categorias + canais + tópicos guiados)
     - **Pulso da Turma** (feedback comportamental instantâneo em sala)
     - **Diário & Frequência** (chamada rápida e médias bimestrais)
     - **Central de Missões** (missões diárias, tarefas e desafios coletivos)
     - **Bússola de Competências** (*Propósito, Maestria, Criatividade, Colaboração Social*)
     - **Radar de Cuidado** (detecção preventiva de risco de evasão/queda de rendimento)
2. **Design & Experiência de Usuário ("Caderno Vivo" — Sketchbook Neobrutalism):**
   - Priorizar **estética acolhedora, calma visual e clareza pedagógica** — evitar telas escuras superlotadas ou fluxos de chat infinitos onde o aprendizado se perde.
   - Fundo papel quente `#FAF8F5` com grid pontilhado sutil (`src/app/globals.css`).
   - Containers com bordas sólidas (`border-2 border-zinc-900`), `rounded-xl` e sombra sólida (`shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]`).
   - Micro-interações táteis nos botões (`active:translate-x-[2px] active:translate-y-[2px] active:shadow-none`).
   - Tipografia via `next/font/google`: `Patrick Hand` (`--font-hand`, títulos/badges/números) + `Plus Jakarta Sans` (`--font-sans`, leitura limpa e tabelas).
   - Paleta principal: Amarelo Marca-Texto (`#FACC15`), Verde Esmeralda (`#10B981`), Azul Caderno (`#3B82F6`), Coral/Alerta (`#F43F5E`) e Roxo Místico (`#8B5CF6`).

---

## 3. Arquitetura Técnica & Persistência

- **Stack:** Next.js `14.2.25` (App Router) + React 18 + TypeScript (`strict: true`) + Tailwind CSS `3.4.17` + `lucide-react`. Sem bibliotecas pesadas de UI.
- **Autenticação & Estado Global (`src/context/LoloverseContext.tsx`):**
  - **Banco client-side compartilhado:** persistido em `localStorage` sob a chave `loloverse_mvp_state_v4`.
  - **Sessão isolada por aba:** persistida em `sessionStorage` sob a chave `loloverse_session_account_id_v4`.
  - **Sincronização em tempo real entre abas:** listener de `window.addEventListener("storage", ...)` permite abrir duas abas lado a lado com contas diferentes (ex: Professor e Aluna) e ver pontos, missões, mesas de estudo e mensagens sincronizarem ao vivo.
  - **Reset seguro:** botão `Resetar Demo` na barra superior restaura o estado inicial (`INITIAL_STATE`).
- **Tipagem e Dados Iniciais:**
  - `src/types/index.ts` — todas as interfaces (`Account`, `Student`, `ClassRoom`, `Quest`, `ShopReward`, `StudyRoom`, `ChannelCategory`, `ChatChannel`, `ChannelTopic`, `ChatMessage`, `ActivityLog`, etc.).
  - `src/data/mockData.ts` — dados realistas de contexto escolar brasileiro (3 turmas, 15 estudantes, 18 contas pré-cadastradas, 3 mesas de estudo, 4 categorias, 4 canais, 5 tópicos iniciais, missões, lojinha e histórico).

---

## 4. Mapa de Arquivos Implementados

```text
src/
├── app/
│   ├── globals.css                     # Estilo Caderno Vivo, utilitários sketch-* e scrollbar
│   ├── layout.tsx                      # Fontes Patrick Hand + Plus Jakarta Sans + Provider
│   └── page.tsx                        # Roteamento entre AuthScreen e painel do cargo autenticado
├── types/
│   └── index.ts                        # Contratos TypeScript do sistema
├── data/
│   └── mockData.ts                     # Dados iniciais (turmas, alunos, contas, quests, espaço híbrido)
├── context/
│   └── LoloverseContext.tsx            # Estado global, autenticação, ações e sync entre abas
└── components/
    ├── auth/
    │   └── AuthScreen.tsx              # Login com usuário/senha, criação de conta e diretório de testes
    ├── shared/
    │   ├── TopNavbar.tsx               # Logo, conta autenticada, modal Trocar Conta, Sair e Reset
    │   ├── HybridSpaceHub.tsx          # Mesas editáveis + Categorias + Canais + Tópicos Guiados + Presença
    │   ├── SketchAvatar.tsx            # Avatares SVG desenhados à mão por seed + ponto de status
    │   ├── PillarBadge.tsx             # Badges das 4 competências (Propósito, Maestria, Criatividade, Social)
    │   └── ToastContainer.tsx          # Notificações animadas no canto inferior direito
    ├── teacher/
    │   ├── TeacherView.tsx             # Container docente + seletor de turma + 4 abas
    │   ├── ClassroomPulseGrid.tsx      # Pulso da Turma (grid de alunos + modal de pontos/alertas)
    │   ├── AttendancePanel.tsx         # Diário & Frequência (Presente/Atraso/Falta + médias)
    │   └── QuestManager.tsx            # Central de Missões (Diárias, Tarefas e Boss Battles)
    ├── student/
    │   ├── StudentView.tsx             # Container discente (Ficha RPG + Missões/Lojinha + Espaço Híbrido)
    │   ├── CharacterSheet.tsx          # Ficha RPG (HP, XP, Ouro, Nível, Insígnias e Radar SVG de Competências)
    │   └── QuestsAndShop.tsx           # Conclusão de missões + Lojinha da Turma + Vouchers
    └── coordinator/
        ├── CoordinatorView.tsx         # Container executivo (Radar, Auditoria/Economia e Espaço Híbrido)
        ├── ExecutiveKpis.tsx           # KPIs consolidados em tempo real
        ├── AttentionRadar.tsx          # Radar de Cuidado (HP <= 55, Freq < 78% ou queda de média >= 1.0)
        └── EconomyAudit.tsx            # Consolidação por turma, governança da Lojinha e trilha de auditoria
```

---

## 5. Contas de Teste Pré-Configuradas

Todas as contas iniciais usam a senha simples **`123`** (e novas contas podem ser criadas na aba **Criar Conta**; contas de aluno criadas na hora já nascem com Ficha RPG Nível 1 na turma escolhida):

- **Professores:** `prof.rafael` / `123` (8º Ano A) · `prof.camila` / `123` (9º Ano B)
- **Coordenadora:** `coord.helena` / `123`
- **Estudantes (exemplos):**
  - `sofia` / `123` — Sofia Oliveira (8º Ano A · Nv. 7 · 92 HP · 135 Ouro)
  - `pedro` / `123` — Pedro Henrique Rocha (8º Ano A · 42 HP · visível no Radar de Cuidado)
  - `lucas`, `beatriz`, `gabriel`, `mariana`, `enzo`, `lara`, `cauane`, `davi`, `helena`, `thiago`, `isabela`, `matheus`, `yasmin` (todos com senha `123`).

---

## 6. Histórico Cronológico de Entregas (Commits)

1. **`91540ae` — MVP Inicial:**
   - Setup completo Next.js 14 (App Router) + TypeScript + Tailwind CSS + fontes Google.
   - Construção das 3 visões (Professor, Aluno e Coordenador), estética Caderno Vivo, persistência em `localStorage`, avatares SVG próprios, Radar de Competências e build de produção validado.
   - Inicialização Git e criação/push do repositório público `diogolabs/loloverse`.
2. **`03b7d47` — Contas Reais com Senhas Simples + Sincronização Multi-Aba:**
   - Substituição do alternador de personas sem login por autenticação real de teste (`AuthScreen`), cadastro dinâmico de novas contas (criando perfil RPG automático para novos alunos), modal rápido `Trocar Conta`, `sessionStorage` por aba + `StorageEvent` cross-tab.
   - Inclusão de Mesas de Estudo ao Vivo e acesso docente/coordenação ao ambiente colaborativo.
3. **`48fb350` — Novo Espaço Híbrido (Curadoria Limpa) + Identidade 100% Própria:**
   - Reestruturação completa do ambiente colaborativo em `HybridSpaceHub.tsx`:
     - **Mesas de Estudo ao Vivo** 100% editáveis por Professor e Coordenador (nome, tema/pauta, cor, vagas, criar e remover).
     - **Hierarquia limpa em 3 camadas:** Categorias coloridas recolhíveis → Canais com nomes legíveis → Tópicos Guiados (com status *Fixado* e *Resolvido*, sem chat infinito caótico).
   - Remoção completa (auditada via `grep`) de todas as referências a marcas externas e jargões de terceiros em UI, arquivos, símbolos TypeScript e documentação.

---

## 7. Fluxo de Trabalho & Deploy Contínuo

- Após qualquer alteração:
  1. Validar `npm run lint`, `npx tsc --noEmit` e `npm run build` (zero erros).
  2. Atualizar este `PROJECT_LOG.md` com o resumo das mudanças.
  3. Commitar na branch `main` e executar `git push origin main` (dispara deploy automático na Vercel).
  4. Criar/atualizar release no GitHub via `gh release create <tag> --title "..." --notes "..."` quando fechar marcos importantes.

---

## 8. Próximos Passos Previstos

- [x] **Modelagem & Deploy Inicial do Backend Seguro em PocketBase (`pocketbase/`):**
  - Schema relacional com 14 coleções, índices e matriz RBAC em `pocketbase/pb_migrations/1764000001_initial_schema.js` e seed estrutural sem credenciais fixas em `1764000002_seed_initial_school.js`.
  - Guarda de perímetro (`00_security_guard.pb.js`): bloqueia `/_/` via Cloudflare/proxy com `404` (acesso ao painel Superuser somente por túnel SSH) + cabeçalhos HTTP de segurança.
  - Autenticação escolar segura (`01_auth_invites.pb.js`): cadastro exclusivamente via **Google OAuth2** com **código de convite obrigatório vinculado 1-para-1 ao e-mail** (inclusive alunos) + exceção controlada (`allowPasswordLogin = true`) para conta de **Admin escolar** fora do modo Google.
  - Motor transacional RPG/Economia 100% server-side (`02_rpg_economy.pb.js`), proteção anti-spoofing no Espaço Híbrido (`03_hybrid_space.pb.js`) e ocultação LGPD em REST/Realtime (`04_privacy_audit.pb.js`).
  - **Publicado e validado ao vivo na VM Oracle (`Ubuntu 22.04 x86_64`, 1 GB RAM):** `pocketbase v0.40.6` via `systemd` (`GOMEMLIMIT=192MiB`, ~38 MB RSS), escutando apenas na bridge privada do `cloudflared-tunnel` (`172.18.0.1:8090`), com regra persistente `iptables` restrita à rede interna do Docker.
- [x] **Etapa 2 — Integração Frontend Next.js + PocketBase Real (`src/lib/pocketbase.ts`, `LoloverseContext.tsx`, `AuthScreen.tsx`, `InviteManager.tsx`):**
  - SDK oficial `pocketbase` conectado via `NEXT_PUBLIC_POCKETBASE_URL` com Realtime SSE (debounce 300ms) e endpoints transacionais `/api/loloverse/*`.
  - Tela de login de produção com 3 abas: **Entrar com Google**, **Convite** (leitura automática de `?convite=...&email=...`, pré-validação no servidor + cadastro Google) e **Admin** (e-mail/senha fora do Google).
  - Retorno Google OAuth2 via PKCE dedicado em `src/app/auth/callback/page.tsx` (estética Caderno Vivo), mantendo `/_/` e APIs de Superuser 100% bloqueados em `404` na internet pública.
  - Correção `e.oAuth2User` no hook `01_auth_invites.pb.js` + suporte completo a **Primeiro Acesso por Link + Criação de Senha** (`POST /api/loloverse/invites/accept`, senha mín. 8 chars na Migration `003`) e **envio/reenvio automático de convites por e-mail** via SMTP do PocketBase (`POST /api/loloverse/invites/generate` e `/invites/{id}/resend`).
  - Painel **Convites (Modo Híbrido)** no `CoordinatorView` (Admin/Coordenação): emissão individual, importação em lote via CSV/planilha com prévia validada, cópia de link direto, revogação e exportação CSV.
- [x] **Etapa 3 — Ficha RPG (6 Atributos BNCC) + Percurso Dinâmico & Avaliação 3D (`src/data/bnccAndPaths.ts`, `CharacterSheet.tsx`, `DynamicPathView.tsx`, `DynamicPathManager.tsx`, `1764000004_dynamic_paths_bncc.js`, `05_dynamic_paths.pb.js`):**
  - Evolução da Ficha do Personagem para **6 Atributos RPG cobrindo as 10 Competências Gerais da BNCC** (`CON`, `INV`, `EXP`, `DIG`, `ARG`, `ELO`) em **escala de crescimento 1–20** com faixas descritivas (*A explorar → Em Descoberta → Em Construção → Consolidado → Referência*), radar hexagonal SVG e regra inviolável não-punitiva (alertas do Pulso afetam apenas o `HP`).
  - **Oficina do Personagem** (customização do `SketchAvatar` + escolha de Título Disciplinar), **Álbum de Selos** com desbloqueio automático, **Diário de Conquistas** pessoal, correção da Chama diária (`lastStreakDate`) e recuperação de HP no *Espaço Híbrido* (teto `+8 HP/dia`).
  - Novo módulo **Percurso Dinâmico** organizado em **Ciclo 1 · Exploração & Base** e **Ciclo 2 · Criação & Mostra** com os **12 formatos autorais** (*Ponto de Partida, Roda de Hipóteses, Mesa de Ideias, Laboratório de Evidências, Roda de Conexões, Registro de Bordo, Saída Exploratória, Encontro com Convidado, Montagem de Equipes, Estúdio em Equipe, Estúdio Autoral e Mostra Pública*).
  - **Avaliação 3D & Rubrica 4 Níveis** com **Muralha Jogo ≠ Nota** e **Ponte Opt-In de Notas** (`Formativo 0%`, `Composição Ponderada` com confirmação explícita *"Validar e Lançar no Diário"*, ou `Bônus Contínuo`), alerta precoce do Ciclo 1 no `AttentionRadar`, e privacidade LGPD reforçada em `04_privacy_audit.pb.js`.
- [ ] Etapas futuras (migrations incrementais): Calendário Letivo (Bimestre/Trimestre), Avaliações Online Anti-Cola + Validação de Notas, Grade Semanal com Disponibilidade Docente & BNCC, e Mapeamento de Turmas (`seating_maps`).

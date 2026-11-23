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

- [ ] Coletar e implementar o feedback do usuário após testes ao vivo na Vercel.
- [ ] (Futuro / Pós-validação do MVP) Migrar persistência local (`localStorage`) para backend multi-dispositivo real (ex: Supabase Auth + PostgreSQL + Realtime) e áudio/Pomodoro nas Mesas de Estudo.

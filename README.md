# Loloverse · Gestão Escolar, Gamificação Octalysis & Salinha Híbrida

MVP funcional de uma plataforma EdTech completa que une gestão escolar (estilo Activesoft/KM Escolar), feedback comportamental em sala (estilo ClassDojo), RPG de tarefas e hábitos baseado no **Framework Octalysis** (estilo Habitica) e salas de interação híbrida (estilo Salinha/Discord), com identidade visual **Sketchbook Neobrutalism**.

## Personas Reativas em Tempo Real

Todas as ações feitas em uma persona sincronizam instantaneamente com as demais via React Context + persistência em `localStorage`:

- **Visão do Professor (Padrão):**
  - **Painel ClassDojo:** Cards ilustrados dos alunos com modal rápido para conceder Pontos Positivos (`+XP`, `+Ouro`, atributos Octalysis) ou Alertas Comportamentais (`-HP`) com toasts animados.
  - **Diário de Classe & Frequência (Activesoft):** Chamada rápida (`Presente`, `Atraso`, `Falta`), frequência acumulada e médias bimestrais.
  - **Gerenciador de Quests (Habitica):** Criação e gestão de Missões Diárias, Tarefas de Casa e Boss Battles Coletivas vinculadas aos pilares Octalysis.
- **Visão do Aluno (RPG & Salinha):**
  - **Ficha do Personagem:** Avatar ilustrado, nível, barras de HP (Saúde Acadêmica) e XP, saldo de Ouro, insígnias e radar dos 4 atributos Octalysis (*Propósito, Maestria, Criatividade, Social*).
  - **Quadro de Missões & Lojinha da Turma:** Conclusão interativa de quests e resgate de vantagens reais com Ouro.
  - **Salinha Híbrida (Discord):** Canais de texto (`#mural-avisos`, `#duvidas-matematica`, `#projetos-maker`, `#off-topic`), colegas online com status de estudo, reações e chat persistente.
- **Visão do Coordenador (Governança & Inteligência Escolar):**
  - **Dashboard Executivo:** KPIs consolidados (Frequência Média, Engajamento Gamificado, Índice de Entregas e Economia de Ouro).
  - **Radar de Atenção (Core Drive 8):** Detecção automática de alunos com risco de evasão/queda de rendimento e registro de intervenção pedagógica com restauração de HP.
  - **Auditoria & Economia:** Visão consolidada por turma, aprovação/ajuste de preços da Lojinha Escolar e trilha de auditoria ao vivo.

## Stack

- **Next.js 14 (App Router)** + **TypeScript**
- **Tailwind CSS** + **lucide-react**
- Fontes `Patrick Hand` + `Plus Jakarta Sans` via `next/font/google`
- Persistência client-side via React Context + `localStorage` (com botão **Resetar Dados da Demo**)

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

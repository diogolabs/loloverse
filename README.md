# Loloverse · Gestão Escolar, Missões RPG & Espaço Híbrido

MVP funcional de uma plataforma educacional que une gestão escolar, feedback comportamental em sala, sistema de missões e evolução por competências e um **Espaço Híbrido** organizado em Categorias, Canais, Tópicos Guiados e Mesas de Estudo com identidade visual **Caderno Vivo (Sketchbook Neobrutalism)**.

## Contas de Teste & Autenticação

O sistema possui contas reais de teste (senha padrão `123`) com sessão isolada por aba (`sessionStorage`) e sincronização ao vivo entre abas (`localStorage`), além de cadastro de novas contas:

- **Professores:** `prof.rafael` / `123` · `prof.camila` / `123`
- **Coordenadora:** `coord.helena` / `123`
- **Estudantes:** `sofia` / `123`, `pedro` / `123`, `lucas` / `123`, `beatriz` / `123` (primeiro nome em minúsculas + senha `123`)

## Módulos Principais

- **Visão do Professor:**
  - **Pulso da Turma:** Cards ilustrados dos alunos com modal rápido para conceder Pontos Positivos (`+XP`, `+Ouro`, competências) ou Alertas Comportamentais (`-HP`).
  - **Diário & Frequência:** Chamada rápida (`Presente`, `Atraso`, `Falta`), frequência acumulada e médias bimestrais.
  - **Central de Missões:** Criação e gestão de Missões Diárias, Tarefas de Casa e Desafios Coletivos por competência (*Propósito, Maestria, Criatividade, Colaboração Social*).
  - **Espaço Híbrido (Curadoria):** Criação de Categorias, Canais, Tópicos e edição de temas das Mesas de Estudo ao vivo.
- **Visão do Aluno (Perfil RPG & Espaço Híbrido):**
  - **Ficha do Personagem:** Avatar ilustrado, nível, barras de HP (Saúde Acadêmica) e XP, saldo de Ouro, insígnias e Bússola de Competências (*Propósito, Maestria, Criatividade, Social*).
  - **Quadro de Missões & Lojinha da Turma:** Conclusão interativa de missões e resgate de vantagens reais com Ouro.
  - **Espaço Híbrido:** Mesas de Estudo ao vivo, Categorias coloridas, Canais e Tópicos organizados sem poluição visual.
- **Visão do Coordenador (Governança & Inteligência Escolar):**
  - **Dashboard Executivo:** KPIs consolidados em tempo real.
  - **Radar de Cuidado:** Detecção automática de risco de evasão/queda de rendimento com registro de intervenção pedagógica (`+15 HP`).
  - **Auditoria & Economia:** Consolidação por turma, governança da Lojinha Escolar, trilha de auditoria e curadoria do Espaço Híbrido.

## Como rodar localmente

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

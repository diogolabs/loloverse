import {
  AvatarConfig,
  BnccAttributeKey,
  BnccAttributes,
  EngagementPillar,
  PathCycle,
  PathStepFormat,
  PathStepScope,
  PillarStats,
  RubricLevel,
} from "@/types";

export const BNCC_ATTRIBUTE_KEYS: BnccAttributeKey[] = [
  "con",
  "inv",
  "exp",
  "dig",
  "arg",
  "elo",
];

export const BNCC_GENERAL_COMPETENCIES: Record<number, string> = {
  1: "Conhecimento",
  2: "Pensamento Científico, Crítico e Criativo",
  3: "Repertório Cultural",
  4: "Comunicação",
  5: "Cultura Digital",
  6: "Trabalho e Projeto de Vida",
  7: "Argumentação",
  8: "Autoconhecimento e Autocuidado",
  9: "Empatia e Cooperação",
  10: "Responsabilidade e Cidadania",
};

export interface BnccAttributeMeta {
  key: BnccAttributeKey;
  code: string;
  label: string;
  shortLabel: string;
  tagline: string;
  color: string;
  bgClass: string;
  textClass: string;
  bnccCodes: number[];
  description: string;
}

export const BNCC_ATTRIBUTE_META: Record<BnccAttributeKey, BnccAttributeMeta> = {
  con: {
    key: "con",
    code: "CON",
    label: "Conhecimento & Base",
    shortLabel: "Conhecimento",
    tagline: "Domínio Conceitual",
    color: "#3B82F6",
    bgClass: "bg-blue-200",
    textClass: "text-blue-950",
    bnccCodes: [1],
    description:
      "Mobilizar saberes historicamente construídos para compreender e explicar a realidade.",
  },
  inv: {
    key: "inv",
    code: "INV",
    label: "Investigação & Criação",
    shortLabel: "Investigação",
    tagline: "Hipóteses & Soluções",
    color: "#FACC15",
    bgClass: "bg-yellow-200",
    textClass: "text-yellow-950",
    bnccCodes: [2],
    description:
      "Curiosidade intelectual, teste de hipóteses, análise de evidências e criação de soluções originais.",
  },
  exp: {
    key: "exp",
    code: "EXP",
    label: "Expressão & Cultura",
    shortLabel: "Expressão",
    tagline: "Linguagens & Repertório",
    color: "#EC4899",
    bgClass: "bg-pink-200",
    textClass: "text-pink-950",
    bnccCodes: [3, 4],
    description:
      "Comunicar ideias em múltiplas linguagens com intencionalidade e repertório cultural.",
  },
  dig: {
    key: "dig",
    code: "DIG",
    label: "Cultura Digital",
    shortLabel: "Digital",
    tagline: "Tecnologia Ética & Autoral",
    color: "#06B6D4",
    bgClass: "bg-cyan-200",
    textClass: "text-cyan-950",
    bnccCodes: [5],
    description:
      "Compreender, criar e utilizar ferramentas digitais de forma crítica, reflexiva e responsável.",
  },
  arg: {
    key: "arg",
    code: "ARG",
    label: "Argumento & Cidadania",
    shortLabel: "Argumentação",
    tagline: "Fatos, Ética & Impacto",
    color: "#8B5CF6",
    bgClass: "bg-violet-200",
    textClass: "text-violet-950",
    bnccCodes: [7, 10],
    description:
      "Defender ideias com base em fatos e agir com autonomia, ética e responsabilidade coletiva.",
  },
  elo: {
    key: "elo",
    code: "ELO",
    label: "Empatia, Foco & Projeto",
    shortLabel: "Empatia & Elo",
    tagline: "Cooperação & Projeto de Vida",
    color: "#10B981",
    bgClass: "bg-emerald-200",
    textClass: "text-emerald-950",
    bnccCodes: [6, 8, 9],
    description:
      "Diálogo, cooperação em equipe, autocuidado emocional e escolhas ligadas ao projeto de vida.",
  },
};

export interface BnccTierInfo {
  label: string;
  shortLabel: string;
  badgeClass: string;
  isUnexplored: boolean;
}

export function getBnccTier(value: number): BnccTierInfo {
  if (value <= 0) {
    return {
      label: "A explorar",
      shortLabel: "A explorar",
      badgeClass: "bg-zinc-100 text-zinc-500 border-dashed border-zinc-400",
      isUnexplored: true,
    };
  }
  if (value <= 5) {
    return {
      label: "Em Descoberta",
      shortLabel: "Descoberta",
      badgeClass: "bg-amber-100 text-amber-950 border-zinc-900",
      isUnexplored: false,
    };
  }
  if (value <= 10) {
    return {
      label: "Em Construção",
      shortLabel: "Construção",
      badgeClass: "bg-blue-100 text-blue-950 border-zinc-900",
      isUnexplored: false,
    };
  }
  if (value <= 15) {
    return {
      label: "Consolidado",
      shortLabel: "Consolidado",
      badgeClass: "bg-emerald-200 text-emerald-950 border-zinc-900",
      isUnexplored: false,
    };
  }
  return {
    label: "Referência",
    shortLabel: "Referência",
    badgeClass: "bg-violet-200 text-violet-950 border-zinc-900",
    isUnexplored: false,
  };
}

export function legacyPillarToBncc(
  pillar?: EngagementPillar | BnccAttributeKey | string
): BnccAttributeKey {
  if (!pillar) return "con";
  if (BNCC_ATTRIBUTE_KEYS.includes(pillar as BnccAttributeKey)) {
    return pillar as BnccAttributeKey;
  }
  switch (pillar) {
    case "proposito":
      return "arg";
    case "maestria":
      return "con";
    case "criatividade":
      return "inv";
    case "social":
      return "elo";
    default:
      return "con";
  }
}

export function bnccToLegacyPillar(attr: BnccAttributeKey): EngagementPillar {
  switch (attr) {
    case "con":
      return "maestria";
    case "inv":
    case "dig":
      return "criatividade";
    case "exp":
    case "elo":
      return "social";
    case "arg":
      return "proposito";
  }
}

export function createEmptyBnccAttributes(): BnccAttributes {
  return {
    con: { value: 0, evidenceCount: 0 },
    inv: { value: 0, evidenceCount: 0 },
    exp: { value: 0, evidenceCount: 0 },
    dig: { value: 0, evidenceCount: 0 },
    arg: { value: 0, evidenceCount: 0 },
    elo: { value: 0, evidenceCount: 0 },
  };
}

export function deriveBnccFromPillars(pillars?: PillarStats): BnccAttributes {
  if (!pillars) return createEmptyBnccAttributes();
  const toScale20 = (val: number) =>
    Math.max(1, Math.min(20, Math.round((val / 100) * 18)));
  return {
    con: { value: toScale20(pillars.maestria), evidenceCount: 3 },
    inv: { value: toScale20(pillars.criatividade), evidenceCount: 3 },
    exp: {
      value: toScale20(Math.round((pillars.criatividade + pillars.social) / 2)),
      evidenceCount: 2,
    },
    dig: { value: toScale20(Math.round(pillars.criatividade * 0.9)), evidenceCount: 2 },
    arg: { value: toScale20(pillars.proposito), evidenceCount: 2 },
    elo: { value: toScale20(pillars.social), evidenceCount: 3 },
  };
}

export function normalizeBnccAttributes(
  raw: unknown,
  fallbackPillars?: PillarStats
): BnccAttributes {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return deriveBnccFromPillars(fallbackPillars);
  }
  const obj = raw as Record<string, unknown>;
  const out = createEmptyBnccAttributes();
  let hasAny = false;
  for (const key of BNCC_ATTRIBUTE_KEYS) {
    const entry = obj[key];
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const e = entry as Record<string, unknown>;
      const val = Math.max(0, Math.min(20, Math.round(Number(e.value ?? 0))));
      const cnt = Math.max(0, Math.round(Number(e.evidenceCount ?? 0)));
      out[key] = { value: val, evidenceCount: cnt };
      if (val > 0 || cnt > 0) hasAny = true;
    } else if (typeof entry === "number") {
      const val = Math.max(0, Math.min(20, Math.round(entry)));
      out[key] = { value: val, evidenceCount: val > 0 ? 1 : 0 };
      if (val > 0) hasAny = true;
    }
  }
  return hasAny ? out : deriveBnccFromPillars(fallbackPillars);
}

export function getTopSpecialties(
  attrs: BnccAttributes,
  limit = 2
): BnccAttributeKey[] {
  return [...BNCC_ATTRIBUTE_KEYS]
    .filter((k) => attrs[k].value > 0)
    .sort((a, b) => attrs[b].value - attrs[a].value)
    .slice(0, limit);
}

export function computeAverageBnccIndex(attrs: BnccAttributes): number {
  const explored = BNCC_ATTRIBUTE_KEYS.map((k) => attrs[k].value).filter(
    (v) => v > 0
  );
  if (explored.length === 0) return 0;
  const avg = explored.reduce((acc, v) => acc + v, 0) / explored.length;
  return Number(avg.toFixed(1));
}

export function defaultAvatarConfig(seed: number, bgColor: string): AvatarConfig {
  return {
    skinIndex: seed % 5,
    hairColorIndex: (seed * 3) % 5,
    hairStyle: seed % 5,
    hasGlasses: seed % 3 === 0,
    hasHeadband: seed % 4 === 1,
    bigSmile: seed % 2 === 0,
    bgColor: bgColor || "#FACC15",
  };
}

// =============================================================================
// PERCURSO DINÂMICO — 12 FORMATOS AUTORAIS DO LOLOVERSE
// =============================================================================
export interface PathStepFormatMeta {
  format: PathStepFormat;
  label: string;
  shortLabel: string;
  defaultCycle: PathCycle;
  defaultScope: PathStepScope;
  defaultBnccAttr: BnccAttributeKey;
  requiresEvidenceDefault: boolean;
  nature: string;
  description: string;
  color: string;
  bgClass: string;
  textClass: string;
  promptPlaceholder: string;
  defaultQuestions: string[];
}

export const PATH_STEP_FORMAT_KEYS: PathStepFormat[] = [
  "ponto_partida",
  "roda_hipoteses",
  "mesa_ideias",
  "laboratorio_evidencias",
  "roda_conexoes",
  "registro_bordo",
  "saida_exploratoria",
  "encontro_convidado",
  "montagem_equipes",
  "estudio_equipe",
  "estudio_autoral",
  "mostra_publica",
];

export const PATH_STEP_FORMAT_META: Record<PathStepFormat, PathStepFormatMeta> = {
  ponto_partida: {
    format: "ponto_partida",
    label: "Ponto de Partida",
    shortLabel: "Partida",
    defaultCycle: "ciclo1",
    defaultScope: "turma",
    defaultBnccAttr: "con",
    requiresEvidenceDefault: false,
    nature: "Repertório conceitual inicial",
    description:
      "Introdução breve de conceitos essenciais, mapas, dados ou contexto mediada pelo docente.",
    color: "#F43F5E",
    bgClass: "bg-rose-100",
    textClass: "text-rose-950",
    promptPlaceholder: "Anote 1 conceito-chave que chamou sua atenção nesta abertura...",
    defaultQuestions: [
      "Qual conceito desta abertura mais se conecta com a pergunta norteadora?",
    ],
  },
  roda_hipoteses: {
    format: "roda_hipoteses",
    label: "Roda de Hipóteses",
    shortLabel: "Hipóteses",
    defaultCycle: "ciclo1",
    defaultScope: "turma",
    defaultBnccAttr: "inv",
    requiresEvidenceDefault: true,
    nature: "Conhecimento prévio & palpites",
    description:
      "Perguntas abertas à turma para levantar percepções, hipóteses iniciais e orientar a investigação.",
    color: "#EC4899",
    bgClass: "bg-pink-100",
    textClass: "text-pink-950",
    promptPlaceholder: "Qual é a sua hipótese inicial antes de começarmos a investigar?",
    defaultQuestions: [
      "O que você acredita que explica esse problema hoje?",
      "Que pista precisaremos verificar primeiro?",
    ],
  },
  mesa_ideias: {
    format: "mesa_ideias",
    label: "Mesa de Ideias",
    shortLabel: "Mesa Ideias",
    defaultCycle: "ciclo1",
    defaultScope: "equipe",
    defaultBnccAttr: "elo",
    requiresEvidenceDefault: true,
    nature: "Síntese e confronto de ideias",
    description:
      "Conversa estruturada em pequenos grupos para construir sentido, confrontar argumentos e alinhar entendimentos.",
    color: "#10B981",
    bgClass: "bg-emerald-100",
    textClass: "text-emerald-950",
    promptPlaceholder: "Registre a principal síntese ou ponto de divergência debatido na mesa...",
    defaultQuestions: [
      "Em que todos da equipe concordam e onde ainda há dúvida?",
    ],
  },
  laboratorio_evidencias: {
    format: "laboratorio_evidencias",
    label: "Laboratório de Evidências",
    shortLabel: "Evidências",
    defaultCycle: "ciclo1",
    defaultScope: "equipe",
    defaultBnccAttr: "inv",
    requiresEvidenceDefault: true,
    nature: "Análise prática de fontes e dados",
    description:
      "Grupos analisam fontes reais, documentos, dados, mapas, cálculos ou experimentos para interpretar evidências.",
    color: "#059669",
    bgClass: "bg-teal-100",
    textClass: "text-teal-950",
    promptPlaceholder: "Quais evidências concretas vocês encontraram nas fontes ou testes?",
    defaultQuestions: [
      "Que dado ou fonte sustenta a interpretação da equipe?",
      "Alguma hipótese inicial precisou ser revista após analisar os dados?",
    ],
  },
  roda_conexoes: {
    format: "roda_conexoes",
    label: "Roda de Conexões",
    shortLabel: "Conexões",
    defaultCycle: "ciclo1",
    defaultScope: "turma",
    defaultBnccAttr: "arg",
    requiresEvidenceDefault: true,
    nature: "Validação coletiva do pensamento",
    description:
      "Retorno coletivo após trabalho em equipes para comparar achados, argumentar e refinar explicações.",
    color: "#FACC15",
    bgClass: "bg-amber-100",
    textClass: "text-amber-950",
    promptPlaceholder: "Como a troca com as outras equipes aprimorou sua explicação?",
    defaultQuestions: [
      "Sua equipe concorda com a interpretação das outras equipes? Por quê?",
      "Alguém encontrou evidências diferentes?",
      "O que vocês fariam para melhorar a explicação apresentada?",
    ],
  },
  registro_bordo: {
    format: "registro_bordo",
    label: "Registro de Bordo",
    shortLabel: "Reg. Bordo",
    defaultCycle: "ciclo1",
    defaultScope: "individual",
    defaultBnccAttr: "con",
    requiresEvidenceDefault: true,
    nature: "Marco individual de avaliação justa",
    description:
      "Produção individual (justificativa, síntese, análise ou checagem de saída) garantindo pensamento visível não diluído no grupo.",
    color: "#8B5CF6",
    bgClass: "bg-violet-100",
    textClass: "text-violet-950",
    promptPlaceholder: "Escreva sua própria análise, justificativa ou síntese individual...",
    defaultQuestions: [
      "Qual foi a evidência mais forte que você analisou até aqui e por quê?",
    ],
  },
  saida_exploratoria: {
    format: "saida_exploratoria",
    label: "Saída Exploratória",
    shortLabel: "Exploração",
    defaultCycle: "ciclo1",
    defaultScope: "equipe",
    defaultBnccAttr: "inv",
    requiresEvidenceDefault: true,
    nature: "Observação direta no território",
    description:
      "Atividade fora da sala para observar o ambiente real, coletar dados e registrar evidências autênticas.",
    color: "#52525B",
    bgClass: "bg-zinc-200",
    textClass: "text-zinc-900",
    promptPlaceholder: "Descreva o que foi observado, medido ou coletado no território...",
    defaultQuestions: [
      "O que a observação real mostrou que não aparecia apenas na teoria?",
    ],
  },
  encontro_convidado: {
    format: "encontro_convidado",
    label: "Encontro com Convidado",
    shortLabel: "Convidado",
    defaultCycle: "ciclo1",
    defaultScope: "turma",
    defaultBnccAttr: "exp",
    requiresEvidenceDefault: true,
    nature: "Interlocução qualificada com a prática",
    description:
      "Conversa com profissional, pesquisador ou agente da comunidade para ampliar vocabulário e referência identitária.",
    color: "#06B6D4",
    bgClass: "bg-cyan-100",
    textClass: "text-cyan-950",
    promptPlaceholder: "Qual pergunta você fez ou qual aprendizado prático marcou este encontro?",
    defaultQuestions: [
      "Qual prática real do convidado vocês podem aplicar no projeto da turma?",
    ],
  },
  montagem_equipes: {
    format: "montagem_equipes",
    label: "Montagem de Equipes",
    shortLabel: "Equipes",
    defaultCycle: "ciclo2",
    defaultScope: "turma",
    defaultBnccAttr: "elo",
    requiresEvidenceDefault: false,
    nature: "Organização funcional e papéis",
    description:
      "Composição equilibrada das equipes, definição clara de papéis e abertura das Mesas de Estudo.",
    color: "#B45309",
    bgClass: "bg-orange-100",
    textClass: "text-orange-950",
    promptPlaceholder: "Confirme seu papel na equipe e o combinado inicial de trabalho...",
    defaultQuestions: ["Qual é o seu papel e sua primeira entrega dentro da equipe?"],
  },
  estudio_equipe: {
    format: "estudio_equipe",
    label: "Estúdio em Equipe",
    shortLabel: "Est. Equipe",
    defaultCycle: "ciclo2",
    defaultScope: "equipe",
    defaultBnccAttr: "dig",
    requiresEvidenceDefault: true,
    nature: "Construção colaborativa do produto",
    description:
      "Criação do artefato coletivo (protótipo, mapa, modelo, vídeo, relatório ou performance) integrando as evidências do Ciclo 1.",
    color: "#3B82F6",
    bgClass: "bg-blue-100",
    textClass: "text-blue-950",
    promptPlaceholder: "Descreva o artefato criado pela equipe, decisões tomadas e cole o link se houver...",
    defaultQuestions: [
      "Como o produto final integra as evidências coletadas no Ciclo 1?",
    ],
  },
  estudio_autoral: {
    format: "estudio_autoral",
    label: "Estúdio Autoral",
    shortLabel: "Autoral",
    defaultCycle: "ciclo2",
    defaultScope: "individual",
    defaultBnccAttr: "exp",
    requiresEvidenceDefault: true,
    nature: "Criação individual de artefato finalizado",
    description:
      "Materialização autoral individual envolvendo decisões próprias de forma, linguagem e estrutura para comunicar conclusões.",
    color: "#2563EB",
    bgClass: "bg-indigo-100",
    textClass: "text-indigo-950",
    promptPlaceholder: "Apresente seu artefato autoral, escolhas de formato/linguagem e conclusão...",
    defaultQuestions: [
      "Por que você escolheu este formato e esta estrutura para comunicar suas conclusões?",
    ],
  },
  mostra_publica: {
    format: "mostra_publica",
    label: "Mostra Pública",
    shortLabel: "Mostra",
    defaultCycle: "ciclo2",
    defaultScope: "turma",
    defaultBnccAttr: "arg",
    requiresEvidenceDefault: true,
    nature: "Culminância e sentido social",
    description:
      "Apresentação aberta explicitando raciocínio disciplinar, evidências analisadas e escolhas realizadas.",
    color: "#18181B",
    bgClass: "bg-zinc-900",
    textClass: "text-white",
    promptPlaceholder: "Registre seu roteiro de defesa: raciocínio principal, evidência-chave e impacto...",
    defaultQuestions: [
      "Qual evidência torna a conclusão da equipe/autor mais convincente para o público?",
    ],
  },
};

// =============================================================================
// RUBRICA 4D (4 NÍVEIS) — CÁLCULO TRANSPARENTE DE NOTA SUGERIDA (0..10)
// =============================================================================
export const RUBRIC_LEVELS: Record<
  RubricLevel,
  { label: string; short: string; percent: number; bgClass: string }
> = {
  1: {
    label: "Inicial",
    short: "Inicial",
    percent: 25,
    bgClass: "bg-rose-100 text-rose-950",
  },
  2: {
    label: "Em Construção",
    short: "Construção",
    percent: 55,
    bgClass: "bg-amber-100 text-amber-950",
  },
  3: {
    label: "Consolidado",
    short: "Consolidado",
    percent: 85,
    bgClass: "bg-emerald-100 text-emerald-950",
  },
  4: {
    label: "Destaque Autoral",
    short: "Destaque",
    percent: 100,
    bgClass: "bg-violet-200 text-violet-950",
  },
};

export interface RubricCriterionMeta {
  field: "rigorLevel" | "evidenceLevel" | "authorshipLevel" | "collaborationLevel";
  label: string;
  weight: number;
  linkedBncc: BnccAttributeKey[];
  hint: string;
}

export const RUBRIC_CRITERIA: RubricCriterionMeta[] = [
  {
    field: "rigorLevel",
    label: "Rigor Conceitual & BNCC",
    weight: 0.3,
    linkedBncc: ["con"],
    hint: "Precisão conceitual e mobilização dos saberes essenciais do recorte.",
  },
  {
    field: "evidenceLevel",
    label: "Investigação & Evidências",
    weight: 0.3,
    linkedBncc: ["inv", "dig"],
    hint: "Uso crítico de fontes, dados, Registros de Bordo e observações do Ciclo 1.",
  },
  {
    field: "authorshipLevel",
    label: "Autoria, Forma & Revisão",
    weight: 0.2,
    linkedBncc: ["exp", "inv"],
    hint: "Escolhas próprias de linguagem/estrutura e refinamento após feedbacks.",
  },
  {
    field: "collaborationLevel",
    label: "Papel na Equipe & Mostra Pública",
    weight: 0.2,
    linkedBncc: ["elo", "arg"],
    hint: "Cumprimento do papel, cooperação e defesa clara do raciocínio na Mostra.",
  },
];

export function computeSuggestedRubricScore(levels: {
  rigorLevel: RubricLevel;
  evidenceLevel: RubricLevel;
  authorshipLevel: RubricLevel;
  collaborationLevel: RubricLevel;
}): number {
  const weightedPct =
    RUBRIC_LEVELS[levels.rigorLevel].percent * 0.3 +
    RUBRIC_LEVELS[levels.evidenceLevel].percent * 0.3 +
    RUBRIC_LEVELS[levels.authorshipLevel].percent * 0.2 +
    RUBRIC_LEVELS[levels.collaborationLevel].percent * 0.2;
  return Number((weightedPct / 10).toFixed(1));
}

// =============================================================================
// CATÁLOGO DE SELOS AUTOMÁTICOS & TÍTULOS DISCIPLINARES
// =============================================================================
export interface BadgeDef {
  id: string;
  label: string;
  hint: string;
}

export const BADGE_CATALOG: BadgeDef[] = [
  {
    id: "badge-novo",
    label: "Novo no Loloverse",
    hint: "Iniciou sua jornada no Caderno Vivo.",
  },
  {
    id: "badge-bordo",
    label: "Autor de Bordo",
    hint: "Enviou seu primeiro Registro de Bordo ou evidência de Percurso.",
  },
  {
    id: "badge-voz",
    label: "Voz do Espaço Híbrido",
    hint: "Participou ativamente de tópicos e trocas no Espaço Híbrido.",
  },
  {
    id: "badge-chama",
    label: "Chama 5 Dias",
    hint: "Manteve constância em 5 dias letivos.",
  },
  {
    id: "badge-consolidado",
    label: "Mente Consolidada",
    hint: "Atingiu a faixa Consolidado (11+) em um atributo BNCC.",
  },
  {
    id: "badge-mostra",
    label: "Protagonista da Mostra",
    hint: "Concluiu um Percurso Dinâmico com avaliação validada.",
  },
];

export const DISCIPLINARY_TITLES: string[] = [
  "Aventureiro(a) Maker",
  "Jovem Cientista",
  "Investigador(a) de Campo",
  "Engenheiro(a) Maker",
  "Cronista Visual",
  "Matemático(a) Aplicado(a)",
  "Guardião(ã) da Lógica",
  "Estrategista de Percurso",
  "Arquiteto(a) de Ideias",
  "Autor(a) Digital",
];

export const TEAM_ROLE_PRESETS: string[] = [
  "Investigador(a) de Fontes",
  "Relator(a) de Síntese",
  "Designer do Artefato",
  "Mediador(a) & Prazos",
  "Apresentador(a) de Defesa",
];

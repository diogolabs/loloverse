/**
 * Biblioteca compartilhada do backend Loloverse para PocketBase JSVM.
 * IMPORTANTE: No PocketBase JSVM, carregue este módulo DENTRO de cada handler:
 *   const L = require(`${__hooks}/lib/loloverse.js`);
 */

const AVATAR_PALETTE = [
  "#FACC15",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#FB923C",
  "#EC4899",
  "#06B6D4",
];

// Catálogo oficial server-side de presets do Pulso da Turma (evita manipulação de deltas no cliente)
const BEHAVIOR_PRESETS = {
  "bp-colab": {
    id: "bp-colab",
    label: "Colaboração",
    type: "positive",
    xpDelta: 15,
    goldDelta: 5,
    hpDelta: 0,
    pillar: "social",
  },
  "bp-critico": {
    id: "bp-critico",
    label: "Pensamento Crítico",
    type: "positive",
    xpDelta: 20,
    goldDelta: 8,
    hpDelta: 0,
    pillar: "criatividade",
  },
  "bp-ajudou": {
    id: "bp-ajudou",
    label: "Ajudou Colega",
    type: "positive",
    xpDelta: 10,
    goldDelta: 10,
    hpDelta: 5,
    pillar: "social",
  },
  "bp-entrega": {
    id: "bp-entrega",
    label: "Entrega Caprichada",
    type: "positive",
    xpDelta: 25,
    goldDelta: 12,
    hpDelta: 5,
    pillar: "maestria",
  },
  "bp-proposito": {
    id: "bp-proposito",
    label: "Liderança Maker",
    type: "positive",
    xpDelta: 20,
    goldDelta: 10,
    hpDelta: 0,
    pillar: "proposito",
  },
  "bp-pendente": {
    id: "bp-pendente",
    label: "Atividade Pendente",
    type: "alert",
    xpDelta: 0,
    goldDelta: 0,
    hpDelta: -10,
    pillar: "maestria",
  },
  "bp-foco": {
    id: "bp-foco",
    label: "Falta de Foco",
    type: "alert",
    xpDelta: 0,
    goldDelta: 0,
    hpDelta: -5,
    pillar: "maestria",
  },
  "bp-convivencia": {
    id: "bp-convivencia",
    label: "Desrespeito ao Combinado",
    type: "alert",
    xpDelta: 0,
    goldDelta: 0,
    hpDelta: -12,
    pillar: "social",
  },
};

const PILLAR_FIELD_MAP = {
  proposito: "pillarProposito",
  maestria: "pillarMaestria",
  criatividade: "pillarCriatividade",
  social: "pillarSocial",
};

const BNCC_KEYS = ["con", "inv", "exp", "dig", "arg", "elo"];

const PILLAR_TO_BNCC = {
  proposito: "arg",
  maestria: "con",
  criatividade: "inv",
  social: "elo",
};

const BEHAVIOR_BNCC_MAP = {
  "bp-colab": "elo",
  "bp-critico": "inv",
  "bp-ajudou": "elo",
  "bp-entrega": "con",
  "bp-proposito": "arg",
  "bp-pendente": "con",
  "bp-foco": "con",
  "bp-convivencia": "elo",
};

function todayIsoDate() {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function readBnccAttributes(student) {
  const raw = student.get("bnccAttributes");
  const out = {};
  for (const k of BNCC_KEYS) {
    const entry = raw && typeof raw === "object" && !Array.isArray(raw) ? raw[k] : null;
    if (entry && typeof entry === "object") {
      out[k] = {
        value: clamp(Number(entry.value || 0), 0, 20),
        evidenceCount: Math.max(0, Number(entry.evidenceCount || 0)),
      };
    } else {
      out[k] = { value: 0, evidenceCount: 0 };
    }
  }
  return out;
}

/** Regra inviolável: atributos BNCC só crescem (0..20), nunca caem por punição. */
function boostBnccAttribute(student, key, delta, addEvidence) {
  const k = BNCC_KEYS.indexOf(key) >= 0 ? key : "con";
  const attrs = readBnccAttributes(student);
  const prev = attrs[k];
  const nextVal = Math.max(prev.value, clamp(prev.value + Math.max(0, Number(delta || 0)), 0, 20));
  attrs[k] = {
    value: nextVal,
    evidenceCount: prev.evidenceCount + Math.max(0, Number(addEvidence || 0)),
  };
  student.set("bnccAttributes", attrs);
  student.set("topSpecialties", computeTopSpecialties(attrs, 2));
  return attrs;
}

function raiseBnccToFloor(student, key, floorValue) {
  const k = BNCC_KEYS.indexOf(key) >= 0 ? key : "con";
  const attrs = readBnccAttributes(student);
  const prev = attrs[k];
  const target = clamp(Number(floorValue || 0), 0, 20);
  const nextVal = Math.max(prev.value, target);
  attrs[k] = {
    value: nextVal,
    evidenceCount: prev.evidenceCount + 1,
  };
  student.set("bnccAttributes", attrs);
  student.set("topSpecialties", computeTopSpecialties(attrs, 2));
  return attrs;
}

function computeTopSpecialties(attrs, limit) {
  return BNCC_KEYS.filter((k) => attrs[k] && attrs[k].value > 0)
    .sort((a, b) => (attrs[b]?.value || 0) - (attrs[a]?.value || 0))
    .slice(0, limit || 2);
}

function syncAutoBadges(student, triggers) {
  const raw = student.get("badges");
  const list = Array.isArray(raw) ? raw.filter((x) => typeof x === "string") : [];
  const add = (label) => {
    if (list.indexOf(label) === -1) list.push(label);
  };
  if (triggers && triggers.submittedPath) add("Autor de Bordo");
  if (triggers && triggers.hybridActive) add("Voz do Espaço Híbrido");
  if (triggers && triggers.pathCompleted) add("Protagonista da Mostra");
  if (student.getInt("streakDays") >= 5) add("Chama 5 Dias");
  const attrs = readBnccAttributes(student);
  for (const k of BNCC_KEYS) {
    if ((attrs[k]?.value || 0) >= 11) {
      add("Mente Consolidada");
      break;
    }
  }
  student.set("badges", list);
  return list;
}

function computeRubricScore(rigor, evidence, authorship, collab) {
  const pct = { 1: 25, 2: 55, 3: 85, 4: 100 };
  const total =
    (pct[rigor] || 55) * 0.3 +
    (pct[evidence] || 55) * 0.3 +
    (pct[authorship] || 55) * 0.2 +
    (pct[collab] || 55) * 0.2;
  return Number((total / 10).toFixed(1));
}

function isSuperuser(auth) {
  return Boolean(auth && typeof auth.isSuperuser === "function" && auth.isSuperuser());
}

function getRole(auth) {
  if (!auth) return "";
  if (isSuperuser(auth)) return "admin";
  return auth.getString("role") || "";
}

function requireActiveUser(e) {
  const auth = e.auth;
  if (!auth) {
    throw new UnauthorizedError("Autenticação obrigatória.");
  }
  if (!isSuperuser(auth) && !auth.getBool("active")) {
    throw new ForbiddenError("Conta desativada pela coordenação.");
  }
  return auth;
}

function requireRoles(e, allowedRoles) {
  const auth = requireActiveUser(e);
  if (isSuperuser(auth)) return auth;
  const role = getRole(auth);
  if (allowedRoles.indexOf(role) === -1) {
    throw new ForbiddenError("Permissão insuficiente para esta operação.");
  }
  return auth;
}

function sanitizeUsername(raw) {
  const base = String(raw || "usuario")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 28);
  return base.length >= 3 ? base : "lolo." + $security.randomStringWithAlphabet(6, "abcdefghijklmnopqrstuvwxyz0123456789");
}

function generateInviteCode(prefix) {
  const cleanPrefix = String(prefix || "LOLO")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6) || "LOLO";
  // Alfabeto sem caracteres ambíguos (0/O, 1/I/L)
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const part1 = $security.randomStringWithAlphabet(4, alphabet);
  const part2 = $security.randomStringWithAlphabet(4, alphabet);
  return `${cleanPrefix}-${part1}-${part2}`;
}

function computeLevelProgress(currentXp, currentLevel, currentXpToNext, deltaXp) {
  let xp = Math.max(0, Number(currentXp || 0) + Number(deltaXp || 0));
  let level = Math.max(1, Number(currentLevel || 1));
  let xpToNext = Math.max(50, Number(currentXpToNext || 200));
  let leveledUp = false;

  while (xp >= xpToNext) {
    xp -= xpToNext;
    level += 1;
    xpToNext += 50;
    leveledUp = true;
  }

  return { xp, level, xpToNext, leveledUp };
}

function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

function writeAuditLog(txApp, entry) {
  const logsCol = txApp.findCollectionByNameOrId("activity_logs");
  const rec = new Record(logsCol);
  if (entry.actorId) {
    rec.set("actor", entry.actorId);
  }
  rec.set("actorName", String(entry.actorName || "Sistema").slice(0, 120));
  rec.set("target", String(entry.target || "-").slice(0, 160));
  rec.set("action", String(entry.action || "").slice(0, 300));
  rec.set("category", entry.category || "seguranca");
  if (entry.deltaSummary) {
    rec.set("deltaSummary", String(entry.deltaSummary).slice(0, 160));
  }
  if (entry.metadata) {
    rec.set("metadata", entry.metadata);
  }
  txApp.save(rec);
}

function mapRoleToAuthorRole(role) {
  if (role === "teacher") return "professor";
  if (role === "coordinator") return "coordenador";
  if (role === "admin") return "admin";
  return "aluno";
}

module.exports = {
  AVATAR_PALETTE,
  BEHAVIOR_PRESETS,
  PILLAR_FIELD_MAP,
  BNCC_KEYS,
  PILLAR_TO_BNCC,
  BEHAVIOR_BNCC_MAP,
  todayIsoDate,
  readBnccAttributes,
  boostBnccAttribute,
  raiseBnccToFloor,
  computeTopSpecialties,
  syncAutoBadges,
  computeRubricScore,
  isSuperuser,
  getRole,
  requireActiveUser,
  requireRoles,
  sanitizeUsername,
  generateInviteCode,
  computeLevelProgress,
  clamp,
  writeAuditLog,
  mapRoleToAuthorRole,
};

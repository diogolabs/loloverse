import PocketBase, { RecordModel } from "pocketbase";
import {
  Account,
  ActivityLog,
  ChannelCategory,
  ChannelTopic,
  ChatChannel,
  ChatMessage,
  ChatReaction,
  ClassRoom,
  EngagementPillar,
  InviteRecord,
  Persona,
  Quest,
  QuestType,
  RedemptionRecord,
  ShopReward,
  Student,
  StudyRoom,
} from "@/types";

const RAW_URL = (process.env.NEXT_PUBLIC_POCKETBASE_URL || "").trim().replace(/\/+$/, "");

export const POCKETBASE_URL = RAW_URL;
export const isPocketBaseEnabled = Boolean(RAW_URL);

let pbSingleton: PocketBase | null = null;

export function getPocketBase(): PocketBase | null {
  if (!isPocketBaseEnabled) return null;
  if (typeof window === "undefined") {
    const serverClient = new PocketBase(POCKETBASE_URL);
    serverClient.autoCancellation(false);
    return serverClient;
  }
  if (!pbSingleton) {
    pbSingleton = new PocketBase(POCKETBASE_URL);
    pbSingleton.autoCancellation(false);
  }
  return pbSingleton;
}

export function formatPbTime(iso?: string): string {
  if (!iso) return "Agora";
  const dt = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(dt.getTime())) return iso;
  const now = new Date();
  const sameDay =
    dt.getFullYear() === now.getFullYear() &&
    dt.getMonth() === now.getMonth() &&
    dt.getDate() === now.getDate();
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  if (sameDay) return `Hoje, ${hh}:${mm}`;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mo = String(dt.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mo}, ${hh}:${mm}`;
}

export function mapUserToAccount(
  rec: RecordModel,
  studentByUserId: Map<string, string>
): Account {
  const role = (rec.role || "student") as Persona;
  return {
    id: rec.id,
    username: rec.username || (rec.email ? String(rec.email).split("@")[0] : rec.id.slice(0, 8)),
    email: rec.email || "",
    password: "",
    displayName: rec.displayName || rec.username || "Usuário Loloverse",
    role,
    avatarSeed: Number(rec.avatarSeed || 1),
    avatarColor: rec.avatarColor || "#3B82F6",
    studentId: studentByUserId.get(rec.id),
    classId: rec.class || undefined,
    bio: rec.bio || undefined,
  };
}

export function mapClass(rec: RecordModel): ClassRoom {
  return {
    id: rec.id,
    name: rec.name || "Turma",
    grade: rec.grade || "",
    teacherName: rec.teacherName || "Docente",
    period: rec.period || "Manhã",
    room: rec.room || "",
  };
}

export function mapStudent(rec: RecordModel): Student {
  const badges = Array.isArray(rec.badges)
    ? rec.badges.filter((b): b is string => typeof b === "string")
    : [];
  return {
    id: rec.id,
    name: rec.name || "Estudante",
    classId: rec.class || "",
    avatarSeed: Number(rec.avatarSeed || 1),
    avatarColor: rec.avatarColor || "#10B981",
    roleTitle: rec.roleTitle || "Aventureiro(a) Maker",
    level: Number(rec.level || 1),
    xp: Number(rec.xp || 0),
    xpToNext: Number(rec.xpToNext || 200),
    hp: Number(rec.hp ?? 100),
    maxHp: Number(rec.maxHp || 100),
    gold: Number(rec.gold || 0),
    attendanceToday: (rec.attendanceToday || "presente") as Student["attendanceToday"],
    attendanceRate: Number(rec.attendanceRate ?? 100),
    bimesterAverage: Number(rec.bimesterAverage ?? 8.0),
    previousAverage: Number(rec.previousAverage ?? 8.0),
    deliveryRate: Number(rec.deliveryRate ?? 100),
    streakDays: Number(rec.streakDays || 0),
    onlineStatus: (rec.onlineStatus || "offline") as Student["onlineStatus"],
    studyActivity: rec.studyActivity || undefined,
    pillars: {
      proposito: Number(rec.pillarProposito ?? 60),
      maestria: Number(rec.pillarMaestria ?? 60),
      criatividade: Number(rec.pillarCriatividade ?? 60),
      social: Number(rec.pillarSocial ?? 60),
    },
    badges,
    interventionsCount: Number(rec.interventionsCount || 0),
    lastInterventionNote: rec.lastInterventionNote || undefined,
  };
}

export function mapQuest(rec: RecordModel, completedBy: string[]): Quest {
  return {
    id: rec.id,
    classId: rec.class || "",
    title: rec.title || "",
    description: rec.description || "",
    type: (rec.type || "diaria") as QuestType,
    xpReward: Number(rec.xpReward || 0),
    goldReward: Number(rec.goldReward || 0),
    pillar: (rec.pillar || "maestria") as EngagementPillar,
    dueDate: rec.dueDate || "Esta semana",
    active: Boolean(rec.active),
    completedBy,
    bossTargetPercent: rec.bossTargetPercent ? Number(rec.bossTargetPercent) : undefined,
  };
}

export function mapReward(rec: RecordModel): ShopReward {
  return {
    id: rec.id,
    title: rec.title || "",
    description: rec.description || "",
    cost: Number(rec.cost || 10),
    category: (rec.category || "academico") as ShopReward["category"],
    iconName: rec.iconName || "Gift",
    approved: Boolean(rec.approved),
    stockLimit: Number(rec.stockLimit || 1),
    redeemedCount: Number(rec.redeemedCount || 0),
  };
}

export function mapRedemption(rec: RecordModel): RedemptionRecord {
  return {
    id: rec.id,
    studentId: rec.student || "",
    studentName: rec.studentName || "",
    classId: rec.class || "",
    rewardId: rec.reward || "",
    rewardTitle: rec.rewardTitle || "",
    cost: Number(rec.cost || 0),
    timestamp: formatPbTime(rec.created),
    status: (rec.status || "pendente") as RedemptionRecord["status"],
  };
}

export function mapStudyRoom(rec: RecordModel): StudyRoom {
  return {
    id: rec.id,
    name: rec.name || "",
    topic: rec.topic || "",
    maxSeats: Number(rec.maxSeats || 6),
    accentColor: rec.accentColor || "#FACC15",
    participantIds: Array.isArray(rec.participants) ? rec.participants : [],
  };
}

export function mapCategory(rec: RecordModel): ChannelCategory {
  return {
    id: rec.id,
    name: rec.name || "",
    color: rec.color || "#3B82F6",
  };
}

export function mapChannel(rec: RecordModel): ChatChannel {
  return {
    id: rec.id,
    categoryId: rec.category || "",
    slug: rec.slug || "#canal",
    label: rec.label || "canal",
    title: rec.title || "Canal",
    description: rec.description || "",
    staffOnlyTopics: Boolean(rec.staffOnlyTopics),
  };
}

export function mapTopic(rec: RecordModel): ChannelTopic {
  return {
    id: rec.id,
    channelId: rec.channel || "",
    title: rec.title || "",
    summary: rec.summary || "",
    createdBy: rec.createdByName || "Equipe",
    createdAt: formatPbTime(rec.created),
    pinned: Boolean(rec.pinned),
    resolved: Boolean(rec.resolved),
    pillar: (rec.pillar || undefined) as EngagementPillar | undefined,
  };
}

export function mapMessage(rec: RecordModel, currentUserId?: string): ChatMessage {
  const rawReactions = rec.reactions;
  const reactions: ChatReaction[] = [];

  if (rawReactions && typeof rawReactions === "object" && !Array.isArray(rawReactions)) {
    for (const [emoji, users] of Object.entries(rawReactions as Record<string, unknown>)) {
      if (Array.isArray(users) && users.length > 0) {
        reactions.push({
          emoji,
          count: users.length,
          userReacted: currentUserId ? users.includes(currentUserId) : false,
        });
      }
    }
  }

  return {
    id: rec.id,
    channelId: rec.channel || "",
    topicId: rec.topic || "",
    authorId: rec.author || "",
    authorName: rec.authorName || "Usuário",
    authorRole: (rec.authorRole || "aluno") as ChatMessage["authorRole"],
    avatarSeed: Number(rec.avatarSeed || 1),
    avatarColor: rec.avatarColor || "#3B82F6",
    content: rec.content || "",
    timestamp: formatPbTime(rec.created),
    reactions,
    pinned: Boolean(rec.pinned),
  };
}

export function mapLog(rec: RecordModel): ActivityLog {
  return {
    id: rec.id,
    timestamp: formatPbTime(rec.created),
    actor: rec.actorName || "Sistema",
    target: rec.target || "-",
    action: rec.action || "",
    category: (rec.category || "seguranca") as ActivityLog["category"],
    deltaSummary: rec.deltaSummary || undefined,
  };
}

export function mapInvite(rec: RecordModel): InviteRecord {
  return {
    id: rec.id,
    code: rec.code || "",
    email: rec.email || "",
    role: (rec.role || "student") as InviteRecord["role"],
    classId: rec.class || undefined,
    expiresAt: rec.expiresAt || undefined,
    maxUses: Number(rec.maxUses || 1),
    usedCount: Number(rec.usedCount || 0),
    active: Boolean(rec.active),
    usedBy: rec.usedBy || undefined,
    usedAt: rec.usedAt || undefined,
    note: rec.note || undefined,
    created: rec.created || undefined,
  };
}

export function extractPbError(err: unknown, fallback: string): string {
  if (err && typeof err === "object") {
    const e = err as { response?: { message?: string; error?: string }; message?: string };
    if (e.response?.error) return e.response.error;
    if (e.response?.message) return e.response.message;
    if (e.message) return e.message;
  }
  return fallback;
}

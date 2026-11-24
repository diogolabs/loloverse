export type Persona = "teacher" | "student" | "coordinator" | "admin";

export type AttendanceStatus = "presente" | "falta" | "atraso";

export type EngagementPillar = "proposito" | "maestria" | "criatividade" | "social";

export type QuestType = "diaria" | "tarefa" | "boss";

export interface InviteRecord {
  id: string;
  code: string;
  email: string;
  role: "student" | "teacher" | "coordinator";
  classId?: string;
  expiresAt?: string;
  maxUses: number;
  usedCount: number;
  active: boolean;
  usedBy?: string;
  usedAt?: string;
  note?: string;
  created?: string;
}

export interface Account {
  id: string;
  username: string;
  email: string;
  password: string;
  displayName: string;
  role: Persona;
  avatarSeed: number;
  avatarColor: string;
  studentId?: string;
  classId?: string;
  bio?: string;
}

export interface StudyRoom {
  id: string;
  name: string;
  topic: string;
  maxSeats: number;
  accentColor: string;
  participantIds: string[];
}

export interface ChannelCategory {
  id: string;
  name: string;
  color: string;
}

export interface ChatChannel {
  id: string;
  categoryId: string;
  slug: string;
  label: string;
  title: string;
  description: string;
  staffOnlyTopics?: boolean;
}

export interface ChannelTopic {
  id: string;
  channelId: string;
  title: string;
  summary: string;
  createdBy: string;
  createdAt: string;
  pinned?: boolean;
  resolved?: boolean;
  pillar?: EngagementPillar;
}

export interface PillarStats {
  proposito: number;
  maestria: number;
  criatividade: number;
  social: number;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  avatarSeed: number;
  avatarColor: string;
  roleTitle: string;
  level: number;
  xp: number;
  xpToNext: number;
  hp: number;
  maxHp: number;
  gold: number;
  attendanceToday: AttendanceStatus;
  attendanceRate: number;
  bimesterAverage: number;
  previousAverage: number;
  deliveryRate: number;
  streakDays: number;
  onlineStatus: "online" | "estudando" | "em-grupo" | "offline";
  studyActivity?: string;
  pillars: PillarStats;
  badges: string[];
  interventionsCount: number;
  lastInterventionNote?: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  grade: string;
  teacherName: string;
  period: string;
  room: string;
}

export interface BehaviorPreset {
  id: string;
  label: string;
  description: string;
  type: "positive" | "alert";
  xpDelta: number;
  goldDelta: number;
  hpDelta: number;
  pillar: EngagementPillar;
  iconName: string;
}

export interface Quest {
  id: string;
  classId: string;
  title: string;
  description: string;
  type: QuestType;
  xpReward: number;
  goldReward: number;
  pillar: EngagementPillar;
  dueDate: string;
  active: boolean;
  completedBy: string[];
  bossTargetPercent?: number;
}

export interface ShopReward {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: "academico" | "turma" | "privilegio" | "avatar";
  iconName: string;
  approved: boolean;
  stockLimit: number;
  redeemedCount: number;
}

export interface RedemptionRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  rewardId: string;
  rewardTitle: string;
  cost: number;
  timestamp: string;
  status: "entregue" | "pendente";
}

export interface ChatReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
}

export interface ChatMessage {
  id: string;
  channelId: string;
  topicId: string;
  authorId: string;
  authorName: string;
  authorRole: "professor" | "aluno" | "coordenador" | "admin";
  avatarSeed: number;
  avatarColor: string;
  content: string;
  timestamp: string;
  reactions: ChatReaction[];
  pinned?: boolean;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  actor: string;
  target: string;
  action: string;
  category:
    | "comportamento"
    | "frequencia"
    | "quest"
    | "loja"
    | "intervencao"
    | "governanca"
    | "conta"
    | "espaco"
    | "seguranca";
  deltaSummary?: string;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: "success" | "warning" | "info" | "danger";
}

export interface LoloverseState {
  accounts: Account[];
  studyRooms: StudyRoom[];
  categories: ChannelCategory[];
  channels: ChatChannel[];
  topics: ChannelTopic[];
  classes: ClassRoom[];
  students: Student[];
  quests: Quest[];
  rewards: ShopReward[];
  redemptions: RedemptionRecord[];
  messages: ChatMessage[];
  logs: ActivityLog[];
  selectedClassId: string;
  activeStudentId: string;
}

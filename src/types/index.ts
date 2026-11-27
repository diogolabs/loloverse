export type Persona = "teacher" | "student" | "coordinator" | "admin";

export type AttendanceStatus = "presente" | "falta" | "atraso";

export type EngagementPillar = "proposito" | "maestria" | "criatividade" | "social";

export type BnccAttributeKey = "con" | "inv" | "exp" | "dig" | "arg" | "elo";

export interface BnccAttributeEntry {
  /** Escala RPG de crescimento: 0 = A explorar; 1..20 = Em Descoberta -> Referência */
  value: number;
  evidenceCount: number;
}

export type BnccAttributes = Record<BnccAttributeKey, BnccAttributeEntry>;

export interface AvatarConfig {
  skinIndex: number;
  hairColorIndex: number;
  hairStyle: number;
  hasGlasses: boolean;
  hasHeadband: boolean;
  bigSmile: boolean;
  bgColor: string;
}

export type QuestType = "diaria" | "tarefa" | "boss";

export type PathCycle = "ciclo1" | "ciclo2";

export type PathStatus = "ciclo1" | "ciclo2" | "concluido";

export type PathGradingMode = "formativo" | "ponderado" | "bonus";

export type PathStepScope = "turma" | "equipe" | "individual";

export type PathStepFormat =
  | "ponto_partida"
  | "roda_hipoteses"
  | "mesa_ideias"
  | "laboratorio_evidencias"
  | "roda_conexoes"
  | "registro_bordo"
  | "saida_exploratoria"
  | "encontro_convidado"
  | "montagem_equipes"
  | "estudio_equipe"
  | "estudio_autoral"
  | "mostra_publica";

export interface DynamicPath {
  id: string;
  classId: string;
  title: string;
  drivingQuestion: string;
  bnccSummary: string;
  currentCycle: PathStatus;
  gradingMode: PathGradingMode;
  /** Peso percentual (0..100) quando ponderado, ou teto em décimos (ex: 10 = +1.0) quando bonus */
  gradeWeight: number;
  culminationDate: string;
  disciplinaryTitle: string;
  active: boolean;
}

export interface PathStep {
  id: string;
  pathId: string;
  cycle: PathCycle;
  stepFormat: PathStepFormat;
  scope: PathStepScope;
  title: string;
  description: string;
  guidingQuestions?: string[];
  bnccAttr: BnccAttributeKey;
  requiresEvidence: boolean;
  dueDate: string;
  sortOrder: number;
  status: "aberta" | "concluida";
}

export interface PathTeam {
  id: string;
  pathId: string;
  name: string;
  memberIds: string[];
  roles: Record<string, string>;
  studyRoomId?: string;
}

export interface PathSubmission {
  id: string;
  pathId: string;
  stepId: string;
  studentId: string;
  teamId?: string;
  artifactFormat?: string;
  content: string;
  attachmentUrl?: string;
  status: "enviado" | "revisao" | "validado";
  teacherFeedback?: string;
  timestamp: string;
}

export type RubricLevel = 1 | 2 | 3 | 4;

export interface PathEvaluation {
  id: string;
  pathId: string;
  studentId: string;
  rigorLevel: RubricLevel;
  evidenceLevel: RubricLevel;
  authorshipLevel: RubricLevel;
  collaborationLevel: RubricLevel;
  suggestedScore: number;
  qualitativeNote?: string;
  publishedToGradebook: boolean;
  publishedAt?: string;
  updatedAt: string;
}

export interface GradeComponent {
  id: string;
  studentId: string;
  bimester: string;
  sourceType: "prova" | "atividade" | "percurso" | "bonus";
  sourceId?: string;
  label: string;
  score: number;
  weight: number;
  timestamp: string;
}

export interface StudentFeedEntry {
  id: string;
  studentId: string;
  timestamp: string;
  title: string;
  detail: string;
  deltaSummary?: string;
  variant: "xp" | "bncc" | "hp" | "badge" | "path";
}

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
  avatarConfig?: AvatarConfig;
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
  bnccAttr?: BnccAttributeKey;
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
  avatarConfig?: AvatarConfig;
  roleTitle: string;
  unlockedTitles?: string[];
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
  lastStreakDate?: string;
  hybridHpDate?: string;
  hybridHpToday?: number;
  onlineStatus: "online" | "estudando" | "em-grupo" | "offline";
  studyActivity?: string;
  /** Mantido para retrocompatibilidade com registros antigos */
  pillars: PillarStats;
  /** Nova Ficha RPG: 6 Atributos Avaliativos cobrindo as 10 Competências Gerais da BNCC (escala 0..20) */
  bnccAttributes: BnccAttributes;
  /** Exposto a colegas sob LGPD (máximo 2 destaques sem revelar valores baixos) */
  topSpecialties?: BnccAttributeKey[];
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
  bnccAttr: BnccAttributeKey;
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
  bnccAttr?: BnccAttributeKey;
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
    | "percurso"
    | "avaliacao"
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
  dynamicPaths: DynamicPath[];
  pathSteps: PathStep[];
  pathTeams: PathTeam[];
  pathSubmissions: PathSubmission[];
  pathEvaluations: PathEvaluation[];
  gradeComponents: GradeComponent[];
  studentFeed: StudentFeedEntry[];
  rewards: ShopReward[];
  redemptions: RedemptionRecord[];
  messages: ChatMessage[];
  logs: ActivityLog[];
  selectedClassId: string;
  activeStudentId: string;
}

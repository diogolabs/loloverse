"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { INITIAL_STATE } from "@/data/mockData";
import {
  BNCC_ATTRIBUTE_KEYS,
  computeSuggestedRubricScore,
  createEmptyBnccAttributes,
  getTopSpecialties,
  legacyPillarToBncc,
} from "@/data/bnccAndPaths";
import {
  extractPbError,
  getPocketBase,
  isPocketBaseEnabled,
  mapCategory,
  mapChannel,
  mapClass,
  mapDynamicPath,
  mapGradeComponent,
  mapInvite,
  mapLog,
  mapMessage,
  mapPathEvaluation,
  mapPathStep,
  mapPathSubmission,
  mapPathTeam,
  mapQuest,
  mapRedemption,
  mapReward,
  mapStudent,
  mapStudyRoom,
  mapTopic,
  mapUserToAccount,
} from "@/lib/pocketbase";
import {
  Account,
  ActivityLog,
  AttendanceStatus,
  AvatarConfig,
  BehaviorPreset,
  BnccAttributeKey,
  BnccAttributes,
  ChannelTopic,
  DynamicPath,
  EngagementPillar,
  GradeComponent,
  InviteRecord,
  LoloverseState,
  PathCycle,
  PathEvaluation,
  PathGradingMode,
  PathStatus,
  PathStep,
  PathStepFormat,
  PathStepScope,
  PathSubmission,
  PathTeam,
  Persona,
  Quest,
  QuestType,
  RubricLevel,
  ShopReward,
  Student,
  StudentFeedEntry,
  StudyRoom,
  ToastItem,
} from "@/types";

const STORAGE_KEY = "loloverse_mvp_state_v5";
const SESSION_KEY = "loloverse_session_account_id_v5";
const OAUTH_PENDING_KEY = "loloverse_oauth2_pending_v1";

interface PendingOAuth2 {
  providerName: string;
  state: string;
  codeVerifier: string;
  redirectUrl: string;
  inviteCode?: string;
}

const EMPTY_STATE: LoloverseState = {
  accounts: [],
  studyRooms: [],
  categories: [],
  channels: [],
  topics: [],
  classes: [],
  students: [],
  quests: [],
  dynamicPaths: [],
  pathSteps: [],
  pathTeams: [],
  pathSubmissions: [],
  pathEvaluations: [],
  gradeComponents: [],
  studentFeed: [],
  rewards: [],
  redemptions: [],
  messages: [],
  logs: [],
  selectedClassId: "",
  activeStudentId: "",
};

const AVATAR_PALETTE = [
  "#FACC15",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#FB923C",
  "#EC4899",
  "#06B6D4",
];

interface LoginResult {
  ok: boolean;
  error?: string;
}

interface InviteVerifyResult {
  valid: boolean;
  role?: string;
  className?: string;
  error?: string;
}

interface GenerateInviteItem {
  email: string;
  role: "student" | "teacher" | "coordinator";
  classId?: string;
  expiresInDays?: number;
  note?: string;
}

interface RegisterInput {
  displayName: string;
  username: string;
  password: string;
  role: Persona;
  classId?: string;
}

interface LoloverseContextValue {
  state: LoloverseState;
  invites: InviteRecord[];
  isBackendConnected: boolean;
  currentAccount: Account | null;
  persona: Persona;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  loginWithGoogle: (inviteCode?: string) => Promise<LoginResult>;
  completeGoogleCallback: (
    code: string,
    stateParam: string
  ) => Promise<LoginResult & { displayName?: string }>;
  verifyInvite: (email: string, code: string) => Promise<InviteVerifyResult>;
  acceptInviteWithPassword: (input: {
    email: string;
    code: string;
    displayName: string;
    password: string;
  }) => Promise<LoginResult>;
  generateInvites: (
    items: GenerateInviteItem[],
    options?: { sendEmail?: boolean }
  ) => Promise<InviteRecord[]>;
  resendInviteEmail: (inviteId: string) => Promise<void>;
  revokeInvite: (inviteId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  registerAccount: (input: RegisterInput) => LoginResult;
  logout: () => void;
  setSelectedClassId: (classId: string) => void;
  updateAttendance: (studentId: string, status: AttendanceStatus) => void;
  applyBehaviorFeedback: (studentId: string, preset: BehaviorPreset) => void;
  createQuest: (input: {
    classId: string;
    title: string;
    description: string;
    type: QuestType;
    xpReward: number;
    goldReward: number;
    pillar: EngagementPillar;
    dueDate: string;
    bossTargetPercent?: number;
  }) => void;
  toggleQuestActive: (questId: string) => void;
  completeQuestAsStudent: (questId: string, studentId: string) => void;
  redeemReward: (rewardId: string, studentId: string) => void;
  createCategory: (name: string, color: string) => void;
  createChannel: (
    categoryId: string,
    title: string,
    description: string,
    staffOnlyTopics?: boolean
  ) => string | null;
  updateChannel: (channelId: string, title: string, description: string) => void;
  createTopic: (
    channelId: string,
    title: string,
    summary: string,
    pillar?: EngagementPillar
  ) => string | null;
  updateTopic: (
    topicId: string,
    updates: Partial<Pick<ChannelTopic, "title" | "summary" | "pinned" | "resolved">>
  ) => void;
  sendChatMessage: (channelId: string, topicId: string, content: string) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  togglePinMessage: (messageId: string) => void;
  createStudyRoom: (input: {
    name: string;
    topic: string;
    maxSeats: number;
    accentColor: string;
  }) => void;
  updateStudyRoom: (
    roomId: string,
    updates: Partial<Pick<StudyRoom, "name" | "topic" | "maxSeats" | "accentColor">>
  ) => void;
  deleteStudyRoom: (roomId: string) => void;
  joinStudyRoom: (roomId: string) => void;
  leaveStudyRoom: () => void;
  updateMyStudyStatus: (
    onlineStatus: Student["onlineStatus"],
    studyActivity: string
  ) => void;
  toggleRewardApproval: (rewardId: string) => void;
  updateRewardCost: (rewardId: string, newCost: number) => void;
  createReward: (input: {
    title: string;
    description: string;
    cost: number;
    category: ShopReward["category"];
    stockLimit: number;
  }) => void;
  registerIntervention: (
    studentId: string,
    note: string,
    restoreHp?: number
  ) => void;
  updateAvatarProfile: (
    studentId: string,
    avatarConfig: AvatarConfig,
    roleTitle: string
  ) => void;
  createDynamicPath: (input: {
    classId: string;
    title: string;
    drivingQuestion: string;
    bnccSummary: string;
    gradingMode: PathGradingMode;
    gradeWeight: number;
    culminationDate: string;
    disciplinaryTitle: string;
  }) => string | null;
  addPathStep: (input: {
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
  }) => void;
  advancePathCycle: (pathId: string, nextCycle: PathStatus) => void;
  createPathTeams: (
    pathId: string,
    teams: Array<{
      name: string;
      memberIds: string[];
      roles: Record<string, string>;
    }>,
    createStudyRooms?: boolean
  ) => void;
  submitPathStep: (input: {
    pathId: string;
    stepId: string;
    studentId: string;
    teamId?: string;
    artifactFormat?: string;
    content: string;
    attachmentUrl?: string;
  }) => void;
  reviewPathSubmission: (
    submissionId: string,
    status: PathSubmission["status"],
    teacherFeedback: string
  ) => void;
  evaluateStudentPath: (input: {
    pathId: string;
    studentId: string;
    rigorLevel: RubricLevel;
    evidenceLevel: RubricLevel;
    authorshipLevel: RubricLevel;
    collaborationLevel: RubricLevel;
    qualitativeNote: string;
    publishToGradebook?: boolean;
  }) => void;
  resetDemoData: () => void;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  hydrated: boolean;
}

const LoloverseContext = createContext<LoloverseContextValue | null>(null);

function todayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function boostBnccGrowthOnly(
  current: BnccAttributes,
  key: BnccAttributeKey,
  delta: number,
  addEvidence = 1
): BnccAttributes {
  const prev = current[key] || { value: 0, evidenceCount: 0 };
  const nextVal = Math.max(prev.value, Math.min(20, prev.value + Math.max(0, delta)));
  return {
    ...current,
    [key]: {
      value: nextVal,
      evidenceCount: prev.evidenceCount + Math.max(0, addEvidence),
    },
  };
}

function evaluateAutoBadges(student: Student, triggers?: { submittedPath?: boolean; hybridActive?: boolean; pathCompleted?: boolean }): string[] {
  const set = new Set(student.badges);
  if (triggers?.submittedPath) set.add("Autor de Bordo");
  if (triggers?.hybridActive) set.add("Voz do Espaço Híbrido");
  if (triggers?.pathCompleted) set.add("Protagonista da Mostra");
  if (student.streakDays >= 5) set.add("Chama 5 Dias");
  const hasConsolidado = BNCC_ATTRIBUTE_KEYS.some(
    (k) => (student.bnccAttributes[k]?.value ?? 0) >= 11
  );
  if (hasConsolidado) set.add("Mente Consolidada");
  return Array.from(set);
}

function nowLabel(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `Hoje, ${hh}:${mm}`;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function toSlug(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function LoloverseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LoloverseState>(
    isPocketBaseEnabled ? EMPTY_STATE : INITIAL_STATE
  );
  const stateRef = useRef<LoloverseState>(state);
  stateRef.current = state;

  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [pbSelfAccount, setPbSelfAccount] = useState<Account | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const currentAccount = useMemo(() => {
    if (isPocketBaseEnabled) {
      if (!currentAccountId) return null;
      return (
        state.accounts.find((a) => a.id === currentAccountId) || pbSelfAccount
      );
    }
    return state.accounts.find((a) => a.id === currentAccountId) || null;
  }, [state.accounts, currentAccountId, pbSelfAccount]);

  const currentAccountRef = useRef<Account | null>(currentAccount);
  currentAccountRef.current = currentAccount;

  const persona: Persona = currentAccount?.role || "teacher";

  const pushToast = useCallback(
    (
      title: string,
      description: string | undefined,
      variant: ToastItem["variant"] = "info"
    ) => {
      const id = uid("toast");
      setToasts((prev) => [
        ...prev.slice(-3),
        { id, title, description, variant },
      ]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3800);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ===========================================================================
  // POCKETBASE: CARREGAMENTO COMPLETO & SINCRONIZAÇÃO REALTIME
  // ===========================================================================
  const loadFromPocketBase = useCallback(async () => {
    const pb = getPocketBase();
    if (!pb || !pb.authStore.isValid || !pb.authStore.record) return;

    const authRec = pb.authStore.record;
    const role = (authRec.role || "student") as Persona;
    const isStaff = role === "teacher" || role === "coordinator" || role === "admin";
    const isCoordOrAdmin = role === "coordinator" || role === "admin";

    const safeFullList = async (col: string, opts?: Record<string, unknown>) => {
      try {
        return await pb.collection(col).getFullList(opts);
      } catch {
        return [];
      }
    };

    const [
      classRecs,
      studentRecs,
      userRecs,
      questRecs,
      completionRecs,
      rewardRecs,
      redemptionRecs,
      roomRecs,
      categoryRecs,
      channelRecs,
      topicRecs,
      messageRecs,
      logRecs,
      inviteRecs,
      pathRecs,
      stepRecs,
      teamRecs,
      submissionRecs,
      evaluationRecs,
      gradeCompRecs,
    ] = await Promise.all([
      safeFullList("classes", { sort: "name" }),
      safeFullList("students", { sort: "name" }),
      safeFullList("users", { sort: "displayName" }),
      safeFullList("quests", { sort: "-created" }),
      safeFullList("quest_completions"),
      safeFullList("shop_rewards", { sort: "cost" }),
      safeFullList("redemptions", { sort: "-created" }),
      safeFullList("study_rooms", { sort: "name" }),
      safeFullList("channel_categories", { sort: "sortOrder,name" }),
      safeFullList("chat_channels", { sort: "title" }),
      safeFullList("channel_topics", { sort: "-pinned,-created" }),
      safeFullList("chat_messages", { sort: "created" }),
      isStaff
        ? safeFullList("activity_logs", { sort: "-created", batch: 50 })
        : Promise.resolve([]),
      isCoordOrAdmin
        ? safeFullList("invites", { sort: "-created" })
        : Promise.resolve([]),
      safeFullList("dynamic_paths", { sort: "-created" }),
      safeFullList("path_steps", { sort: "sortOrder,created" }),
      safeFullList("path_teams", { sort: "name" }),
      safeFullList("path_submissions", { sort: "-created" }),
      safeFullList("path_evaluations", { sort: "-updated" }),
      safeFullList("grade_components", { sort: "-created" }),
    ]);

    const studentByUserId = new Map<string, string>();
    for (const s of studentRecs) {
      if (s.user) studentByUserId.set(String(s.user), s.id);
    }

    const completionsByQuest = new Map<string, string[]>();
    for (const c of completionRecs) {
      const qId = String(c.quest || "");
      const sId = String(c.student || "");
      if (!qId || !sId) continue;
      const arr = completionsByQuest.get(qId) || [];
      arr.push(sId);
      completionsByQuest.set(qId, arr);
    }

    const mappedClasses = classRecs.map(mapClass);
    const mappedStudents = studentRecs.map(mapStudent);
    const mappedAccounts = userRecs.map((u) =>
      mapUserToAccount(u, studentByUserId)
    );
    const selfAcc =
      mappedAccounts.find((a) => a.id === authRec.id) ||
      mapUserToAccount(authRec, studentByUserId);

    setPbSelfAccount(selfAcc);
    setCurrentAccountId(selfAcc.id);
    setInvites(inviteRecs.map(mapInvite));

    setState((prev) => ({
      accounts: mappedAccounts,
      classes: mappedClasses,
      students: mappedStudents,
      quests: questRecs.map((q) =>
        mapQuest(q, completionsByQuest.get(q.id) || [])
      ),
      dynamicPaths: pathRecs.map(mapDynamicPath),
      pathSteps: stepRecs.map(mapPathStep),
      pathTeams: teamRecs.map(mapPathTeam),
      pathSubmissions: submissionRecs.map(mapPathSubmission),
      pathEvaluations: evaluationRecs.map(mapPathEvaluation),
      gradeComponents: gradeCompRecs.map(mapGradeComponent),
      studentFeed: prev.studentFeed,
      rewards: rewardRecs.map(mapReward),
      redemptions: redemptionRecs.map(mapRedemption),
      studyRooms: roomRecs.map(mapStudyRoom),
      categories: categoryRecs.map(mapCategory),
      channels: channelRecs.map(mapChannel),
      topics: topicRecs.map(mapTopic),
      messages: messageRecs.map((m) => mapMessage(m, authRec.id)),
      logs: logRecs.slice(0, 60).map(mapLog),
      selectedClassId:
        prev.selectedClassId &&
        mappedClasses.some((c) => c.id === prev.selectedClassId)
          ? prev.selectedClassId
          : selfAcc.classId || mappedClasses[0]?.id || "",
      activeStudentId: selfAcc.studentId || mappedStudents[0]?.id || "",
    }));
  }, []);

  const refreshData = useCallback(async () => {
    if (!isPocketBaseEnabled) return;
    await loadFromPocketBase();
  }, [loadFromPocketBase]);

  // Hidratação inicial (PocketBase OU Demo Local)
  useEffect(() => {
    let active = true;

    if (isPocketBaseEnabled) {
      (async () => {
        const pb = getPocketBase();
        if (!pb) {
          if (active) setHydrated(true);
          return;
        }
        try {
          if (pb.authStore.isValid) {
            await pb.collection("users").authRefresh();
            if (active) await loadFromPocketBase();
          }
        } catch {
          pb.authStore.clear();
          if (active) {
            setCurrentAccountId(null);
            setPbSelfAccount(null);
          }
        } finally {
          if (active) setHydrated(true);
        }
      })();
      return () => {
        active = false;
      };
    }

    // Modo demonstração local
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LoloverseState>;
        if (
          parsed &&
          Array.isArray(parsed.students) &&
          Array.isArray(parsed.accounts) &&
          Array.isArray(parsed.categories) &&
          Array.isArray(parsed.topics)
        ) {
          setState({ ...INITIAL_STATE, ...parsed });
        }
      }
      const savedSession = window.sessionStorage.getItem(SESSION_KEY);
      if (savedSession) {
        setCurrentAccountId(savedSession);
      }
    } catch {
      // Ignora erros de storage
    } finally {
      setHydrated(true);
    }

    return () => {
      active = false;
    };
  }, [loadFromPocketBase]);

  // Assinaturas Realtime SSE no PocketBase (com debounce leve de 300ms)
  useEffect(() => {
    if (!isPocketBaseEnabled || !currentAccountId) return;
    const pb = getPocketBase();
    if (!pb || !pb.authStore.isValid) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const scheduleReload = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        loadFromPocketBase().catch(() => {});
      }, 300);
    };

    const collectionsToWatch = [
      "students",
      "quests",
      "quest_completions",
      "dynamic_paths",
      "path_steps",
      "path_teams",
      "path_submissions",
      "path_evaluations",
      "shop_rewards",
      "redemptions",
      "study_rooms",
      "channel_categories",
      "chat_channels",
      "channel_topics",
      "chat_messages",
    ];

    const role = currentAccountRef.current?.role;
    if (role === "coordinator" || role === "admin") {
      collectionsToWatch.push("invites");
    }

    collectionsToWatch.forEach((col) => {
      pb.collection(col)
        .subscribe("*", scheduleReload)
        .catch(() => {});
    });

    return () => {
      if (timer) clearTimeout(timer);
      collectionsToWatch.forEach((col) => {
        pb.collection(col)
          .unsubscribe("*")
          .catch(() => {});
      });
    };
  }, [currentAccountId, loadFromPocketBase]);

  // Persistência local (somente modo Demo)
  useEffect(() => {
    if (isPocketBaseEnabled || !hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignora erro de quota
    }
  }, [state, hydrated]);

  useEffect(() => {
    if (isPocketBaseEnabled) return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const parsed = JSON.parse(event.newValue) as Partial<LoloverseState>;
        if (
          parsed &&
          Array.isArray(parsed.students) &&
          Array.isArray(parsed.accounts) &&
          Array.isArray(parsed.topics)
        ) {
          setState({ ...INITIAL_STATE, ...parsed });
        }
      } catch {
        // Ignora atualização malformada
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persistSession = useCallback((accountId: string | null) => {
    setCurrentAccountId(accountId);
    if (isPocketBaseEnabled) return;
    try {
      if (accountId) {
        window.sessionStorage.setItem(SESSION_KEY, accountId);
      } else {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Ignora erro de storage
    }
  }, []);

  // ===========================================================================
  // AUTENTICAÇÃO (Google OAuth2 + Convites + Admin Senha)
  // ===========================================================================
  const verifyInvite = useCallback(
    async (email: string, code: string): Promise<InviteVerifyResult> => {
      const pb = getPocketBase();
      if (!pb) return { valid: false, error: "Backend não conectado." };
      try {
        const res = await pb.send<InviteVerifyResult>(
          "/api/loloverse/invites/verify",
          {
            method: "POST",
            body: {
              email: email.trim().toLowerCase(),
              code: code.trim().toUpperCase(),
            },
          }
        );
        return res;
      } catch (err) {
        return {
          valid: false,
          error: extractPbError(err, "Não foi possível validar o convite."),
        };
      }
    },
    []
  );

  const loginWithGoogle = useCallback(
    async (inviteCode?: string): Promise<LoginResult> => {
      const pb = getPocketBase();
      if (!pb || typeof window === "undefined") {
        return { ok: false, error: "Backend PocketBase não configurado." };
      }
      try {
        const authMethods = await pb.collection("users").listAuthMethods();
        const providers = authMethods.oauth2?.providers || [];
        const google = providers.find((p) => p.name === "google");
        if (!google) {
          return {
            ok: false,
            error: "Login com Google não está habilitado no servidor.",
          };
        }

        const redirectUrl = `${window.location.origin}/auth/callback`;
        const cleanCode = inviteCode ? inviteCode.trim().toUpperCase() : "";
        const pending: PendingOAuth2 = {
          providerName: "google",
          state: google.state,
          codeVerifier: google.codeVerifier,
          redirectUrl,
          inviteCode: cleanCode || undefined,
        };
        window.sessionStorage.setItem(OAUTH_PENDING_KEY, JSON.stringify(pending));

        const baseAuthUrl = google.authURL || "";
        window.location.assign(`${baseAuthUrl}${encodeURIComponent(redirectUrl)}`);
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: extractPbError(
            err,
            "Não foi possível iniciar a autenticação com o Google."
          ),
        };
      }
    },
    []
  );

  const completeGoogleCallback = useCallback(
    async (
      code: string,
      stateParam: string
    ): Promise<LoginResult & { displayName?: string }> => {
      const pb = getPocketBase();
      if (!pb || typeof window === "undefined") {
        return { ok: false, error: "Backend PocketBase não configurado." };
      }

      const rawPending = window.sessionStorage.getItem(OAUTH_PENDING_KEY);
      window.sessionStorage.removeItem(OAUTH_PENDING_KEY);

      if (!rawPending) {
        return {
          ok: false,
          error: "Sessão de login expirada ou já processada. Tente entrar novamente.",
        };
      }

      let pending: PendingOAuth2;
      try {
        pending = JSON.parse(rawPending) as PendingOAuth2;
      } catch {
        return { ok: false, error: "Dados de retorno inválidos. Tente novamente." };
      }

      if (!pending.state || pending.state !== stateParam) {
        return {
          ok: false,
          error: "Validação de segurança (state) falhou. Inicie o login novamente.",
        };
      }

      try {
        await pb
          .collection("users")
          .authWithOAuth2Code(
            pending.providerName,
            code,
            pending.codeVerifier,
            pending.redirectUrl,
            pending.inviteCode ? { inviteCode: pending.inviteCode } : undefined
          );
        await loadFromPocketBase();
        const displayName =
          String(pb.authStore.record?.displayName || "").trim() || "Bem-vindo(a)";
        pushToast(`Bem-vindo(a), ${displayName}!`, "Sessão Google ativa.", "success");
        return { ok: true, displayName };
      } catch (err) {
        pb.authStore.clear();
        return {
          ok: false,
          error: extractPbError(
            err,
            "Cadastro bloqueado: verifique se possui um código de convite válido para este e-mail Google."
          ),
        };
      }
    },
    [loadFromPocketBase, pushToast]
  );

  const login = useCallback(
    async (identifier: string, password: string): Promise<LoginResult> => {
      const cleanId = identifier.trim();
      const cleanPass = password.trim();
      if (!cleanId || !cleanPass) {
        return { ok: false, error: "Informe e-mail/usuário e senha." };
      }

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return { ok: false, error: "Backend indisponível." };
        try {
          await pb.collection("users").authWithPassword(cleanId, cleanPass);
          await loadFromPocketBase();
          const name = pb.authStore.record?.displayName || cleanId;
          pushToast(
            `Bem-vindo(a), ${name}!`,
            "Sessão administrativa autenticada.",
            "success"
          );
          return { ok: true };
        } catch (err) {
          return {
            ok: false,
            error: extractPbError(
              err,
              "Credenciais inválidas ou conta exclusiva Google."
            ),
          };
        }
      }

      // Modo demo local
      const lowerId = cleanId.toLowerCase();
      const found = stateRef.current.accounts.find(
        (acc) =>
          (acc.username.toLowerCase() === lowerId ||
            acc.email.toLowerCase() === lowerId) &&
          acc.password === cleanPass
      );
      if (!found) {
        return {
          ok: false,
          error: "Usuário ou senha incorretos. Nas contas demo a senha é 123.",
        };
      }

      persistSession(found.id);
      setState((prev) => ({
        ...prev,
        selectedClassId: found.classId || prev.selectedClassId,
        activeStudentId: found.studentId || prev.activeStudentId,
      }));
      pushToast(`Bem-vindo(a), ${found.displayName}!`, `@${found.username}`, "success");
      return { ok: true };
    },
    [loadFromPocketBase, persistSession, pushToast]
  );

  const acceptInviteWithPassword = useCallback(
    async (input: {
      email: string;
      code: string;
      displayName: string;
      password: string;
    }): Promise<LoginResult> => {
      const pb = getPocketBase();
      if (!pb) return { ok: false, error: "Backend indisponível." };
      try {
        const cleanEmail = input.email.trim().toLowerCase();
        const cleanCode = input.code.trim().toUpperCase();
        await pb.send("/api/loloverse/invites/accept", {
          method: "POST",
          body: {
            email: cleanEmail,
            code: cleanCode,
            displayName: input.displayName.trim(),
            password: input.password,
          },
        });
        await pb.collection("users").authWithPassword(cleanEmail, input.password);
        await loadFromPocketBase();
        pushToast(
          `Bem-vindo(a), ${input.displayName.trim()}!`,
          "Conta ativada e senha criada com sucesso.",
          "success"
        );
        return { ok: true };
      } catch (err) {
        return {
          ok: false,
          error: extractPbError(
            err,
            "Não foi possível ativar sua conta. Verifique o convite e a senha."
          ),
        };
      }
    },
    [loadFromPocketBase, pushToast]
  );

  const generateInvites = useCallback(
    async (
      items: GenerateInviteItem[],
      options?: { sendEmail?: boolean }
    ): Promise<InviteRecord[]> => {
      const pb = getPocketBase();
      if (!pb) return [];
      const createdAll: InviteRecord[] = [];
      let totalEmailsSent = 0;
      let lastEmailError = "";
      const appUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://loloverse.diogolabs.dev.br";
      try {
        for (let i = 0; i < items.length; i += 100) {
          const chunk = items.slice(i, i + 100);
          const res = await pb.send<{
            created: InviteRecord[];
            emailsSent?: number;
            emailError?: string;
          }>("/api/loloverse/invites/generate", {
            method: "POST",
            body: {
              invites: chunk,
              sendEmail: Boolean(options?.sendEmail),
              appUrl,
            },
          });
          if (Array.isArray(res.created)) {
            createdAll.push(...res.created);
          }
          totalEmailsSent += Number(res.emailsSent || 0);
          if (res.emailError) lastEmailError = res.emailError;
        }
        await loadFromPocketBase();
        const desc = options?.sendEmail
          ? totalEmailsSent > 0
            ? `${totalEmailsSent} e-mail(s) enviado(s) automaticamente!`
            : lastEmailError
            ? "Convites gerados! Configure o SMTP em Settings → Mail settings ou copie o link."
            : "Copie os links ou baixe o CSV."
          : "Copie os links ou baixe o CSV.";
        pushToast(`${createdAll.length} convite(s) gerado(s)!`, desc, "success");
        return createdAll;
      } catch (err) {
        pushToast(
          "Erro ao gerar convites",
          extractPbError(err, "Verifique os dados informados."),
          "danger"
        );
        return [];
      }
    },
    [loadFromPocketBase, pushToast]
  );

  const resendInviteEmail = useCallback(
    async (inviteId: string) => {
      const pb = getPocketBase();
      if (!pb) return;
      const appUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://loloverse.diogolabs.dev.br";
      try {
        await pb.send(`/api/loloverse/invites/${inviteId}/resend`, {
          method: "POST",
          body: { appUrl },
        });
        pushToast("E-mail enviado!", "Link de primeiro acesso reenviado.", "success");
      } catch (err) {
        pushToast(
          "Não foi possível enviar e-mail",
          extractPbError(err, "Verifique o SMTP no PocketBase ou use Copiar Link."),
          "warning"
        );
      }
    },
    [pushToast]
  );

  const revokeInvite = useCallback(
    async (inviteId: string) => {
      const pb = getPocketBase();
      if (!pb) return;
      try {
        await pb.collection("invites").update(inviteId, { active: false });
        await loadFromPocketBase();
        pushToast("Convite revogado", "O código não poderá mais ser usado.", "warning");
      } catch (err) {
        pushToast("Erro ao revogar", extractPbError(err, "Tente novamente."), "danger");
      }
    },
    [loadFromPocketBase, pushToast]
  );

  const registerAccount = useCallback(
    (input: RegisterInput): LoginResult => {
      if (isPocketBaseEnabled) {
        return {
          ok: false,
          error: "Use a aba Convite para concluir seu cadastro via Google.",
        };
      }
      const displayName = input.displayName.trim();
      const username = input.username
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "");
      const password = input.password.trim();
      if (displayName.length < 2) return { ok: false, error: "Informe seu nome." };
      if (username.length < 3) return { ok: false, error: "Usuário mínimo 3 caracteres." };
      if (password.length < 3) return { ok: false, error: "Senha mínima 3 caracteres." };
      if (stateRef.current.accounts.some((a) => a.username.toLowerCase() === username)) {
        return { ok: false, error: `Usuário "@${username}" já existe.` };
      }

      const seed = stateRef.current.accounts.length + 3;
      const color = AVATAR_PALETTE[seed % AVATAR_PALETTE.length];
      const chosenClassId = input.classId || stateRef.current.classes[0]?.id || "class-8a";
      const newStudentId = input.role === "student" ? uid("stu") : undefined;

      const newAccount: Account = {
        id: uid("acc"),
        username,
        email: `${username}@loloverse.edu.br`,
        password,
        displayName,
        role: input.role,
        avatarSeed: seed,
        avatarColor: color,
        studentId: newStudentId,
        classId: input.role === "coordinator" ? undefined : chosenClassId,
      };
      const newStudent: Student | null =
        input.role === "student" && newStudentId
          ? {
              id: newStudentId,
              name: displayName,
              classId: chosenClassId,
              avatarSeed: seed,
              avatarColor: color,
              roleTitle: "Aventureiro(a) Maker",
              level: 1,
              xp: 40,
              xpToNext: 200,
              hp: 100,
              maxHp: 100,
              gold: 50,
              attendanceToday: "presente",
              attendanceRate: 100,
              bimesterAverage: 8.0,
              previousAverage: 8.0,
              deliveryRate: 100,
              streakDays: 1,
              onlineStatus: "online",
              studyActivity: "Explorando o Loloverse!",
              pillars: { proposito: 60, maestria: 60, criatividade: 65, social: 60 },
              bnccAttributes: createEmptyBnccAttributes(),
              topSpecialties: [],
              unlockedTitles: ["Aventureiro(a) Maker", "Jovem Cientista"],
              badges: ["Novo no Loloverse"],
              interventionsCount: 0,
            }
          : null;

      setState((prev) => ({
        ...prev,
        accounts: [...prev.accounts, newAccount],
        students: newStudent ? [...prev.students, newStudent] : prev.students,
        selectedClassId: newAccount.classId || prev.selectedClassId,
        activeStudentId: newStudentId || prev.activeStudentId,
      }));
      persistSession(newAccount.id);
      return { ok: true };
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    if (isPocketBaseEnabled) {
      const pb = getPocketBase();
      if (pb) {
        pb.send("/api/loloverse/study-rooms/leave", { method: "POST" }).catch(() => {});
        pb.authStore.clear();
      }
      setCurrentAccountId(null);
      setPbSelfAccount(null);
      setInvites([]);
      setState(EMPTY_STATE);
      pushToast("Sessão encerrada", "Até logo!", "info");
      return;
    }

    const acc = currentAccountRef.current;
    if (acc) {
      setState((prev) => ({
        ...prev,
        studyRooms: prev.studyRooms.map((r) => ({
          ...r,
          participantIds: r.participantIds.filter((id) => id !== acc.id),
        })),
      }));
    }
    persistSession(null);
    pushToast("Sessão encerrada", "Volte quando quiser.", "info");
  }, [persistSession, pushToast]);

  const setSelectedClassId = useCallback((classId: string) => {
    setState((prev) => ({ ...prev, selectedClassId: classId }));
  }, []);

  // ===========================================================================
  // AÇÕES PEDAGÓGICAS, RPG & ECONOMIA (Server-Side no PocketBase)
  // ===========================================================================
  const updateAttendance = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.send("/api/loloverse/attendance", {
          method: "POST",
          body: { studentId, status },
        })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Frequência atualizada", `Status salvo: ${status}.`, "success");
          })
          .catch((err) =>
            pushToast("Erro ao salvar frequência", extractPbError(err, "Tente novamente."), "danger")
          );
        return;
      }

      const target = stateRef.current.students.find((s) => s.id === studentId);
      if (!target) return;
      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId ? { ...s, attendanceToday: status } : s
        ),
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  const applyBehaviorFeedback = useCallback(
    (studentId: string, preset: BehaviorPreset) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.send<{ leveledUp?: boolean; level?: number }>(
          "/api/loloverse/behavior-feedback",
          {
            method: "POST",
            body: { studentId, presetId: preset.id },
          }
        )
          .then((res) => {
            loadFromPocketBase().catch(() => {});
            pushToast(
              res.leveledUp
                ? `LEVEL UP! Nível ${res.level}!`
                : preset.label,
              "Feedback registrado no banco.",
              preset.type === "positive" ? "success" : "danger"
            );
          })
          .catch((err) =>
            pushToast("Erro no Pulso da Turma", extractPbError(err, "Tente novamente."), "danger")
          );
        return;
      }

      const target = stateRef.current.students.find((s) => s.id === studentId);
      if (!target) return;
      const actorName = currentAccountRef.current?.displayName || "Docente";
      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) => {
          if (s.id !== studentId) return s;
          let nextXp = s.xp + preset.xpDelta;
          let nextLevel = s.level;
          let nextXpToNext = s.xpToNext;
          while (nextXp >= nextXpToNext) {
            nextXp -= nextXpToNext;
            nextLevel += 1;
            nextXpToNext += 50;
          }
          // Regra inviolável: atributos BNCC NUNCA caem por punição (alertas afetam apenas HP)
          const nextBncc =
            preset.type === "positive"
              ? boostBnccGrowthOnly(s.bnccAttributes, preset.bnccAttr, 1, 1)
              : s.bnccAttributes;
          const updated: Student = {
            ...s,
            xp: nextXp,
            level: nextLevel,
            xpToNext: nextXpToNext,
            hp: Math.max(0, Math.min(s.maxHp, s.hp + preset.hpDelta)),
            gold: Math.max(0, s.gold + preset.goldDelta),
            bnccAttributes: nextBncc,
            topSpecialties: getTopSpecialties(nextBncc, 2),
          };
          updated.badges = evaluateAutoBadges(updated);
          return updated;
        }),
        studentFeed: [
          {
            id: uid("feed"),
            studentId,
            timestamp: nowLabel(),
            title:
              preset.type === "positive"
                ? `Pulso da Turma · ${preset.label}`
                : `Alerta de Rotina · ${preset.label}`,
            detail:
              preset.type === "positive"
                ? `${actorName} reconheceu: ${preset.description}.`
                : `${actorName} registrou atenção na rotina (atributos BNCC preservados).`,
            deltaSummary:
              preset.type === "positive"
                ? `+${preset.xpDelta} XP · +${preset.goldDelta} Ouro · +1 ${preset.bnccAttr.toUpperCase()}`
                : `${preset.hpDelta} HP`,
            variant: (preset.type === "positive" ? "bncc" : "hp") as StudentFeedEntry["variant"],
          },
          ...prev.studentFeed,
        ].slice(0, 80),
        logs: [
          {
            id: uid("log"),
            timestamp: nowLabel(),
            actor: actorName,
            target: target.name,
            action: `${preset.type === "positive" ? "Concedeu" : "Alerta:"} ${preset.label}`,
            category: "comportamento" as ActivityLog["category"],
            deltaSummary:
              preset.type === "positive"
                ? `+${preset.xpDelta} XP · +${preset.goldDelta} Ouro`
                : `${preset.hpDelta} HP`,
          },
          ...prev.logs,
        ].slice(0, 60),
      }));
      pushToast(
        preset.label,
        preset.type === "positive"
          ? `${target.name} recebeu +${preset.xpDelta} XP e +1 ${preset.bnccAttr.toUpperCase()}`
          : `${target.name}: ${preset.hpDelta} HP (atributos BNCC preservados)`,
        preset.type === "positive" ? "success" : "warning"
      );
    },
    [loadFromPocketBase, pushToast]
  );

  const createQuest = useCallback(
    (input: {
      classId: string;
      title: string;
      description: string;
      type: QuestType;
      xpReward: number;
      goldReward: number;
      pillar: EngagementPillar;
      dueDate: string;
      bossTargetPercent?: number;
    }) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("quests")
          .create({
            class: input.classId,
            title: input.title.trim(),
            description: input.description.trim(),
            type: input.type,
            xpReward: input.xpReward,
            goldReward: input.goldReward,
            pillar: input.pillar,
            dueDate: input.dueDate.trim() || "Esta semana",
            active: true,
            bossTargetPercent:
              input.type === "boss" ? input.bossTargetPercent ?? 85 : undefined,
            createdBy: pb.authStore.record?.id || "",
          })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Nova Missão publicada!", input.title, "success");
          })
          .catch((err) =>
            pushToast("Erro ao criar missão", extractPbError(err, "Tente novamente."), "danger")
          );
        return;
      }

      const newQuest: Quest = {
        id: uid("q"),
        classId: input.classId,
        title: input.title.trim(),
        description: input.description.trim(),
        type: input.type,
        xpReward: input.xpReward,
        goldReward: input.goldReward,
        pillar: input.pillar,
        dueDate: input.dueDate.trim() || "Esta semana",
        active: true,
        completedBy: [],
        bossTargetPercent: input.type === "boss" ? input.bossTargetPercent ?? 85 : undefined,
      };
      setState((prev) => ({ ...prev, quests: [newQuest, ...prev.quests] }));
    },
    [loadFromPocketBase, pushToast]
  );

  const toggleQuestActive = useCallback(
    (questId: string) => {
      const target = stateRef.current.quests.find((q) => q.id === questId);
      if (!target) return;
      const nextActive = !target.active;

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("quests")
          .update(questId, { active: nextActive })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast(nextActive ? "Missão ativada" : "Missão pausada", target.title, "info");
          })
          .catch((err) =>
            pushToast("Erro ao atualizar missão", extractPbError(err, "Tente novamente."), "danger")
          );
        return;
      }

      setState((prev) => ({
        ...prev,
        quests: prev.quests.map((q) =>
          q.id === questId ? { ...q, active: nextActive } : q
        ),
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  const completeQuestAsStudent = useCallback(
    (questId: string, studentId: string) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.send<{ leveledUp?: boolean; level?: number }>(
          `/api/loloverse/quests/${questId}/complete`,
          { method: "POST", body: { studentId } }
        )
          .then((res) => {
            loadFromPocketBase().catch(() => {});
            pushToast(
              res.leveledUp ? `Missão concluída + Nível ${res.level}!` : "Missão concluída!",
              "Recompensas creditadas pelo servidor.",
              "success"
            );
          })
          .catch((err) =>
            pushToast("Não foi possível concluir", extractPbError(err, "Tente novamente."), "warning")
          );
        return;
      }

      const quest = stateRef.current.quests.find((q) => q.id === questId);
      if (!quest || quest.completedBy.includes(studentId)) return;
      const attrKey = quest.bnccAttr || legacyPillarToBncc(quest.pillar);
      const today = todayIso();
      setState((prev) => ({
        ...prev,
        quests: prev.quests.map((q) =>
          q.id === questId ? { ...q, completedBy: [...q.completedBy, studentId] } : q
        ),
        students: prev.students.map((s) => {
          if (s.id !== studentId) return s;
          let nextXp = s.xp + quest.xpReward;
          let nextLevel = s.level;
          let nextXpToNext = s.xpToNext;
          while (nextXp >= nextXpToNext) {
            nextXp -= nextXpToNext;
            nextLevel += 1;
            nextXpToNext += 50;
          }
          const shouldAdvanceStreak = s.lastStreakDate !== today;
          const nextBncc = boostBnccGrowthOnly(s.bnccAttributes, attrKey, 1, 1);
          const updated: Student = {
            ...s,
            xp: nextXp,
            level: nextLevel,
            xpToNext: nextXpToNext,
            gold: s.gold + quest.goldReward,
            hp: Math.min(s.maxHp, s.hp + 4),
            streakDays: shouldAdvanceStreak ? s.streakDays + 1 : s.streakDays,
            lastStreakDate: today,
            bnccAttributes: nextBncc,
            topSpecialties: getTopSpecialties(nextBncc, 2),
          };
          updated.badges = evaluateAutoBadges(updated);
          return updated;
        }),
        studentFeed: [
          {
            id: uid("feed"),
            studentId,
            timestamp: nowLabel(),
            title: `Missão Concluída · ${quest.title}`,
            detail: "Recompensa creditada na ficha do personagem.",
            deltaSummary: `+${quest.xpReward} XP · +${quest.goldReward} Ouro · +4 HP`,
            variant: "xp" as const,
          },
          ...prev.studentFeed,
        ].slice(0, 80),
      }));
      pushToast("Missão concluída!", `+${quest.xpReward} XP · +${quest.goldReward} Ouro`, "success");
    },
    [loadFromPocketBase, pushToast]
  );

  const redeemReward = useCallback(
    (rewardId: string, studentId: string) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.send<{ rewardTitle?: string }>(
          `/api/loloverse/rewards/${rewardId}/redeem`,
          { method: "POST" }
        )
          .then((res) => {
            loadFromPocketBase().catch(() => {});
            pushToast("Recompensa resgatada!", res.rewardTitle || "Voucher gerado.", "success");
          })
          .catch((err) =>
            pushToast("Resgate recusado", extractPbError(err, "Verifique seu saldo."), "warning")
          );
        return;
      }

      const reward = stateRef.current.rewards.find((r) => r.id === rewardId);
      const student = stateRef.current.students.find((s) => s.id === studentId);
      if (!reward || !student || !reward.approved || student.gold < reward.cost) return;
      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId ? { ...s, gold: s.gold - reward.cost } : s
        ),
        rewards: prev.rewards.map((r) =>
          r.id === rewardId ? { ...r, redeemedCount: r.redeemedCount + 1 } : r
        ),
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  // ===========================================================================
  // ESPAÇO HÍBRIDO
  // ===========================================================================
  const createCategory = useCallback(
    (name: string, color: string) => {
      const cleanName = name.trim();
      if (!cleanName) return;

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("channel_categories")
          .create({
            name: cleanName,
            color: color || "#3B82F6",
            sortOrder: stateRef.current.categories.length + 1,
          })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast(`Categoria "${cleanName}" criada!`, undefined, "success");
          })
          .catch((err) =>
            pushToast("Erro ao criar categoria", extractPbError(err, "Sem permissão."), "danger")
          );
        return;
      }

      setState((prev) => ({
        ...prev,
        categories: [...prev.categories, { id: uid("cat"), name: cleanName, color: color || "#3B82F6" }],
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  const createChannel = useCallback(
    (
      categoryId: string,
      title: string,
      description: string,
      staffOnlyTopics = false
    ): string | null => {
      const cleanTitle = title.trim();
      const slug = toSlug(cleanTitle);
      if (!cleanTitle || !slug) return null;

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return null;
        pb.collection("chat_channels")
          .create({
            category: categoryId,
            slug: `#${slug}`,
            label: slug,
            title: cleanTitle,
            description: description.trim() || "Canal organizado em tópicos.",
            staffOnlyTopics,
          })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast(`Canal "${cleanTitle}" criado!`, undefined, "success");
          })
          .catch((err) =>
            pushToast("Erro ao criar canal", extractPbError(err, "Tente outro nome."), "danger")
          );
        return null;
      }

      const id = uid("ch");
      setState((prev) => ({
        ...prev,
        channels: [
          ...prev.channels,
          {
            id,
            categoryId,
            slug: `#${slug}`,
            label: slug,
            title: cleanTitle,
            description: description.trim() || "Canal organizado em tópicos.",
            staffOnlyTopics,
          },
        ],
      }));
      return id;
    },
    [loadFromPocketBase, pushToast]
  );

  const updateChannel = useCallback(
    (channelId: string, title: string, description: string) => {
      const cleanTitle = title.trim();
      if (!cleanTitle) return;
      const slug = toSlug(cleanTitle);

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("chat_channels")
          .update(channelId, {
            title: cleanTitle,
            label: slug,
            slug: `#${slug}`,
            description: description.trim(),
          })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Canal atualizado!", cleanTitle, "info");
          })
          .catch((err) =>
            pushToast("Erro ao atualizar canal", extractPbError(err, "Tente novamente."), "danger")
          );
        return;
      }

      setState((prev) => ({
        ...prev,
        channels: prev.channels.map((c) =>
          c.id === channelId ? { ...c, title: cleanTitle, description } : c
        ),
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  const createTopic = useCallback(
    (
      channelId: string,
      title: string,
      summary: string,
      pillar?: EngagementPillar
    ): string | null => {
      const cleanTitle = title.trim();
      const acc = currentAccountRef.current;
      if (!cleanTitle || !acc) return null;

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return null;
        pb.collection("channel_topics")
          .create({
            channel: channelId,
            title: cleanTitle,
            summary: summary.trim() || "Discussão guiada aberta.",
            author: acc.id,
            createdByName: acc.displayName,
            pinned: false,
            resolved: false,
            pillar: pillar || "",
          })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Novo tópico aberto!", cleanTitle, "success");
          })
          .catch((err) =>
            pushToast("Erro ao abrir tópico", extractPbError(err, "Verifique permissões."), "danger")
          );
        return null;
      }

      const id = uid("top");
      setState((prev) => ({
        ...prev,
        topics: [
          {
            id,
            channelId,
            title: cleanTitle,
            summary: summary.trim(),
            createdBy: acc.displayName,
            createdAt: nowLabel(),
            pillar,
          },
          ...prev.topics,
        ],
      }));
      return id;
    },
    [loadFromPocketBase, pushToast]
  );

  const updateTopic = useCallback(
    (
      topicId: string,
      updates: Partial<Pick<ChannelTopic, "title" | "summary" | "pinned" | "resolved">>
    ) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("channel_topics")
          .update(topicId, updates)
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Tópico atualizado", updates.title, "info");
          })
          .catch((err) =>
            pushToast("Erro ao atualizar tópico", extractPbError(err, "Sem permissão."), "danger")
          );
        return;
      }

      setState((prev) => ({
        ...prev,
        topics: prev.topics.map((t) => (t.id === topicId ? { ...t, ...updates } : t)),
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  const sendChatMessage = useCallback(
    (channelId: string, topicId: string, content: string) => {
      const trimmed = content.trim();
      const acc = currentAccountRef.current;
      if (!trimmed || !acc) return;

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("chat_messages")
          .create({
            channel: channelId,
            topic: topicId,
            author: acc.id,
            content: trimmed,
            pinned: false,
          })
          .then(() => loadFromPocketBase().catch(() => {}))
          .catch((err) =>
            pushToast("Erro ao enviar mensagem", extractPbError(err, "Tente novamente."), "danger")
          );
        return;
      }

      const authorRole =
        acc.role === "teacher"
          ? "professor"
          : acc.role === "coordinator"
          ? "coordenador"
          : acc.role === "admin"
          ? "admin"
          : "aluno";
      const today = todayIso();
      setState((prev) => {
        const nextStudents = acc.studentId
          ? prev.students.map((s) => {
              if (s.id !== acc.studentId) return s;
              const usedToday = s.hybridHpDate === today ? s.hybridHpToday || 0 : 0;
              const gain = usedToday < 8 ? 2 : 0;
              const nextBncc =
                gain > 0
                  ? boostBnccGrowthOnly(s.bnccAttributes, "elo", usedToday === 0 ? 1 : 0, usedToday === 0 ? 1 : 0)
                  : s.bnccAttributes;
              const updated: Student = {
                ...s,
                hp: Math.min(s.maxHp, s.hp + gain),
                hybridHpDate: today,
                hybridHpToday: usedToday + gain,
                bnccAttributes: nextBncc,
                topSpecialties: getTopSpecialties(nextBncc, 2),
              };
              updated.badges = evaluateAutoBadges(updated, { hybridActive: true });
              return updated;
            })
          : prev.students;
        return {
          ...prev,
          students: nextStudents,
          messages: [
            ...prev.messages,
            {
              id: uid("msg"),
              channelId,
              topicId,
              authorId: acc.id,
              authorName: acc.displayName,
              authorRole,
              avatarSeed: acc.avatarSeed,
              avatarColor: acc.avatarColor,
              content: trimmed,
              timestamp: nowLabel(),
              reactions: [],
            },
          ],
        };
      });
    },
    [loadFromPocketBase, pushToast]
  );

  const toggleReaction = useCallback(
    (messageId: string, emoji: string) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.send(`/api/loloverse/messages/${messageId}/react`, {
          method: "POST",
          body: { emoji },
        })
          .then(() => loadFromPocketBase().catch(() => {}))
          .catch(() => {});
        return;
      }

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) => {
          if (m.id !== messageId) return m;
          const existing = m.reactions.find((r) => r.emoji === emoji);
          if (!existing) {
            return {
              ...m,
              reactions: [...m.reactions, { emoji, count: 1, userReacted: true }],
            };
          }
          const nextCount = existing.userReacted ? existing.count - 1 : existing.count + 1;
          return {
            ...m,
            reactions:
              nextCount <= 0
                ? m.reactions.filter((r) => r.emoji !== emoji)
                : m.reactions.map((r) =>
                    r.emoji === emoji
                      ? { ...r, count: nextCount, userReacted: !r.userReacted }
                      : r
                  ),
          };
        }),
      }));
    },
    [loadFromPocketBase]
  );

  const togglePinMessage = useCallback(
    (messageId: string) => {
      const target = stateRef.current.messages.find((m) => m.id === messageId);
      if (!target) return;

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("chat_messages")
          .update(messageId, { pinned: !target.pinned })
          .then(() => loadFromPocketBase().catch(() => {}))
          .catch((err) =>
            pushToast("Erro ao fixar", extractPbError(err, "Apenas staff."), "danger")
          );
        return;
      }

      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === messageId ? { ...m, pinned: !m.pinned } : m
        ),
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  const createStudyRoom = useCallback(
    (input: {
      name: string;
      topic: string;
      maxSeats: number;
      accentColor: string;
    }) => {
      const cleanName = input.name.trim();
      if (!cleanName) return;

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("study_rooms")
          .create({
            name: cleanName,
            topic: input.topic.trim() || "Estudo colaborativo guiado",
            maxSeats: Math.max(2, Math.min(20, input.maxSeats || 6)),
            accentColor: input.accentColor || "#FACC15",
            participants: [],
            active: true,
          })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast(`Mesa "${cleanName}" criada!`, undefined, "success");
          })
          .catch((err) =>
            pushToast("Erro ao criar mesa", extractPbError(err, "Sem permissão."), "danger")
          );
        return;
      }

      setState((prev) => ({
        ...prev,
        studyRooms: [
          ...prev.studyRooms,
          {
            id: uid("room"),
            name: cleanName,
            topic: input.topic.trim(),
            maxSeats: Math.max(2, Math.min(20, input.maxSeats || 6)),
            accentColor: input.accentColor || "#FACC15",
            participantIds: [],
          },
        ],
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  const updateStudyRoom = useCallback(
    (
      roomId: string,
      updates: Partial<Pick<StudyRoom, "name" | "topic" | "maxSeats" | "accentColor">>
    ) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("study_rooms")
          .update(roomId, updates)
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Mesa atualizada!", updates.name, "success");
          })
          .catch((err) =>
            pushToast("Erro ao atualizar mesa", extractPbError(err, "Sem permissão."), "danger")
          );
        return;
      }

      setState((prev) => ({
        ...prev,
        studyRooms: prev.studyRooms.map((r) =>
          r.id === roomId ? { ...r, ...updates } : r
        ),
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  const deleteStudyRoom = useCallback(
    (roomId: string) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("study_rooms")
          .delete(roomId)
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Mesa encerrada", undefined, "warning");
          })
          .catch((err) =>
            pushToast("Erro ao remover mesa", extractPbError(err, "Sem permissão."), "danger")
          );
        return;
      }

      setState((prev) => ({
        ...prev,
        studyRooms: prev.studyRooms.filter((r) => r.id !== roomId),
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  const joinStudyRoom = useCallback(
    (roomId: string) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.send<{ roomName?: string }>(`/api/loloverse/study-rooms/${roomId}/join`, {
          method: "POST",
        })
          .then((res) => {
            loadFromPocketBase().catch(() => {});
            pushToast(`Você entrou em "${res.roomName || "Mesa"}"`, undefined, "success");
          })
          .catch((err) =>
            pushToast("Não foi possível entrar", extractPbError(err, "Mesa cheia."), "warning")
          );
        return;
      }

      const acc = currentAccountRef.current;
      if (!acc) return;
      setState((prev) => ({
        ...prev,
        studyRooms: prev.studyRooms.map((r) => {
          const withoutMe = r.participantIds.filter((id) => id !== acc.id);
          if (r.id === roomId && withoutMe.length < r.maxSeats) {
            return { ...r, participantIds: [...withoutMe, acc.id] };
          }
          return { ...r, participantIds: withoutMe };
        }),
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  const leaveStudyRoom = useCallback(() => {
    if (isPocketBaseEnabled) {
      const pb = getPocketBase();
      if (!pb) return;
      pb.send("/api/loloverse/study-rooms/leave", { method: "POST" })
        .then(() => {
          loadFromPocketBase().catch(() => {});
          pushToast("Saiu da mesa de estudo", undefined, "info");
        })
        .catch(() => {});
      return;
    }

    const acc = currentAccountRef.current;
    if (!acc) return;
    setState((prev) => ({
      ...prev,
      studyRooms: prev.studyRooms.map((r) => ({
        ...r,
        participantIds: r.participantIds.filter((id) => id !== acc.id),
      })),
    }));
  }, [loadFromPocketBase, pushToast]);

  const updateMyStudyStatus = useCallback(
    (onlineStatus: Student["onlineStatus"], studyActivity: string) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.send("/api/loloverse/presence", {
          method: "POST",
          body: { onlineStatus, studyActivity },
        })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Status atualizado!", studyActivity.trim() || undefined, "info");
          })
          .catch(() => {});
        return;
      }

      const acc = currentAccountRef.current;
      if (!acc?.studentId) return;
      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === acc.studentId ? { ...s, onlineStatus, studyActivity } : s
        ),
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  // ===========================================================================
  // COORDENAÇÃO & GOVERNANÇA
  // ===========================================================================
  const toggleRewardApproval = useCallback(
    (rewardId: string) => {
      const target = stateRef.current.rewards.find((r) => r.id === rewardId);
      if (!target) return;
      const approvedNow = !target.approved;

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("shop_rewards")
          .update(rewardId, { approved: approvedNow })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast(
              approvedNow ? "Recompensa liberada" : "Recompensa pausada",
              target.title,
              approvedNow ? "success" : "warning"
            );
          })
          .catch((err) =>
            pushToast("Erro na Lojinha", extractPbError(err, "Sem permissão."), "danger")
          );
        return;
      }

      setState((prev) => ({
        ...prev,
        rewards: prev.rewards.map((r) =>
          r.id === rewardId ? { ...r, approved: approvedNow } : r
        ),
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  const updateRewardCost = useCallback(
    (rewardId: string, newCost: number) => {
      const clamped = Math.max(10, Math.min(5000, newCost));
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("shop_rewards")
          .update(rewardId, { cost: clamped })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Preço atualizado", `${clamped} Ouro`, "info");
          })
          .catch((err) =>
            pushToast("Erro ao atualizar preço", extractPbError(err, "Sem permissão."), "danger")
          );
        return;
      }

      setState((prev) => ({
        ...prev,
        rewards: prev.rewards.map((r) =>
          r.id === rewardId ? { ...r, cost: clamped } : r
        ),
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  const createReward = useCallback(
    (input: {
      title: string;
      description: string;
      cost: number;
      category: ShopReward["category"];
      stockLimit: number;
    }) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("shop_rewards")
          .create({
            title: input.title.trim(),
            description: input.description.trim(),
            cost: Math.max(10, input.cost),
            category: input.category,
            iconName: "Gift",
            approved: true,
            stockLimit: Math.max(1, input.stockLimit),
            redeemedCount: 0,
          })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Nova recompensa criada!", input.title, "success");
          })
          .catch((err) =>
            pushToast("Erro ao criar recompensa", extractPbError(err, "Sem permissão."), "danger")
          );
        return;
      }

      const newReward: ShopReward = {
        id: uid("rew"),
        title: input.title.trim(),
        description: input.description.trim(),
        cost: Math.max(10, input.cost),
        category: input.category,
        iconName: "Gift",
        approved: true,
        stockLimit: Math.max(1, input.stockLimit),
        redeemedCount: 0,
      };
      setState((prev) => ({ ...prev, rewards: [newReward, ...prev.rewards] }));
    },
    [loadFromPocketBase, pushToast]
  );

  const registerIntervention = useCallback(
    (studentId: string, note: string, restoreHp = 15) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.send("/api/loloverse/interventions", {
          method: "POST",
          body: { studentId, note, restoreHp },
        })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Intervenção registrada!", `+${restoreHp} HP de apoio.`, "success");
          })
          .catch((err) =>
            pushToast("Erro na intervenção", extractPbError(err, "Sem permissão."), "danger")
          );
        return;
      }

      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId
            ? {
                ...s,
                hp: Math.min(s.maxHp, s.hp + restoreHp),
                interventionsCount: s.interventionsCount + 1,
                lastInterventionNote: note.trim() || "Plano de acolhimento iniciado.",
              }
            : s
        ),
      }));
    },
    [loadFromPocketBase, pushToast]
  );

  // ===========================================================================
  // OFICINA DO PERSONAGEM & PERCURSO DINÂMICO (AVALIAÇÃO 3D + RUBRICA 4D)
  // ===========================================================================
  const updateAvatarProfile = useCallback(
    (studentId: string, avatarConfig: AvatarConfig, roleTitle: string) => {
      const cleanTitle = roleTitle.trim() || "Aventureiro(a) Maker";
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.send("/api/loloverse/profile/avatar", {
          method: "POST",
          body: { avatarConfig, roleTitle: cleanTitle },
        })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Personagem atualizado!", cleanTitle, "success");
          })
          .catch((err) =>
            pushToast(
              "Erro ao salvar personagem",
              extractPbError(err, "Tente novamente."),
              "danger"
            )
          );
        return;
      }

      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === studentId
            ? {
                ...s,
                avatarConfig,
                avatarColor: avatarConfig.bgColor,
                roleTitle: cleanTitle,
              }
            : s
        ),
        accounts: prev.accounts.map((a) =>
          a.studentId === studentId
            ? {
                ...a,
                avatarConfig,
                avatarColor: avatarConfig.bgColor,
                bio: cleanTitle,
              }
            : a
        ),
      }));
      pushToast("Personagem salvo na Oficina!", cleanTitle, "success");
    },
    [loadFromPocketBase, pushToast]
  );

  const createDynamicPath = useCallback(
    (input: {
      classId: string;
      title: string;
      drivingQuestion: string;
      bnccSummary: string;
      gradingMode: PathGradingMode;
      gradeWeight: number;
      culminationDate: string;
      disciplinaryTitle: string;
    }): string | null => {
      const cleanTitle = input.title.trim();
      if (!cleanTitle) return null;

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return null;
        pb.collection("dynamic_paths")
          .create({
            class: input.classId,
            title: cleanTitle,
            drivingQuestion: input.drivingQuestion.trim(),
            bnccSummary: input.bnccSummary.trim(),
            currentCycle: "ciclo1",
            gradingMode: input.gradingMode,
            gradeWeight:
              input.gradingMode === "formativo"
                ? 0
                : Math.max(0, Math.min(100, input.gradeWeight)),
            culminationDate: input.culminationDate.trim() || "A definir",
            disciplinaryTitle:
              input.disciplinaryTitle.trim() || "Jovem Cientista",
            active: true,
          })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Percurso Dinâmico criado!", cleanTitle, "success");
          })
          .catch((err) =>
            pushToast(
              "Erro ao criar Percurso",
              extractPbError(err, "Verifique permissões."),
              "danger"
            )
          );
        return null;
      }

      const id = uid("path");
      const newPath: DynamicPath = {
        id,
        classId: input.classId,
        title: cleanTitle,
        drivingQuestion: input.drivingQuestion.trim(),
        bnccSummary: input.bnccSummary.trim(),
        currentCycle: "ciclo1",
        gradingMode: input.gradingMode,
        gradeWeight:
          input.gradingMode === "formativo"
            ? 0
            : Math.max(0, Math.min(100, input.gradeWeight)),
        culminationDate: input.culminationDate.trim() || "A definir",
        disciplinaryTitle: input.disciplinaryTitle.trim() || "Jovem Cientista",
        active: true,
      };
      setState((prev) => ({
        ...prev,
        dynamicPaths: [newPath, ...prev.dynamicPaths],
        logs: [
          {
            id: uid("log"),
            timestamp: nowLabel(),
            actor: currentAccountRef.current?.displayName || "Docente",
            target: cleanTitle,
            action: `Criou Percurso Dinâmico (${input.gradingMode})`,
            category: "percurso" as const,
            deltaSummary:
              input.gradingMode === "formativo"
                ? "Formativo (0% nota)"
                : input.gradingMode === "ponderado"
                ? `Peso ${newPath.gradeWeight}% opt-in`
                : `Bônus +${(newPath.gradeWeight / 10).toFixed(1)}`,
          },
          ...prev.logs,
        ].slice(0, 60),
      }));
      pushToast("Percurso Dinâmico criado!", cleanTitle, "success");
      return id;
    },
    [loadFromPocketBase, pushToast]
  );

  const addPathStep = useCallback(
    (input: {
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
    }) => {
      const cleanTitle = input.title.trim();
      if (!cleanTitle) return;
      const existingCount = stateRef.current.pathSteps.filter(
        (s) => s.pathId === input.pathId
      ).length;

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("path_steps")
          .create({
            path: input.pathId,
            cycle: input.cycle,
            stepFormat: input.stepFormat,
            scope: input.scope,
            title: cleanTitle,
            description: input.description.trim(),
            guidingQuestions: input.guidingQuestions || [],
            bnccAttr: input.bnccAttr,
            requiresEvidence: input.requiresEvidence,
            dueDate: input.dueDate.trim() || "Esta semana",
            sortOrder: existingCount + 1,
            status: "aberta",
          })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Etapa adicionada ao Percurso!", cleanTitle, "success");
          })
          .catch((err) =>
            pushToast(
              "Erro ao adicionar etapa",
              extractPbError(err, "Tente novamente."),
              "danger"
            )
          );
        return;
      }

      const newStep: PathStep = {
        id: uid("step"),
        pathId: input.pathId,
        cycle: input.cycle,
        stepFormat: input.stepFormat,
        scope: input.scope,
        title: cleanTitle,
        description: input.description.trim(),
        guidingQuestions: input.guidingQuestions,
        bnccAttr: input.bnccAttr,
        requiresEvidence: input.requiresEvidence,
        dueDate: input.dueDate.trim() || "Esta semana",
        sortOrder: existingCount + 1,
        status: "aberta",
      };
      setState((prev) => ({
        ...prev,
        pathSteps: [...prev.pathSteps, newStep],
      }));
      pushToast("Etapa adicionada!", cleanTitle, "success");
    },
    [loadFromPocketBase, pushToast]
  );

  const advancePathCycle = useCallback(
    (pathId: string, nextCycle: PathStatus) => {
      const path = stateRef.current.dynamicPaths.find((p) => p.id === pathId);
      if (!path) return;

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        const req =
          nextCycle === "concluido"
            ? pb.send(`/api/loloverse/paths/${pathId}/culminate`, {
                method: "POST",
              })
            : pb
                .collection("dynamic_paths")
                .update(pathId, { currentCycle: nextCycle });
        req
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast(
              nextCycle === "concluido"
                ? "Mostra Pública concluída!"
                : "Ciclo do Percurso atualizado!",
              path.title,
              "success"
            );
          })
          .catch((err) =>
            pushToast(
              "Erro ao avançar ciclo",
              extractPbError(err, "Tente novamente."),
              "danger"
            )
          );
        return;
      }

      setState((prev) => {
        const participantIds = new Set(
          prev.pathSubmissions
            .filter((sub) => sub.pathId === pathId)
            .map((sub) => sub.studentId)
        );
        const nextStudents =
          nextCycle === "concluido"
            ? prev.students.map((s) => {
                if (s.classId !== path.classId) return s;
                if (participantIds.size > 0 && !participantIds.has(s.id)) {
                  return s;
                }
                const nextTitles = Array.from(
                  new Set([...(s.unlockedTitles || []), path.disciplinaryTitle])
                );
                const updated: Student = {
                  ...s,
                  unlockedTitles: nextTitles,
                };
                updated.badges = evaluateAutoBadges(updated, {
                  pathCompleted: true,
                });
                return updated;
              })
            : prev.students;

        return {
          ...prev,
          dynamicPaths: prev.dynamicPaths.map((p) =>
            p.id === pathId ? { ...p, currentCycle: nextCycle } : p
          ),
          students: nextStudents,
        };
      });
      pushToast(
        nextCycle === "concluido"
          ? `Mostra Pública concluída! Título "${path.disciplinaryTitle}" desbloqueado.`
          : `Percurso avançado para ${nextCycle === "ciclo2" ? "Ciclo 2 · Criação & Mostra" : "Ciclo 1 · Exploração & Base"}.`,
        path.title,
        "success"
      );
    },
    [loadFromPocketBase, pushToast]
  );

  const createPathTeams = useCallback(
    (
      pathId: string,
      teams: Array<{
        name: string;
        memberIds: string[];
        roles: Record<string, string>;
      }>,
      createStudyRooms = true
    ) => {
      const path = stateRef.current.dynamicPaths.find((p) => p.id === pathId);
      if (!path || teams.length === 0) return;

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.send(`/api/loloverse/paths/${pathId}/teams`, {
          method: "POST",
          body: { teams, createStudyRooms },
        })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast(
              `${teams.length} equipe(s) organizada(s)!`,
              createStudyRooms
                ? "Mesas de Estudo criadas no Espaço Híbrido."
                : undefined,
              "success"
            );
          })
          .catch((err) =>
            pushToast(
              "Erro ao salvar equipes",
              extractPbError(err, "Tente novamente."),
              "danger"
            )
          );
        return;
      }

      const palette = ["#FACC15", "#3B82F6", "#10B981", "#8B5CF6", "#FB923C"];
      const createdRooms: StudyRoom[] = [];
      const createdTeams: PathTeam[] = teams.map((t, idx) => {
        let studyRoomId: string | undefined;
        if (createStudyRooms) {
          studyRoomId = uid("room");
          createdRooms.push({
            id: studyRoomId,
            name: `${t.name} · Percurso`,
            topic: path.title,
            maxSeats: Math.max(4, t.memberIds.length + 1),
            accentColor: palette[idx % palette.length],
            participantIds: [],
          });
        }
        return {
          id: uid("team"),
          pathId,
          name: t.name,
          memberIds: t.memberIds,
          roles: t.roles,
          studyRoomId,
        };
      });

      setState((prev) => ({
        ...prev,
        pathTeams: [
          ...prev.pathTeams.filter((t) => t.pathId !== pathId),
          ...createdTeams,
        ],
        studyRooms: [...prev.studyRooms, ...createdRooms],
      }));
      pushToast(
        `${createdTeams.length} equipe(s) formada(s)!`,
        createStudyRooms
          ? "Mesas de Estudo abertas no Espaço Híbrido."
          : "Papéis definidos no Percurso Dinâmico.",
        "success"
      );
    },
    [loadFromPocketBase, pushToast]
  );

  const submitPathStep = useCallback(
    (input: {
      pathId: string;
      stepId: string;
      studentId: string;
      teamId?: string;
      artifactFormat?: string;
      content: string;
      attachmentUrl?: string;
    }) => {
      const cleanContent = input.content.trim();
      if (cleanContent.length < 10) {
        pushToast(
          "Evidência muito curta",
          "Escreva pelo menos 10 caracteres explicando seu raciocínio ou entrega.",
          "warning"
        );
        return;
      }

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.send(`/api/loloverse/paths/steps/${input.stepId}/submit`, {
          method: "POST",
          body: {
            artifactFormat: input.artifactFormat || "",
            content: cleanContent,
            attachmentUrl: input.attachmentUrl || "",
            teamId: input.teamId || "",
          },
        })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast(
              "Evidência registrada no Percurso!",
              "+35 XP · +15 Ouro · +5 HP · Evolução BNCC",
              "success"
            );
          })
          .catch((err) =>
            pushToast(
              "Erro ao enviar evidência",
              extractPbError(err, "Tente novamente."),
              "danger"
            )
          );
        return;
      }

      const step = stateRef.current.pathSteps.find((s) => s.id === input.stepId);
      if (!step) return;
      const today = todayIso();
      const submission: PathSubmission = {
        id: uid("sub"),
        pathId: input.pathId,
        stepId: input.stepId,
        studentId: input.studentId,
        teamId: input.teamId,
        artifactFormat: input.artifactFormat?.trim() || undefined,
        content: cleanContent,
        attachmentUrl: input.attachmentUrl?.trim() || undefined,
        status: "enviado",
        timestamp: nowLabel(),
      };

      setState((prev) => ({
        ...prev,
        pathSubmissions: [
          submission,
          ...prev.pathSubmissions.filter(
            (s) =>
              !(s.stepId === input.stepId && s.studentId === input.studentId)
          ),
        ],
        students: prev.students.map((s) => {
          if (s.id !== input.studentId) return s;
          let nextXp = s.xp + 35;
          let nextLevel = s.level;
          let nextXpToNext = s.xpToNext;
          while (nextXp >= nextXpToNext) {
            nextXp -= nextXpToNext;
            nextLevel += 1;
            nextXpToNext += 50;
          }
          const shouldAdvanceStreak = s.lastStreakDate !== today;
          const nextBncc = boostBnccGrowthOnly(
            s.bnccAttributes,
            step.bnccAttr,
            1,
            1
          );
          const updated: Student = {
            ...s,
            xp: nextXp,
            level: nextLevel,
            xpToNext: nextXpToNext,
            gold: s.gold + 15,
            hp: Math.min(s.maxHp, s.hp + 5),
            deliveryRate: Math.min(100, s.deliveryRate + 2),
            streakDays: shouldAdvanceStreak ? s.streakDays + 1 : s.streakDays,
            lastStreakDate: today,
            bnccAttributes: nextBncc,
            topSpecialties: getTopSpecialties(nextBncc, 2),
          };
          updated.badges = evaluateAutoBadges(updated, { submittedPath: true });
          return updated;
        }),
        studentFeed: [
          {
            id: uid("feed"),
            studentId: input.studentId,
            timestamp: nowLabel(),
            title: `Percurso Dinâmico · ${step.title}`,
            detail: "Evidência registrada e disponível para devolutiva docente.",
            deltaSummary: `+35 XP · +15 Ouro · +5 HP · +1 ${step.bnccAttr.toUpperCase()}`,
            variant: "path" as const,
          },
          ...prev.studentFeed,
        ].slice(0, 80),
      }));
      pushToast(
        "Evidência enviada!",
        `+35 XP · +15 Ouro · +5 HP · +1 ${step.bnccAttr.toUpperCase()}`,
        "success"
      );
    },
    [loadFromPocketBase, pushToast]
  );

  const reviewPathSubmission = useCallback(
    (
      submissionId: string,
      status: PathSubmission["status"],
      teacherFeedback: string
    ) => {
      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.collection("path_submissions")
          .update(submissionId, {
            status,
            teacherFeedback: teacherFeedback.trim(),
          })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast("Devolutiva salva!", undefined, "success");
          })
          .catch((err) =>
            pushToast(
              "Erro ao salvar devolutiva",
              extractPbError(err, "Tente novamente."),
              "danger"
            )
          );
        return;
      }

      const sub = stateRef.current.pathSubmissions.find(
        (s) => s.id === submissionId
      );
      setState((prev) => ({
        ...prev,
        pathSubmissions: prev.pathSubmissions.map((s) =>
          s.id === submissionId
            ? { ...s, status, teacherFeedback: teacherFeedback.trim() }
            : s
        ),
        studentFeed: sub
          ? [
              {
                id: uid("feed"),
                studentId: sub.studentId,
                timestamp: nowLabel(),
                title:
                  status === "validado"
                    ? "Evidência Validada pelo Professor!"
                    : "Sugestão de Revisão no Percurso",
                detail:
                  teacherFeedback.trim() ||
                  "Confira a devolutiva na etapa do Percurso Dinâmico.",
                variant: "path" as const,
              },
              ...prev.studentFeed,
            ].slice(0, 80)
          : prev.studentFeed,
      }));
      pushToast("Devolutiva registrada!", undefined, "success");
    },
    [loadFromPocketBase, pushToast]
  );

  const evaluateStudentPath = useCallback(
    (input: {
      pathId: string;
      studentId: string;
      rigorLevel: RubricLevel;
      evidenceLevel: RubricLevel;
      authorshipLevel: RubricLevel;
      collaborationLevel: RubricLevel;
      qualitativeNote: string;
      publishToGradebook?: boolean;
    }) => {
      const path = stateRef.current.dynamicPaths.find(
        (p) => p.id === input.pathId
      );
      const student = stateRef.current.students.find(
        (s) => s.id === input.studentId
      );
      if (!path || !student) return;

      const suggestedScore = computeSuggestedRubricScore(input);
      const shouldPublish =
        Boolean(input.publishToGradebook) && path.gradingMode !== "formativo";

      if (isPocketBaseEnabled) {
        const pb = getPocketBase();
        if (!pb) return;
        pb.send(`/api/loloverse/paths/${input.pathId}/evaluate`, {
          method: "POST",
          body: {
            studentId: input.studentId,
            rigorLevel: input.rigorLevel,
            evidenceLevel: input.evidenceLevel,
            authorshipLevel: input.authorshipLevel,
            collaborationLevel: input.collaborationLevel,
            qualitativeNote: input.qualitativeNote.trim(),
            publishToGradebook: shouldPublish,
          },
        })
          .then(() => {
            loadFromPocketBase().catch(() => {});
            pushToast(
              shouldPublish
                ? "Rubrica salva e lançada no Diário!"
                : "Rubrica 4D salva (média oficial intacta)!",
              `${student.name} · Nota sugerida: ${suggestedScore.toFixed(1)}`,
              "success"
            );
          })
          .catch((err) =>
            pushToast(
              "Erro ao salvar rubrica",
              extractPbError(err, "Tente novamente."),
              "danger"
            )
          );
        return;
      }

      // Mapeia os 4 níveis da rubrica para pisos mínimos na escala RPG 1..20 (crescimento não-punitivo!)
      const levelFloor: Record<RubricLevel, number> = {
        1: 4,
        2: 9,
        3: 14,
        4: 18,
      };
      const evalRec: PathEvaluation = {
        id: uid("eval"),
        pathId: input.pathId,
        studentId: input.studentId,
        rigorLevel: input.rigorLevel,
        evidenceLevel: input.evidenceLevel,
        authorshipLevel: input.authorshipLevel,
        collaborationLevel: input.collaborationLevel,
        suggestedScore,
        qualitativeNote: input.qualitativeNote.trim() || undefined,
        publishedToGradebook: shouldPublish,
        publishedAt: shouldPublish ? nowLabel() : undefined,
        updatedAt: nowLabel(),
      };

      setState((prev) => {
        const nextStudents = prev.students.map((s) => {
          if (s.id !== input.studentId) return s;
          // Atributos BNCC evoluem de forma não-punitiva (nunca caem abaixo do atual)
          const raiseTo = (
            attrs: BnccAttributes,
            key: BnccAttributeKey,
            targetVal: number
          ): BnccAttributes => {
            const cur = attrs[key] || { value: 0, evidenceCount: 0 };
            const nextV = Math.max(
              cur.value,
              Math.min(20, Math.max(targetVal, cur.value + (targetVal >= 14 ? 1 : 0)))
            );
            return {
              ...attrs,
              [key]: { value: nextV, evidenceCount: cur.evidenceCount + 1 },
            };
          };

          let attrs = { ...s.bnccAttributes };
          attrs = raiseTo(attrs, "con", levelFloor[input.rigorLevel]);
          attrs = raiseTo(attrs, "inv", levelFloor[input.evidenceLevel]);
          attrs = raiseTo(attrs, "exp", levelFloor[input.authorshipLevel]);
          attrs = raiseTo(attrs, "elo", levelFloor[input.collaborationLevel]);
          attrs = raiseTo(
            attrs,
            "arg",
            Math.round(
              (levelFloor[input.evidenceLevel] +
                levelFloor[input.collaborationLevel]) /
                2
            )
          );

          // Ponte Opt-In de Nota: só toca bimesterAverage se professor clicou Validar e Lançar
          let nextAverage = s.bimesterAverage;
          if (shouldPublish) {
            if (path.gradingMode === "ponderado" && path.gradeWeight > 0) {
              const w = Math.min(100, path.gradeWeight) / 100;
              nextAverage = Number(
                Math.min(10, Math.max(0, s.bimesterAverage * (1 - w) + suggestedScore * w)).toFixed(1)
              );
            } else if (path.gradingMode === "bonus" && path.gradeWeight > 0) {
              const maxBonus = path.gradeWeight / 10;
              const earned = Number(((suggestedScore / 10) * maxBonus).toFixed(1));
              nextAverage = Number(Math.min(10, s.bimesterAverage + earned).toFixed(1));
            }
          }

          const updated: Student = {
            ...s,
            bimesterAverage: nextAverage,
            bnccAttributes: attrs,
            topSpecialties: getTopSpecialties(attrs, 2),
          };
          updated.badges = evaluateAutoBadges(updated);
          return updated;
        });

        const newGradeComponents: GradeComponent[] = shouldPublish
          ? [
              {
                id: uid("gc"),
                studentId: input.studentId,
                bimester: "3º Bimestre",
                sourceType: path.gradingMode === "bonus" ? "bonus" : "percurso",
                sourceId: path.id,
                label: `Percurso: ${path.title}`,
                score: suggestedScore,
                weight: path.gradeWeight,
                timestamp: nowLabel(),
              },
              ...prev.gradeComponents,
            ]
          : prev.gradeComponents;

        return {
          ...prev,
          students: nextStudents,
          pathEvaluations: [
            evalRec,
            ...prev.pathEvaluations.filter(
              (e) =>
                !(e.pathId === input.pathId && e.studentId === input.studentId)
            ),
          ],
          gradeComponents: newGradeComponents,
          studentFeed: [
            {
              id: uid("feed"),
              studentId: input.studentId,
              timestamp: nowLabel(),
              title: `Avaliação do Percurso · ${path.title}`,
              detail:
                input.qualitativeNote.trim() ||
                "Rubrica 4D atualizada na sua ficha de atributos BNCC.",
              deltaSummary: shouldPublish
                ? `Atributos BNCC atualizados · Lançado no Diário (${suggestedScore.toFixed(1)})`
                : `Atributos BNCC atualizados · Formativo`,
              variant: "bncc" as const,
            },
            ...prev.studentFeed,
          ].slice(0, 80),
          logs: [
            {
              id: uid("log"),
              timestamp: nowLabel(),
              actor: currentAccountRef.current?.displayName || "Docente",
              target: student.name,
              action: shouldPublish
                ? `Validou Rubrica 4D e lançou no Diário (${path.title})`
                : `Registrou Rubrica 4D formativa (${path.title})`,
              category: "avaliacao" as const,
              deltaSummary: shouldPublish
                ? `Nota Percurso ${suggestedScore.toFixed(1)} lançada`
                : `Formativo (${suggestedScore.toFixed(1)} · média intacta)`,
            },
            ...prev.logs,
          ].slice(0, 60),
        };
      });

      pushToast(
        shouldPublish
          ? "Rubrica validada e lançada no Diário!"
          : "Rubrica 4D salva (média oficial intacta)!",
        `${student.name} · Conceito ${suggestedScore.toFixed(1)}`,
        "success"
      );
    },
    [loadFromPocketBase, pushToast]
  );

  const resetDemoData = useCallback(() => {
    if (isPocketBaseEnabled) return;
    setState(INITIAL_STATE);
    persistSession(null);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignora erro
    }
    pushToast("Demonstração restaurada", undefined, "info");
  }, [persistSession, pushToast]);

  const value: LoloverseContextValue = {
    state,
    invites,
    isBackendConnected: isPocketBaseEnabled,
    currentAccount,
    persona,
    login,
    loginWithGoogle,
    completeGoogleCallback,
    verifyInvite,
    acceptInviteWithPassword,
    generateInvites,
    resendInviteEmail,
    revokeInvite,
    refreshData,
    registerAccount,
    logout,
    setSelectedClassId,
    updateAttendance,
    applyBehaviorFeedback,
    createQuest,
    toggleQuestActive,
    completeQuestAsStudent,
    redeemReward,
    createCategory,
    createChannel,
    updateChannel,
    createTopic,
    updateTopic,
    sendChatMessage,
    toggleReaction,
    togglePinMessage,
    createStudyRoom,
    updateStudyRoom,
    deleteStudyRoom,
    joinStudyRoom,
    leaveStudyRoom,
    updateMyStudyStatus,
    toggleRewardApproval,
    updateRewardCost,
    createReward,
    registerIntervention,
    updateAvatarProfile,
    createDynamicPath,
    addPathStep,
    advancePathCycle,
    createPathTeams,
    submitPathStep,
    reviewPathSubmission,
    evaluateStudentPath,
    resetDemoData,
    toasts,
    dismissToast,
    hydrated,
  };

  return (
    <LoloverseContext.Provider value={value}>
      {children}
    </LoloverseContext.Provider>
  );
}

export function useLoloverse() {
  const ctx = useContext(LoloverseContext);
  if (!ctx) {
    throw new Error("useLoloverse deve ser usado dentro de LoloverseProvider");
  }
  return ctx;
}

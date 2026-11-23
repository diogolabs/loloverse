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
  Account,
  ActivityLog,
  AttendanceStatus,
  BehaviorPreset,
  ChannelTopic,
  LoloverseState,
  EngagementPillar,
  Persona,
  Quest,
  QuestType,
  ShopReward,
  Student,
  StudyRoom,
  ToastItem,
} from "@/types";

const STORAGE_KEY = "loloverse_mvp_state_v4";
const SESSION_KEY = "loloverse_session_account_id_v4";

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

interface RegisterInput {
  displayName: string;
  username: string;
  password: string;
  role: Persona;
  classId?: string;
}

interface LoloverseContextValue {
  state: LoloverseState;
  currentAccount: Account | null;
  persona: Persona;
  login: (identifier: string, password: string) => LoginResult;
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
  // Espaço Híbrido (Categorias, Canais, Tópicos, Mensagens & Mesas)
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
  // Coordenação
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
  resetDemoData: () => void;
  toasts: ToastItem[];
  dismissToast: (id: string) => void;
  hydrated: boolean;
}

const LoloverseContext = createContext<LoloverseContextValue | null>(null);

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
  const [state, setState] = useState<LoloverseState>(INITIAL_STATE);
  const stateRef = useRef<LoloverseState>(state);
  stateRef.current = state;

  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const currentAccount = useMemo(
    () => state.accounts.find((a) => a.id === currentAccountId) || null,
    [state.accounts, currentAccountId]
  );

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

  // Hydrate shared DB from localStorage + per-tab session from sessionStorage
  useEffect(() => {
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
          setState({
            ...INITIAL_STATE,
            ...parsed,
          });
        }
      }
      const savedSession = window.sessionStorage.getItem(SESSION_KEY);
      if (savedSession) {
        setCurrentAccountId(savedSession);
      }
    } catch {
      // Ignore storage errors
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist shared DB to localStorage
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state, hydrated]);

  // Real-time cross-tab synchronization
  useEffect(() => {
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
          setState({
            ...INITIAL_STATE,
            ...parsed,
          });
        }
      } catch {
        // Ignore malformed external updates
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persistSession = useCallback((accountId: string | null) => {
    setCurrentAccountId(accountId);
    try {
      if (accountId) {
        window.sessionStorage.setItem(SESSION_KEY, accountId);
      } else {
        window.sessionStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const login = useCallback(
    (identifier: string, password: string): LoginResult => {
      const cleanId = identifier.trim().toLowerCase();
      const cleanPass = password.trim();
      if (!cleanId || !cleanPass) {
        return { ok: false, error: "Informe usuário/e-mail e senha." };
      }

      const found = stateRef.current.accounts.find(
        (acc) =>
          (acc.username.toLowerCase() === cleanId ||
            acc.email.toLowerCase() === cleanId) &&
          acc.password === cleanPass
      );

      if (!found) {
        return {
          ok: false,
          error:
            "Usuário ou senha incorretos. Dica: nas contas de teste a senha padrão é 123.",
        };
      }

      persistSession(found.id);

      setState((prev) => ({
        ...prev,
        selectedClassId: found.classId || prev.selectedClassId,
        activeStudentId: found.studentId || prev.activeStudentId,
        students: found.studentId
          ? prev.students.map((s) =>
              s.id === found.studentId && s.onlineStatus === "offline"
                ? {
                    ...s,
                    onlineStatus: "online",
                    studyActivity: "Acabou de entrar no Loloverse",
                  }
                : s
            )
          : prev.students,
      }));

      pushToast(
        `Bem-vindo(a), ${found.displayName}!`,
        `Sessão iniciada como @${found.username}`,
        "success"
      );

      return { ok: true };
    },
    [persistSession, pushToast]
  );

  const registerAccount = useCallback(
    (input: RegisterInput): LoginResult => {
      const displayName = input.displayName.trim();
      const username = input.username
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "");
      const password = input.password.trim();

      if (displayName.length < 2) {
        return { ok: false, error: "Informe seu nome completo." };
      }
      if (username.length < 3) {
        return {
          ok: false,
          error: "O usuário precisa ter pelo menos 3 caracteres (letras/números).",
        };
      }
      if (password.length < 3) {
        return {
          ok: false,
          error: "Escolha uma senha com pelo menos 3 caracteres.",
        };
      }

      const exists = stateRef.current.accounts.some(
        (a) => a.username.toLowerCase() === username
      );
      if (exists) {
        return {
          ok: false,
          error: `O usuário "@${username}" já existe. Escolha outro.`,
        };
      }

      const seed = stateRef.current.accounts.length + 3;
      const color = AVATAR_PALETTE[seed % AVATAR_PALETTE.length];
      const chosenClassId =
        input.classId || stateRef.current.classes[0]?.id || "class-8a";

      const newStudentId =
        input.role === "student" ? uid("stu") : undefined;

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
        bio:
          input.role === "student"
            ? "Aventureiro(a) Maker"
            : input.role === "teacher"
            ? "Docente Loloverse"
            : "Coordenação Pedagógica",
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
              pillars: {
                proposito: 60,
                maestria: 60,
                criatividade: 65,
                social: 60,
              },
              badges: ["Novo no Loloverse"],
              interventionsCount: 0,
            }
          : null;

      const newLog: ActivityLog = {
        id: uid("log"),
        timestamp: nowLabel(),
        actor: displayName,
        target: `@${username}`,
        action: `Criou nova conta (${
          input.role === "student"
            ? "Aluno"
            : input.role === "teacher"
            ? "Professor"
            : "Coordenador"
        })`,
        category: "conta",
        deltaSummary: newStudent ? "Ficha RPG Nv.1" : "Acesso liberado",
      };

      setState((prev) => ({
        ...prev,
        accounts: [...prev.accounts, newAccount],
        students: newStudent ? [...prev.students, newStudent] : prev.students,
        selectedClassId: newAccount.classId || prev.selectedClassId,
        activeStudentId: newStudentId || prev.activeStudentId,
        logs: [newLog, ...prev.logs].slice(0, 40),
      }));

      persistSession(newAccount.id);

      pushToast(
        "Conta criada com sucesso!",
        `Você entrou como ${displayName} (@${username}).`,
        "success"
      );

      return { ok: true };
    },
    [persistSession, pushToast]
  );

  const logout = useCallback(() => {
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
    pushToast(
      "Sessão encerrada",
      "Escolha ou crie outra conta para testar.",
      "info"
    );
  }, [persistSession, pushToast]);

  const setSelectedClassId = useCallback((classId: string) => {
    setState((prev) => ({ ...prev, selectedClassId: classId }));
  }, []);

  const updateAttendance = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      const target = stateRef.current.students.find((s) => s.id === studentId);
      if (!target) return;
      const actorName =
        currentAccountRef.current?.displayName || "Prof. Rafael Andrade";

      setState((prev) => {
        const students = prev.students.map((s) => {
          if (s.id !== studentId) return s;
          let rateDelta = 0;
          if (s.attendanceToday !== status) {
            if (status === "presente")
              rateDelta = s.attendanceToday === "falta" ? 2 : 1;
            if (status === "falta") rateDelta = -2;
            if (status === "atraso")
              rateDelta = s.attendanceToday === "falta" ? 1 : -1;
          }
          const nextRate = Math.max(
            40,
            Math.min(100, s.attendanceRate + rateDelta)
          );
          const nextHp =
            status === "falta" && s.attendanceToday !== "falta"
              ? Math.max(10, s.hp - 5)
              : status === "presente" && s.attendanceToday === "falta"
              ? Math.min(s.maxHp, s.hp + 5)
              : s.hp;
          return {
            ...s,
            attendanceToday: status,
            attendanceRate: nextRate,
            hp: nextHp,
          };
        });

        const statusMap: Record<AttendanceStatus, string> = {
          presente: "Presente",
          falta: "Falta",
          atraso: "Atraso",
        };

        const newLog: ActivityLog = {
          id: uid("log"),
          timestamp: nowLabel(),
          actor: actorName,
          target: target.name,
          action: `Atualizou frequência para ${statusMap[status]}`,
          category: "frequencia",
          deltaSummary:
            status === "falta"
              ? "-5 HP"
              : status === "presente"
              ? "Presença OK"
              : "Atraso registrado",
        };

        return {
          ...prev,
          students,
          logs: [newLog, ...prev.logs].slice(0, 40),
        };
      });

      const labels: Record<
        AttendanceStatus,
        { text: string; variant: ToastItem["variant"] }
      > = {
        presente: { text: "Presença confirmada", variant: "success" },
        atraso: { text: "Atraso registrado", variant: "warning" },
        falta: { text: "Falta registrada (-5 HP)", variant: "danger" },
      };
      pushToast(
        labels[status].text,
        `${target.name} atualizado no diário de classe.`,
        labels[status].variant
      );
    },
    [pushToast]
  );

  const applyBehaviorFeedback = useCallback(
    (studentId: string, preset: BehaviorPreset) => {
      const target = stateRef.current.students.find((s) => s.id === studentId);
      if (!target) return;
      const actorName =
        currentAccountRef.current?.displayName || "Prof. Rafael Andrade";

      let previewXp = target.xp + preset.xpDelta;
      let previewLevel = target.level;
      let previewXpToNext = target.xpToNext;
      let leveledUp = false;
      while (previewXp >= previewXpToNext) {
        previewXp -= previewXpToNext;
        previewLevel += 1;
        previewXpToNext += 50;
        leveledUp = true;
      }

      setState((prev) => {
        const students = prev.students.map((s) => {
          if (s.id !== studentId) return s;

          let nextXp = s.xp + preset.xpDelta;
          let nextLevel = s.level;
          let nextXpToNext = s.xpToNext;

          while (nextXp >= nextXpToNext) {
            nextXp -= nextXpToNext;
            nextLevel += 1;
            nextXpToNext += 50;
          }

          const nextHp = Math.max(0, Math.min(s.maxHp, s.hp + preset.hpDelta));
          const nextGold = Math.max(0, s.gold + preset.goldDelta);

          const pillarBoost = preset.type === "positive" ? 3 : -2;
          const nextPillars = {
            ...s.pillars,
            [preset.pillar]: Math.max(
              10,
              Math.min(100, s.pillars[preset.pillar] + pillarBoost)
            ),
          };

          return {
            ...s,
            xp: nextXp,
            level: nextLevel,
            xpToNext: nextXpToNext,
            hp: nextHp,
            gold: nextGold,
            pillars: nextPillars,
          };
        });

        const parts: string[] = [];
        if (preset.xpDelta !== 0)
          parts.push(`${preset.xpDelta > 0 ? "+" : ""}${preset.xpDelta} XP`);
        if (preset.goldDelta !== 0)
          parts.push(
            `${preset.goldDelta > 0 ? "+" : ""}${preset.goldDelta} Ouro`
          );
        if (preset.hpDelta !== 0)
          parts.push(`${preset.hpDelta > 0 ? "+" : ""}${preset.hpDelta} HP`);

        const newLog: ActivityLog = {
          id: uid("log"),
          timestamp: nowLabel(),
          actor: actorName,
          target: target.name,
          action: `${
            preset.type === "positive" ? "Concedeu" : "Registrou alerta:"
          } ${preset.label}`,
          category: "comportamento",
          deltaSummary: parts.join(" · "),
        };

        return {
          ...prev,
          students,
          logs: [newLog, ...prev.logs].slice(0, 40),
        };
      });

      const deltaText = [
        preset.xpDelta
          ? `${preset.xpDelta > 0 ? "+" : ""}${preset.xpDelta} XP`
          : "",
        preset.goldDelta
          ? `${preset.goldDelta > 0 ? "+" : ""}${preset.goldDelta} Ouro`
          : "",
        preset.hpDelta
          ? `${preset.hpDelta > 0 ? "+" : ""}${preset.hpDelta} HP`
          : "",
      ]
        .filter(Boolean)
        .join(" · ");

      if (leveledUp) {
        pushToast(
          `LEVEL UP! ${target.name} chegou ao Nível ${previewLevel}!`,
          `${preset.label} (${deltaText})`,
          "success"
        );
      } else {
        pushToast(
          `${preset.label} — ${target.name}`,
          deltaText,
          preset.type === "positive" ? "success" : "danger"
        );
      }
    },
    [pushToast]
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
      const actorName =
        currentAccountRef.current?.displayName || "Prof. Rafael Andrade";
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
        bossTargetPercent:
          input.type === "boss" ? input.bossTargetPercent ?? 85 : undefined,
      };

      setState((prev) => {
        const cls = prev.classes.find((c) => c.id === input.classId);
        const newLog: ActivityLog = {
          id: uid("log"),
          timestamp: nowLabel(),
          actor: actorName,
          target: cls?.name || "Turma",
          action: `Criou missão "${newQuest.title}"`,
          category: "quest",
          deltaSummary: `+${newQuest.xpReward} XP · +${newQuest.goldReward} Ouro`,
        };
        return {
          ...prev,
          quests: [newQuest, ...prev.quests],
          logs: [newLog, ...prev.logs].slice(0, 40),
        };
      });

      pushToast(
        "Nova Quest publicada!",
        `"${input.title}" já está visível para os alunos.`,
        "success"
      );
    },
    [pushToast]
  );

  const toggleQuestActive = useCallback(
    (questId: string) => {
      const target = stateRef.current.quests.find((q) => q.id === questId);
      if (!target) return;
      const nextActive = !target.active;

      setState((prev) => ({
        ...prev,
        quests: prev.quests.map((q) =>
          q.id === questId ? { ...q, active: nextActive } : q
        ),
      }));

      pushToast(
        nextActive ? "Quest ativada" : "Quest pausada",
        target.title,
        nextActive ? "info" : "warning"
      );
    },
    [pushToast]
  );

  const completeQuestAsStudent = useCallback(
    (questId: string, studentId: string) => {
      const quest = stateRef.current.quests.find((q) => q.id === questId);
      const student = stateRef.current.students.find((s) => s.id === studentId);
      if (!quest || !student || quest.completedBy.includes(studentId)) return;

      let previewXp = student.xp + quest.xpReward;
      let previewLevel = student.level;
      let previewXpToNext = student.xpToNext;
      let leveled = false;
      while (previewXp >= previewXpToNext) {
        previewXp -= previewXpToNext;
        previewLevel += 1;
        previewXpToNext += 50;
        leveled = true;
      }

      setState((prev) => {
        const currentQuest = prev.quests.find((q) => q.id === questId);
        const currentStudent = prev.students.find((s) => s.id === studentId);
        if (
          !currentQuest ||
          !currentStudent ||
          currentQuest.completedBy.includes(studentId)
        ) {
          return prev;
        }

        const quests = prev.quests.map((q) =>
          q.id === questId
            ? { ...q, completedBy: [...q.completedBy, studentId] }
            : q
        );

        let nextXp = currentStudent.xp + currentQuest.xpReward;
        let nextLevel = currentStudent.level;
        let nextXpToNext = currentStudent.xpToNext;
        while (nextXp >= nextXpToNext) {
          nextXp -= nextXpToNext;
          nextLevel += 1;
          nextXpToNext += 50;
        }

        const students = prev.students.map((s) => {
          if (s.id !== studentId) return s;
          return {
            ...s,
            xp: nextXp,
            level: nextLevel,
            xpToNext: nextXpToNext,
            gold: s.gold + currentQuest.goldReward,
            hp: Math.min(s.maxHp, s.hp + 4),
            deliveryRate: Math.min(100, s.deliveryRate + 2),
            streakDays: s.streakDays + 1,
            pillars: {
              ...s.pillars,
              [currentQuest.pillar]: Math.min(
                100,
                s.pillars[currentQuest.pillar] + 4
              ),
            },
          };
        });

        const newLog: ActivityLog = {
          id: uid("log"),
          timestamp: nowLabel(),
          actor: currentStudent.name,
          target: currentQuest.title,
          action: "Concluiu missão no Quadro RPG",
          category: "quest",
          deltaSummary: `+${currentQuest.xpReward} XP · +${currentQuest.goldReward} Ouro`,
        };

        return {
          ...prev,
          quests,
          students,
          logs: [newLog, ...prev.logs].slice(0, 40),
        };
      });

      pushToast(
        leveled
          ? `Missão concluída + Nível ${previewLevel}!`
          : `Missão concluída: ${quest.title}`,
        `+${quest.xpReward} XP · +${quest.goldReward} Ouro · +4 HP`,
        "success"
      );
    },
    [pushToast]
  );

  const redeemReward = useCallback(
    (rewardId: string, studentId: string) => {
      const reward = stateRef.current.rewards.find((r) => r.id === rewardId);
      const student = stateRef.current.students.find((s) => s.id === studentId);
      if (!reward || !student) return;

      if (!reward.approved) {
        pushToast(
          "Recompensa em revisão",
          "Aguardando aprovação da coordenação.",
          "info"
        );
        return;
      }
      if (reward.redeemedCount >= reward.stockLimit) {
        pushToast(
          "Recompensa esgotada",
          "Converse com o coordenador para repor o lote.",
          "warning"
        );
        return;
      }
      if (student.gold < reward.cost) {
        pushToast(
          "Ouro insuficiente!",
          `Você precisa de ${reward.cost} Ouro para "${reward.title}".`,
          "warning"
        );
        return;
      }

      setState((prev) => {
        const currReward = prev.rewards.find((r) => r.id === rewardId);
        const currStudent = prev.students.find((s) => s.id === studentId);
        if (
          !currReward ||
          !currStudent ||
          !currReward.approved ||
          currReward.redeemedCount >= currReward.stockLimit ||
          currStudent.gold < currReward.cost
        ) {
          return prev;
        }

        const students = prev.students.map((s) =>
          s.id === studentId ? { ...s, gold: s.gold - currReward.cost } : s
        );

        const rewards = prev.rewards.map((r) =>
          r.id === rewardId ? { ...r, redeemedCount: r.redeemedCount + 1 } : r
        );

        const newRedemption = {
          id: uid("red"),
          studentId: currStudent.id,
          studentName: currStudent.name,
          classId: currStudent.classId,
          rewardId: currReward.id,
          rewardTitle: currReward.title,
          cost: currReward.cost,
          timestamp: nowLabel(),
          status: "pendente" as const,
        };

        const newLog: ActivityLog = {
          id: uid("log"),
          timestamp: nowLabel(),
          actor: currStudent.name,
          target: "Lojinha da Turma",
          action: `Resgatou "${currReward.title}"`,
          category: "loja",
          deltaSummary: `-${currReward.cost} Ouro`,
        };

        return {
          ...prev,
          students,
          rewards,
          redemptions: [newRedemption, ...prev.redemptions],
          logs: [newLog, ...prev.logs].slice(0, 40),
        };
      });

      pushToast(
        "Recompensa resgatada!",
        `"${reward.title}" (-${reward.cost} Ouro). Voucher gerado!`,
        "success"
      );
    },
    [pushToast]
  );

  // --- ESPAÇO HÍBRIDO (Categorias, Canais, Tópicos, Mensagens & Mesas) ---

  const createCategory = useCallback(
    (name: string, color: string) => {
      const cleanName = name.trim();
      if (!cleanName) return;
      const actorName = currentAccountRef.current?.displayName || "Docente";

      const newCat = {
        id: uid("cat"),
        name: cleanName,
        color: color || "#3B82F6",
      };

      const newLog: ActivityLog = {
        id: uid("log"),
        timestamp: nowLabel(),
        actor: actorName,
        target: cleanName,
        action: "Criou categoria no Espaço Híbrido",
        category: "espaco",
        deltaSummary: "Nova Categoria",
      };

      setState((prev) => ({
        ...prev,
        categories: [...prev.categories, newCat],
        logs: [newLog, ...prev.logs].slice(0, 40),
      }));

      pushToast(
        `Categoria "${cleanName}" criada!`,
        "Agora você pode adicionar canais organizados dentro dela.",
        "success"
      );
    },
    [pushToast]
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

      const actorName = currentAccountRef.current?.displayName || "Docente";
      const channelId = uid("ch");
      const welcomeTopicId = uid("top");

      const newChannel = {
        id: channelId,
        categoryId,
        slug: `#${slug}`,
        label: slug,
        title: cleanTitle,
        description:
          description.trim() ||
          "Canal organizado em tópicos para discussões e aprendizados da turma.",
        staffOnlyTopics,
      };

      const starterTopic: ChannelTopic = {
        id: welcomeTopicId,
        channelId,
        title: `Boas-vindas: ${cleanTitle}`,
        summary:
          description.trim() ||
          "Primeiro tópico aberto para organizar ideias e dúvidas deste canal.",
        createdBy: actorName,
        createdAt: nowLabel(),
        pinned: true,
        pillar: "social",
      };

      const newLog: ActivityLog = {
        id: uid("log"),
        timestamp: nowLabel(),
        actor: actorName,
        target: cleanTitle,
        action: "Criou canal no Espaço Híbrido",
        category: "espaco",
        deltaSummary: `#${slug}`,
      };

      setState((prev) => ({
        ...prev,
        channels: [...prev.channels, newChannel],
        topics: [starterTopic, ...prev.topics],
        logs: [newLog, ...prev.logs].slice(0, 40),
      }));

      pushToast(
        `Canal "${cleanTitle}" criado!`,
        "Já disponível com o primeiro tópico de boas-vindas.",
        "success"
      );
      return channelId;
    },
    [pushToast]
  );

  const updateChannel = useCallback(
    (channelId: string, title: string, description: string) => {
      const cleanTitle = title.trim();
      if (!cleanTitle) return;
      const slug = toSlug(cleanTitle);

      setState((prev) => ({
        ...prev,
        channels: prev.channels.map((ch) =>
          ch.id === channelId
            ? {
                ...ch,
                title: cleanTitle,
                label: slug || ch.label,
                slug: slug ? `#${slug}` : ch.slug,
                description: description.trim() || ch.description,
              }
            : ch
        ),
      }));

      pushToast("Canal atualizado!", cleanTitle, "info");
    },
    [pushToast]
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

      const topicId = uid("top");
      const newTopic: ChannelTopic = {
        id: topicId,
        channelId,
        title: cleanTitle,
        summary:
          summary.trim() ||
          "Discussão guiada aberta para troca de ideias e resolução colaborativa.",
        createdBy: acc.displayName,
        createdAt: nowLabel(),
        pillar,
      };

      const newLog: ActivityLog = {
        id: uid("log"),
        timestamp: nowLabel(),
        actor: acc.displayName,
        target: cleanTitle,
        action: "Abriu novo tópico no Espaço Híbrido",
        category: "espaco",
        deltaSummary: "Novo Tópico",
      };

      setState((prev) => ({
        ...prev,
        topics: [newTopic, ...prev.topics],
        logs: [newLog, ...prev.logs].slice(0, 40),
      }));

      pushToast("Novo tópico aberto!", cleanTitle, "success");
      return topicId;
    },
    [pushToast]
  );

  const updateTopic = useCallback(
    (
      topicId: string,
      updates: Partial<
        Pick<ChannelTopic, "title" | "summary" | "pinned" | "resolved">
      >
    ) => {
      setState((prev) => ({
        ...prev,
        topics: prev.topics.map((t) =>
          t.id === topicId ? { ...t, ...updates } : t
        ),
      }));
      if (updates.resolved !== undefined) {
        pushToast(
          updates.resolved ? "Tópico marcado como resolvido!" : "Tópico reaberto",
          undefined,
          updates.resolved ? "success" : "info"
        );
      } else if (updates.pinned !== undefined) {
        pushToast(
          updates.pinned ? "Tópico fixado no topo" : "Tópico desafixado",
          undefined,
          "info"
        );
      } else {
        pushToast("Tópico atualizado", updates.title, "info");
      }
    },
    [pushToast]
  );

  const sendChatMessage = useCallback(
    (channelId: string, topicId: string, content: string) => {
      const trimmed = content.trim();
      const acc = currentAccountRef.current;
      if (!trimmed || !acc) return;

      const authorRole: "professor" | "aluno" | "coordenador" =
        acc.role === "teacher"
          ? "professor"
          : acc.role === "coordinator"
          ? "coordenador"
          : "aluno";

      setState((prev) => ({
        ...prev,
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
      }));
    },
    []
  );

  const toggleReaction = useCallback((messageId: string, emoji: string) => {
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
        const nextCount = existing.userReacted
          ? existing.count - 1
          : existing.count + 1;
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
  }, []);

  const togglePinMessage = useCallback(
    (messageId: string) => {
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((m) =>
          m.id === messageId ? { ...m, pinned: !m.pinned } : m
        ),
      }));
      pushToast(
        "Destaque atualizado",
        "Status de fixação da mensagem alterado.",
        "info"
      );
    },
    [pushToast]
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
      const actorName = currentAccountRef.current?.displayName || "Docente";

      const newRoom: StudyRoom = {
        id: uid("room"),
        name: cleanName,
        topic: input.topic.trim() || "Estudo colaborativo guiado",
        maxSeats: Math.max(2, Math.min(20, input.maxSeats || 6)),
        accentColor: input.accentColor || "#FACC15",
        participantIds: [],
      };

      const newLog: ActivityLog = {
        id: uid("log"),
        timestamp: nowLabel(),
        actor: actorName,
        target: cleanName,
        action: "Criou nova Mesa de Estudo no Espaço Híbrido",
        category: "espaco",
        deltaSummary: `${newRoom.maxSeats} vagas`,
      };

      setState((prev) => ({
        ...prev,
        studyRooms: [...prev.studyRooms, newRoom],
        logs: [newLog, ...prev.logs].slice(0, 40),
      }));

      pushToast(
        `Mesa "${cleanName}" criada!`,
        `Tema: ${newRoom.topic}`,
        "success"
      );
    },
    [pushToast]
  );

  const updateStudyRoom = useCallback(
    (
      roomId: string,
      updates: Partial<
        Pick<StudyRoom, "name" | "topic" | "maxSeats" | "accentColor">
      >
    ) => {
      const target = stateRef.current.studyRooms.find((r) => r.id === roomId);
      if (!target) return;
      const actorName = currentAccountRef.current?.displayName || "Docente";

      const nextName = updates.name?.trim() || target.name;
      const nextTopic = updates.topic?.trim() || target.topic;

      const newLog: ActivityLog = {
        id: uid("log"),
        timestamp: nowLabel(),
        actor: actorName,
        target: nextName,
        action: `Atualizou tema da Mesa de Estudo para "${nextTopic}"`,
        category: "espaco",
        deltaSummary: "Tema atualizado",
      };

      setState((prev) => ({
        ...prev,
        studyRooms: prev.studyRooms.map((r) =>
          r.id === roomId
            ? {
                ...r,
                name: nextName,
                topic: nextTopic,
                maxSeats: updates.maxSeats
                  ? Math.max(2, Math.min(20, updates.maxSeats))
                  : r.maxSeats,
                accentColor: updates.accentColor || r.accentColor,
              }
            : r
        ),
        logs: [newLog, ...prev.logs].slice(0, 40),
      }));

      pushToast(
        `Mesa "${nextName}" atualizada!`,
        `Novo tema: ${nextTopic}`,
        "success"
      );
    },
    [pushToast]
  );

  const deleteStudyRoom = useCallback(
    (roomId: string) => {
      const target = stateRef.current.studyRooms.find((r) => r.id === roomId);
      if (!target) return;

      setState((prev) => ({
        ...prev,
        studyRooms: prev.studyRooms.filter((r) => r.id !== roomId),
      }));

      pushToast("Mesa encerrada", `"${target.name}" foi removida.`, "warning");
    },
    [pushToast]
  );

  const joinStudyRoom = useCallback(
    (roomId: string) => {
      const acc = currentAccountRef.current;
      if (!acc) return;
      const room = stateRef.current.studyRooms.find((r) => r.id === roomId);
      if (!room) return;

      setState((prev) => ({
        ...prev,
        studyRooms: prev.studyRooms.map((r) => {
          const withoutMe = r.participantIds.filter((id) => id !== acc.id);
          if (r.id === roomId && withoutMe.length < r.maxSeats) {
            return { ...r, participantIds: [...withoutMe, acc.id] };
          }
          return { ...r, participantIds: withoutMe };
        }),
        students: acc.studentId
          ? prev.students.map((s) =>
              s.id === acc.studentId
                ? {
                    ...s,
                    onlineStatus: "em-grupo",
                    studyActivity: `Na mesa: ${room.name}`,
                  }
                : s
            )
          : prev.students,
      }));

      pushToast(
        `Você entrou em "${room.name}"`,
        "Seu status no Espaço Híbrido foi atualizado para Em Grupo.",
        "success"
      );
    },
    [pushToast]
  );

  const leaveStudyRoom = useCallback(() => {
    const acc = currentAccountRef.current;
    if (!acc) return;

    setState((prev) => ({
      ...prev,
      studyRooms: prev.studyRooms.map((r) => ({
        ...r,
        participantIds: r.participantIds.filter((id) => id !== acc.id),
      })),
      students: acc.studentId
        ? prev.students.map((s) =>
            s.id === acc.studentId
              ? {
                  ...s,
                  onlineStatus: "online",
                  studyActivity: "Disponível no Espaço Híbrido",
                }
              : s
          )
        : prev.students,
    }));

    pushToast(
      "Saiu da mesa de estudo",
      "Você voltou para o mural do Espaço Híbrido.",
      "info"
    );
  }, [pushToast]);

  const updateMyStudyStatus = useCallback(
    (onlineStatus: Student["onlineStatus"], studyActivity: string) => {
      const acc = currentAccountRef.current;
      if (!acc?.studentId) return;

      setState((prev) => ({
        ...prev,
        students: prev.students.map((s) =>
          s.id === acc.studentId
            ? {
                ...s,
                onlineStatus,
                studyActivity: studyActivity.trim() || "Estudando no Loloverse",
              }
            : s
        ),
      }));

      pushToast(
        "Status de estudo atualizado!",
        studyActivity.trim() || undefined,
        "info"
      );
    },
    [pushToast]
  );

  const toggleRewardApproval = useCallback(
    (rewardId: string) => {
      const target = stateRef.current.rewards.find((r) => r.id === rewardId);
      if (!target) return;
      const approvedNow = !target.approved;
      const actorName =
        currentAccountRef.current?.displayName || "Coord. Helena Prado";

      setState((prev) => {
        const rewards = prev.rewards.map((r) =>
          r.id === rewardId ? { ...r, approved: approvedNow } : r
        );

        const newLog: ActivityLog = {
          id: uid("log"),
          timestamp: nowLabel(),
          actor: actorName,
          target: target.title,
          action: approvedNow
            ? "Aprovou item na Lojinha da Escola"
            : "Pausou item na Lojinha para revisão pedagógica",
          category: "governanca",
          deltaSummary: approvedNow ? "Aprovado" : "Pausado",
        };

        return {
          ...prev,
          rewards,
          logs: [newLog, ...prev.logs].slice(0, 40),
        };
      });

      pushToast(
        approvedNow ? "Recompensa liberada na Lojinha" : "Recompensa pausada",
        target.title,
        approvedNow ? "success" : "warning"
      );
    },
    [pushToast]
  );

  const updateRewardCost = useCallback(
    (rewardId: string, newCost: number) => {
      const target = stateRef.current.rewards.find((r) => r.id === rewardId);
      if (!target) return;
      const clamped = Math.max(10, Math.min(500, newCost));
      const actorName =
        currentAccountRef.current?.displayName || "Coord. Helena Prado";

      setState((prev) => {
        const rewards = prev.rewards.map((r) =>
          r.id === rewardId ? { ...r, cost: clamped } : r
        );

        const newLog: ActivityLog = {
          id: uid("log"),
          timestamp: nowLabel(),
          actor: actorName,
          target: target.title,
          action: `Ajustou preço para ${clamped} Ouro`,
          category: "governanca",
          deltaSummary: `${clamped} Ouro`,
        };

        return {
          ...prev,
          rewards,
          logs: [newLog, ...prev.logs].slice(0, 40),
        };
      });
      pushToast(
        "Economia recalibrada",
        `"${target.title}" agora custa ${clamped} Ouro.`,
        "info"
      );
    },
    [pushToast]
  );

  const createReward = useCallback(
    (input: {
      title: string;
      description: string;
      cost: number;
      category: ShopReward["category"];
      stockLimit: number;
    }) => {
      const actorName =
        currentAccountRef.current?.displayName || "Coord. Helena Prado";
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
      const newLog: ActivityLog = {
        id: uid("log"),
        timestamp: nowLabel(),
        actor: actorName,
        target: newReward.title,
        action: "Adicionou nova recompensa aprovada na Lojinha",
        category: "governanca",
        deltaSummary: `${newReward.cost} Ouro`,
      };
      setState((prev) => ({
        ...prev,
        rewards: [newReward, ...prev.rewards],
        logs: [newLog, ...prev.logs].slice(0, 40),
      }));
      pushToast(
        "Nova recompensa criada!",
        `"${input.title}" já disponível para os alunos.`,
        "success"
      );
    },
    [pushToast]
  );

  const registerIntervention = useCallback(
    (studentId: string, note: string, restoreHp = 15) => {
      const target = stateRef.current.students.find((s) => s.id === studentId);
      if (!target) return;
      const actorName =
        currentAccountRef.current?.displayName || "Coord. Helena Prado";

      setState((prev) => {
        const students = prev.students.map((s) => {
          if (s.id !== studentId) return s;
          return {
            ...s,
            hp: Math.min(s.maxHp, s.hp + restoreHp),
            interventionsCount: s.interventionsCount + 1,
            lastInterventionNote:
              note.trim() || "Plano de acolhimento pedagógico iniciado.",
          };
        });

        const newLog: ActivityLog = {
          id: uid("log"),
          timestamp: nowLabel(),
          actor: actorName,
          target: target.name,
          action: `Intervenção pedagógica: ${note.trim() || "Acolhimento"}`,
          category: "intervencao",
          deltaSummary: `+${restoreHp} HP de apoio`,
        };

        return {
          ...prev,
          students,
          logs: [newLog, ...prev.logs].slice(0, 40),
        };
      });

      pushToast(
        "Intervenção registrada!",
        `${target.name} recebeu plano de apoio (+${restoreHp} HP restaurados).`,
        "success"
      );
    },
    [pushToast]
  );

  const resetDemoData = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage error
    }
    setState(INITIAL_STATE);
    pushToast(
      "Dados da demo resetados!",
      "Contas, pontos, presenças, missões e Espaço Híbrido voltaram ao estado inicial.",
      "info"
    );
  }, [pushToast]);

  return (
    <LoloverseContext.Provider
      value={{
        state,
        currentAccount,
        persona,
        login,
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
        resetDemoData,
        toasts,
        dismissToast,
        hydrated,
      }}
    >
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

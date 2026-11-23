"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { INITIAL_STATE } from "@/data/mockData";
import {
  ActivityLog,
  AttendanceStatus,
  BehaviorPreset,
  LoloverseState,
  OctalysisPillar,
  Persona,
  Quest,
  QuestType,
  ShopReward,
  ToastItem,
} from "@/types";

const STORAGE_KEY = "loloverse_mvp_state_v1";

interface LoloverseContextValue {
  state: LoloverseState;
  persona: Persona;
  setPersona: (persona: Persona) => void;
  setSelectedClassId: (classId: string) => void;
  setActiveStudentId: (studentId: string) => void;
  updateAttendance: (studentId: string, status: AttendanceStatus) => void;
  applyBehaviorFeedback: (studentId: string, preset: BehaviorPreset) => void;
  createQuest: (input: {
    classId: string;
    title: string;
    description: string;
    type: QuestType;
    xpReward: number;
    goldReward: number;
    pillar: OctalysisPillar;
    dueDate: string;
    bossTargetPercent?: number;
  }) => void;
  toggleQuestActive: (questId: string) => void;
  completeQuestAsStudent: (questId: string, studentId: string) => void;
  redeemReward: (rewardId: string, studentId: string) => void;
  sendChatMessage: (channelId: string, content: string, asPersona?: Persona) => void;
  toggleReaction: (messageId: string, emoji: string) => void;
  toggleRewardApproval: (rewardId: string) => void;
  updateRewardCost: (rewardId: string, newCost: number) => void;
  createReward: (input: {
    title: string;
    description: string;
    cost: number;
    category: ShopReward["category"];
    stockLimit: number;
  }) => void;
  registerIntervention: (studentId: string, note: string, restoreHp?: number) => void;
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

export function LoloverseProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<LoloverseState>(INITIAL_STATE);
  const stateRef = useRef<LoloverseState>(state);
  stateRef.current = state;

  const [persona, setPersona] = useState<Persona>("teacher");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const pushToast = useCallback(
    (
      title: string,
      description: string | undefined,
      variant: ToastItem["variant"] = "info"
    ) => {
      const id = uid("toast");
      setToasts((prev) => [...prev.slice(-3), { id, title, description, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3800);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Load persisted state from localStorage on mount
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<LoloverseState>;
        if (parsed && Array.isArray(parsed.students) && Array.isArray(parsed.quests)) {
          setState({
            ...INITIAL_STATE,
            ...parsed,
          });
        }
      }
    } catch {
      // Ignore storage errors and keep initial state
    } finally {
      setHydrated(true);
    }
  }, []);

  // Persist to localStorage whenever state changes after hydration
  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore quota errors
    }
  }, [state, hydrated]);

  const setSelectedClassId = useCallback((classId: string) => {
    setState((prev) => ({ ...prev, selectedClassId: classId }));
  }, []);

  const setActiveStudentId = useCallback((studentId: string) => {
    setState((prev) => ({ ...prev, activeStudentId: studentId }));
  }, []);

  const updateAttendance = useCallback(
    (studentId: string, status: AttendanceStatus) => {
      const target = stateRef.current.students.find((s) => s.id === studentId);
      if (!target) return;

      setState((prev) => {
        const students = prev.students.map((s) => {
          if (s.id !== studentId) return s;
          let rateDelta = 0;
          if (s.attendanceToday !== status) {
            if (status === "presente") rateDelta = s.attendanceToday === "falta" ? 2 : 1;
            if (status === "falta") rateDelta = -2;
            if (status === "atraso") rateDelta = s.attendanceToday === "falta" ? 1 : -1;
          }
          const nextRate = Math.max(40, Math.min(100, s.attendanceRate + rateDelta));
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
          actor: "Prof. Rafael Andrade",
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

      const labels: Record<AttendanceStatus, { text: string; variant: ToastItem["variant"] }> = {
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
          const nextOctalysis = {
            ...s.octalysis,
            [preset.pillar]: Math.max(
              10,
              Math.min(100, s.octalysis[preset.pillar] + pillarBoost)
            ),
          };

          return {
            ...s,
            xp: nextXp,
            level: nextLevel,
            xpToNext: nextXpToNext,
            hp: nextHp,
            gold: nextGold,
            octalysis: nextOctalysis,
          };
        });

        const parts: string[] = [];
        if (preset.xpDelta !== 0) parts.push(`${preset.xpDelta > 0 ? "+" : ""}${preset.xpDelta} XP`);
        if (preset.goldDelta !== 0) parts.push(`${preset.goldDelta > 0 ? "+" : ""}${preset.goldDelta} Ouro`);
        if (preset.hpDelta !== 0) parts.push(`${preset.hpDelta > 0 ? "+" : ""}${preset.hpDelta} HP`);

        const newLog: ActivityLog = {
          id: uid("log"),
          timestamp: nowLabel(),
          actor: "Prof. Rafael Andrade",
          target: target.name,
          action: `${preset.type === "positive" ? "Concedeu" : "Registrou alerta:"} ${preset.label}`,
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
        preset.xpDelta ? `${preset.xpDelta > 0 ? "+" : ""}${preset.xpDelta} XP` : "",
        preset.goldDelta ? `${preset.goldDelta > 0 ? "+" : ""}${preset.goldDelta} Ouro` : "",
        preset.hpDelta ? `${preset.hpDelta > 0 ? "+" : ""}${preset.hpDelta} HP` : "",
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
      pillar: OctalysisPillar;
      dueDate: string;
      bossTargetPercent?: number;
    }) => {
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

      setState((prev) => {
        const cls = prev.classes.find((c) => c.id === input.classId);
        const newLog: ActivityLog = {
          id: uid("log"),
          timestamp: nowLabel(),
          actor: "Prof. Rafael Andrade",
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
            octalysis: {
              ...s.octalysis,
              [currentQuest.pillar]: Math.min(
                100,
                s.octalysis[currentQuest.pillar] + 4
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

  const sendChatMessage = useCallback(
    (channelId: string, content: string, asPersona: Persona = "student") => {
      const trimmed = content.trim();
      if (!trimmed) return;

      setState((prev) => {
        const activeStudent =
          prev.students.find((s) => s.id === prev.activeStudentId) ||
          prev.students[0];

        const authorInfo =
          asPersona === "teacher"
            ? {
                authorId: "prof-rafael",
                authorName: "Prof. Rafael Andrade",
                authorRole: "professor" as const,
                avatarSeed: 20,
                avatarColor: "#3B82F6",
              }
            : asPersona === "coordinator"
            ? {
                authorId: "coord-helena",
                authorName: "Coord. Helena Prado",
                authorRole: "coordenador" as const,
                avatarSeed: 21,
                avatarColor: "#8B5CF6",
              }
            : {
                authorId: activeStudent.id,
                authorName: activeStudent.name,
                authorRole: "aluno" as const,
                avatarSeed: activeStudent.avatarSeed,
                avatarColor: activeStudent.avatarColor,
              };

        const newMsg = {
          id: uid("msg"),
          channelId,
          ...authorInfo,
          content: trimmed,
          timestamp: nowLabel(),
          reactions: [],
        };

        return {
          ...prev,
          messages: [...prev.messages, newMsg],
        };
      });
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

  const toggleRewardApproval = useCallback(
    (rewardId: string) => {
      const target = stateRef.current.rewards.find((r) => r.id === rewardId);
      if (!target) return;
      const approvedNow = !target.approved;

      setState((prev) => {
        const rewards = prev.rewards.map((r) =>
          r.id === rewardId ? { ...r, approved: approvedNow } : r
        );

        const newLog: ActivityLog = {
          id: uid("log"),
          timestamp: nowLabel(),
          actor: "Coord. Helena Prado",
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

      setState((prev) => {
        const rewards = prev.rewards.map((r) =>
          r.id === rewardId ? { ...r, cost: clamped } : r
        );

        const newLog: ActivityLog = {
          id: uid("log"),
          timestamp: nowLabel(),
          actor: "Coord. Helena Prado",
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
        actor: "Coord. Helena Prado",
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
          actor: "Coord. Helena Prado",
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
      "Todos os pontos, presenças, missões e mensagens voltaram ao estado inicial.",
      "info"
    );
  }, [pushToast]);

  return (
    <LoloverseContext.Provider
      value={{
        state,
        persona,
        setPersona,
        setSelectedClassId,
        setActiveStudentId,
        updateAttendance,
        applyBehaviorFeedback,
        createQuest,
        toggleQuestActive,
        completeQuestAsStudent,
        redeemReward,
        sendChatMessage,
        toggleReaction,
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

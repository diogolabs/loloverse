"use client";

import React, { useState } from "react";
import {
  Box,
  CheckCircle2,
  Coins,
  Crown,
  Flame,
  Gift,
  Music,
  ShoppingBag,
  Sparkles,
  Swords,
  Ticket,
  Zap,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { Student } from "@/types";
import { PillarBadge } from "@/components/shared/PillarBadge";

function RewardIcon({ name }: { name: string }) {
  const cls = "w-5 h-5";
  switch (name) {
    case "Sparkles":
      return <Sparkles className={cls} />;
    case "Music":
      return <Music className={cls} />;
    case "Ticket":
      return <Ticket className={cls} />;
    case "Crown":
      return <Crown className={cls} />;
    case "Box":
      return <Box className={cls} />;
    default:
      return <Gift className={cls} />;
  }
}

export function QuestsAndShop({ student }: { student: Student }) {
  const { state, completeQuestAsStudent, redeemReward } = useLoloverse();
  const [section, setSection] = useState<"quests" | "shop">("quests");

  const classStudents = state.students.filter(
    (s) => s.classId === student.classId
  );
  const activeQuests = state.quests.filter(
    (q) => q.classId === student.classId && q.active
  );
  const approvedRewards = state.rewards.filter((r) => r.approved);
  const myRedemptions = state.redemptions.filter(
    (r) => r.studentId === student.id
  );

  return (
    <div className="space-y-4">
      {/* Sub-navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSection("quests")}
            className={`sketch-btn px-4 py-2 text-sm ${
              section === "quests"
                ? "bg-[#3B82F6] text-white"
                : "bg-white text-zinc-700 hover:bg-blue-50"
            }`}
          >
            <Swords className="w-4 h-4" />
            Quadro de Missões ({activeQuests.length})
          </button>
          <button
            type="button"
            onClick={() => setSection("shop")}
            className={`sketch-btn px-4 py-2 text-sm ${
              section === "shop"
                ? "bg-[#FACC15] text-zinc-950"
                : "bg-white text-zinc-700 hover:bg-amber-50"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Lojinha da Turma ({approvedRewards.length})
          </button>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 border-2 border-zinc-900 rounded-xl text-xs font-extrabold shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <Coins className="w-4 h-4 text-amber-600" />
          Saldo: {student.gold} Ouro
        </div>
      </div>

      {/* QUESTS LIST */}
      {section === "quests" && (
        <div className="space-y-3.5">
          {activeQuests.length === 0 ? (
            <div className="sketch-card p-8 text-center">
              <p className="font-hand text-2xl text-zinc-800">
                Nenhuma missão ativa nesta turma agora!
              </p>
              <p className="text-sm text-zinc-600 mt-1">
                Crie uma nova quest na Visão do Professor para vê-la aparecer aqui instantaneamente.
              </p>
            </div>
          ) : (
            activeQuests.map((quest) => {
              const isDone = quest.completedBy.includes(student.id);
              const total = Math.max(1, classStudents.length);
              const pct = Math.min(
                100,
                Math.round((quest.completedBy.length / total) * 100)
              );
              const isBoss = quest.type === "boss";

              return (
                <div
                  key={quest.id}
                  className={`sketch-card p-4 sm:p-5 transition-all ${
                    isDone
                      ? "bg-emerald-50/80"
                      : isBoss
                      ? "bg-rose-50/70"
                      : "bg-white"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-extrabold border-2 border-zinc-900 rounded-lg ${
                            isBoss
                              ? "bg-[#F43F5E] text-white"
                              : quest.type === "diaria"
                              ? "bg-[#FACC15] text-zinc-950"
                              : "bg-[#3B82F6] text-white"
                          }`}
                        >
                          {isBoss ? (
                            <Swords className="w-3.5 h-3.5" />
                          ) : (
                            <Flame className="w-3.5 h-3.5" />
                          )}
                          {isBoss
                            ? "Boss Battle Coletiva"
                            : quest.type === "diaria"
                            ? "Diária"
                            : "Tarefa de Casa"}
                        </span>
                        <PillarBadge pillar={quest.pillar} />
                        <span className="text-xs font-bold text-zinc-500">
                          Prazo: {quest.dueDate}
                        </span>
                      </div>

                      <h3 className="font-hand text-2xl text-zinc-900 leading-tight">
                        {quest.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-zinc-700">
                        {quest.description}
                      </p>

                      {isBoss && (
                        <div className="pt-1 space-y-1 max-w-md">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-[#F43F5E]">
                              Meta Coletiva: {quest.bossTargetPercent || 85}% da turma
                            </span>
                            <span>
                              {quest.completedBy.length}/{total} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full h-3 bg-white border-2 border-zinc-900 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                pct >= (quest.bossTargetPercent || 85)
                                  ? "bg-[#10B981]"
                                  : "bg-[#F43F5E]"
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-extrabold bg-blue-100 border border-zinc-900 rounded-md">
                          <Zap className="w-3.5 h-3.5 text-[#3B82F6]" />+{quest.xpReward} XP
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-extrabold bg-amber-100 border border-zinc-900 rounded-md">
                          <Coins className="w-3.5 h-3.5 text-amber-600" />+{quest.goldReward} Ouro
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isDone ? (
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#10B981] text-zinc-950 border-2 border-zinc-900 font-extrabold text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          Concluída!
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            completeQuestAsStudent(quest.id, student.id)
                          }
                          className="sketch-btn w-full sm:w-auto px-4 py-2.5 bg-[#10B981] text-zinc-950 text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          Marcar Concluída
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SCHOOL REWARDS SHOP */}
      {section === "shop" && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {approvedRewards.map((reward) => {
              const canAfford = student.gold >= reward.cost;
              const remaining = Math.max(
                0,
                reward.stockLimit - reward.redeemedCount
              );

              return (
                <div
                  key={reward.id}
                  className="sketch-card p-4 bg-white flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="p-2.5 rounded-xl bg-[#FACC15] border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                        <RewardIcon name={reward.iconName} />
                      </div>
                      <span className="px-2 py-0.5 text-[11px] font-extrabold bg-[#FAF8F5] border-2 border-zinc-900 rounded-lg">
                        Restam {remaining}
                      </span>
                    </div>

                    <h3 className="font-hand text-2xl text-zinc-900 leading-tight">
                      {reward.title}
                    </h3>
                    <p className="text-xs text-zinc-600">{reward.description}</p>
                  </div>

                  <div className="pt-3 border-t-2 border-dashed border-zinc-200 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 font-hand text-2xl text-amber-700 font-bold">
                      <Coins className="w-5 h-5 text-amber-500" />
                      {reward.cost} Ouro
                    </span>
                    <button
                      type="button"
                      disabled={!canAfford || remaining <= 0}
                      onClick={() => redeemReward(reward.id, student.id)}
                      className={`sketch-btn-sm px-3.5 py-2 text-xs ${
                        canAfford && remaining > 0
                          ? "bg-[#8B5CF6] text-white"
                          : "bg-zinc-200 text-zinc-500 shadow-none cursor-not-allowed"
                      }`}
                    >
                      {remaining <= 0
                        ? "Esgotado"
                        : canAfford
                        ? "Resgatar Vantagem"
                        : "Ouro Insuficiente"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Student's Redeemed Vouchers */}
          {myRedemptions.length > 0 && (
            <div className="sketch-card p-4 bg-[#FFFDF7]">
              <h4 className="font-hand text-xl text-zinc-900 mb-2.5 flex items-center gap-1.5">
                <Ticket className="w-4 h-4 text-[#8B5CF6]" />
                Meus Vouchers Resgatados ({myRedemptions.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {myRedemptions.map((red) => (
                  <div
                    key={red.id}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-zinc-900 rounded-xl text-xs font-bold shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                  >
                    <span className="text-[#8B5CF6]">🎟</span>
                    <span>{red.rewardTitle}</span>
                    <span className="text-zinc-500">· {red.timestamp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

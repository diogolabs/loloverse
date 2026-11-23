"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Coins,
  Flame,
  PauseCircle,
  PlayCircle,
  Plus,
  Swords,
  Zap,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { PILLAR_META } from "@/data/mockData";
import { EngagementPillar, QuestType } from "@/types";
import { PillarBadge } from "@/components/shared/PillarBadge";

export function QuestManager() {
  const { state, createQuest, toggleQuestActive } = useLoloverse();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<QuestType>("tarefa");
  const [pillar, setPillar] = useState<EngagementPillar>("criatividade");
  const [xpReward, setXpReward] = useState(50);
  const [goldReward, setGoldReward] = useState(25);
  const [dueDate, setDueDate] = useState("Sexta, 18h");
  const [bossTargetPercent, setBossTargetPercent] = useState(85);

  const classStudents = state.students.filter(
    (s) => s.classId === state.selectedClassId
  );
  const classQuests = state.quests.filter(
    (q) => q.classId === state.selectedClassId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createQuest({
      classId: state.selectedClassId,
      title,
      description:
        description.trim() ||
        "Conclua a missão dentro do prazo para ganhar XP, Ouro e fortalecer sua competência.",
      type,
      xpReward,
      goldReward,
      pillar,
      dueDate,
      bossTargetPercent: type === "boss" ? bossTargetPercent : undefined,
    });
    setTitle("");
    setDescription("");
  };

  const questTypeBadge: Record<
    QuestType,
    { label: string; bg: string; icon: React.ReactNode }
  > = {
    boss: {
      label: "Boss Battle Coletiva",
      bg: "bg-[#F43F5E] text-white",
      icon: <Swords className="w-3.5 h-3.5" />,
    },
    diaria: {
      label: "Missão Diária",
      bg: "bg-[#FACC15] text-zinc-950",
      icon: <Flame className="w-3.5 h-3.5" />,
    },
    tarefa: {
      label: "Tarefa de Casa",
      bg: "bg-[#3B82F6] text-white",
      icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Creator Form */}
      <form
        onSubmit={handleSubmit}
        className="lg:col-span-5 sketch-card p-5 space-y-4 h-fit bg-[#FFFDF7]"
      >
        <div className="flex items-center gap-2 border-b-2 border-zinc-900 pb-3">
          <div className="p-2 rounded-xl bg-[#8B5CF6] text-white border-2 border-zinc-900">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-hand text-2xl leading-none text-zinc-900">
              Criar Nova Missão
            </h2>
            <p className="text-xs text-zinc-600">
              Conecte atividades reais às competências da turma
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
              Tipo de Missão
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["diaria", "tarefa", "boss"] as QuestType[]).map((qt) => (
                <button
                  key={qt}
                  type="button"
                  onClick={() => {
                    setType(qt);
                    if (qt === "boss") {
                      setXpReward(120);
                      setGoldReward(60);
                    } else if (qt === "diaria") {
                      setXpReward(25);
                      setGoldReward(15);
                    } else {
                      setXpReward(50);
                      setGoldReward(25);
                    }
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-all ${
                    type === qt
                      ? "bg-[#FACC15] border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                      : "bg-white border-zinc-300 hover:border-zinc-900 text-zinc-700"
                  }`}
                >
                  {qt === "diaria"
                    ? "Diária"
                    : qt === "tarefa"
                    ? "Tarefa"
                    : "Boss Battle"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
              Título da Missão
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "boss"
                  ? "Ex: Desafio da Feira: 85% entregar o protótipo"
                  : "Ex: Lista de Exercícios de Robótica"
              }
              className="sketch-input"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
              Descrição / Critério de Sucesso
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique o objetivo pedagógico e o que o aluno deve entregar..."
              className="sketch-input resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
              Competência Estimulada
            </label>
            <select
              value={pillar}
              onChange={(e) => setPillar(e.target.value as EngagementPillar)}
              className="sketch-input font-semibold"
            >
              {(Object.keys(PILLAR_META) as EngagementPillar[]).map((p) => (
                <option key={p} value={p}>
                  {PILLAR_META[p].label} ({PILLAR_META[p].tagline})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                XP
              </label>
              <input
                type="number"
                min={10}
                max={500}
                step={5}
                value={xpReward}
                onChange={(e) => setXpReward(Number(e.target.value))}
                className="sketch-input font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                Ouro
              </label>
              <input
                type="number"
                min={5}
                max={300}
                step={5}
                value={goldReward}
                onChange={(e) => setGoldReward(Number(e.target.value))}
                className="sketch-input font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                Prazo
              </label>
              <input
                type="text"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="sketch-input"
              />
            </div>
          </div>

          {type === "boss" && (
            <div className="p-3 rounded-xl bg-rose-50 border-2 border-zinc-900">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span>Meta Coletiva da Turma</span>
                <span className="font-hand text-lg text-[#F43F5E]">
                  {bossTargetPercent}% da turma
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={100}
                step={5}
                value={bossTargetPercent}
                onChange={(e) => setBossTargetPercent(Number(e.target.value))}
                className="w-full accent-[#F43F5E]"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          className="sketch-btn w-full py-2.5 bg-[#10B981] text-zinc-950 text-sm"
        >
          <Plus className="w-4 h-4" />
          Publicar Quest para a Turma
        </button>
      </form>

      {/* Active Quests List */}
      <div className="lg:col-span-7 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-hand text-2xl text-zinc-900">
            Quests da Turma ({classQuests.length})
          </h3>
          <span className="text-xs font-bold text-zinc-500">
            Sincronizado em tempo real com a Visão do Aluno
          </span>
        </div>

        {classQuests.map((quest) => {
          const badge = questTypeBadge[quest.type];
          const completedCount = quest.completedBy.length;
          const total = Math.max(1, classStudents.length);
          const percent = Math.min(100, Math.round((completedCount / total) * 100));
          const bossTarget = quest.bossTargetPercent || 85;
          const bossCleared = quest.type === "boss" && percent >= bossTarget;

          return (
            <div
              key={quest.id}
              className={`sketch-card p-4 space-y-3 transition-opacity ${
                quest.active ? "bg-white" : "bg-zinc-100 opacity-75"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-extrabold border-2 border-zinc-900 rounded-lg ${badge.bg}`}
                  >
                    {badge.icon}
                    {badge.label}
                  </span>
                  <PillarBadge pillar={quest.pillar} />
                  {!quest.active && (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-zinc-200 border border-zinc-900 rounded-md">
                      Pausada
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => toggleQuestActive(quest.id)}
                  className="sketch-btn-sm px-2.5 py-1 text-xs bg-white hover:bg-zinc-100"
                >
                  {quest.active ? (
                    <>
                      <PauseCircle className="w-3.5 h-3.5" /> Pausar
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-3.5 h-3.5" /> Ativar
                    </>
                  )}
                </button>
              </div>

              <div>
                <h4 className="font-hand text-2xl text-zinc-900 leading-tight">
                  {quest.title}
                </h4>
                <p className="text-xs sm:text-sm text-zinc-600 mt-1">
                  {quest.description}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>
                    {quest.type === "boss"
                      ? bossCleared
                        ? "Boss Derrotado pela Turma!"
                        : `Progresso Coletivo (Meta: ${bossTarget}%)`
                      : "Entregas da Turma"}
                  </span>
                  <span>
                    {completedCount}/{total} alunos ({percent}%)
                  </span>
                </div>
                <div className="relative w-full h-3 bg-zinc-200 border-2 border-zinc-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      quest.type === "boss"
                        ? bossCleared
                          ? "bg-[#10B981]"
                          : "bg-[#F43F5E]"
                        : "bg-[#3B82F6]"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                  {quest.type === "boss" && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-zinc-900"
                      style={{ left: `${bossTarget}%` }}
                      title={`Meta: ${bossTarget}%`}
                    />
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t-2 border-dashed border-zinc-200 text-xs font-bold">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 border border-zinc-900 rounded-md">
                    <Zap className="w-3.5 h-3.5 text-[#3B82F6]" /> +{quest.xpReward} XP
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 border border-zinc-900 rounded-md">
                    <Coins className="w-3.5 h-3.5 text-amber-600" /> +{quest.goldReward} Ouro
                  </span>
                </div>
                <span className="text-zinc-500">Prazo: {quest.dueDate}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

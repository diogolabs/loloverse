"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Coins,
  History,
  Minus,
  PauseCircle,
  Plus,
  Scale,
  School,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { ShopReward } from "@/types";

export function EconomyAudit() {
  const {
    state,
    toggleRewardApproval,
    updateRewardCost,
    createReward,
  } = useLoloverse();

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCost, setNewCost] = useState(75);
  const [newStock, setNewStock] = useState(10);
  const [newCat, setNewCat] = useState<ShopReward["category"]>("academico");

  const handleAddReward = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    createReward({
      title: newTitle,
      description:
        newDesc.trim() ||
        "Vantagem pedagógica aprovada pela coordenação para incentivar hábitos positivos.",
      cost: newCost,
      category: newCat,
      stockLimit: newStock,
    });
    setNewTitle("");
    setNewDesc("");
  };

  return (
    <div className="space-y-6">
      {/* Consolidated Performance by Class */}
      <div className="sketch-card overflow-hidden">
        <div className="px-5 py-3.5 bg-[#FAF8F5] border-b-2 border-zinc-900 flex items-center gap-2">
          <School className="w-5 h-5 text-[#8B5CF6]" />
          <div>
            <h2 className="font-hand text-2xl leading-none text-zinc-900">
              Visão Consolidada por Turma
            </h2>
            <p className="text-xs text-zinc-600">
              Indicadores acadêmicos e gamificados agregados em tempo real
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-900 bg-zinc-50 text-[11px] font-extrabold uppercase tracking-wider text-zinc-600">
                <th className="py-3 px-4">Turma</th>
                <th className="py-3 px-4 text-center">Alunos</th>
                <th className="py-3 px-4 text-center">Freq. Média</th>
                <th className="py-3 px-4 text-center">Média Notas</th>
                <th className="py-3 px-4 text-center">HP Médio</th>
                <th className="py-3 px-4 text-center">Em Atenção</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-zinc-200 text-sm">
              {state.classes.map((cls) => {
                const members = state.students.filter(
                  (s) => s.classId === cls.id
                );
                const count = Math.max(1, members.length);
                const avgFreq = Math.round(
                  members.reduce((a, s) => a + s.attendanceRate, 0) / count
                );
                const avgGrade = (
                  members.reduce((a, s) => a + s.bimesterAverage, 0) / count
                ).toFixed(1);
                const avgHp = Math.round(
                  members.reduce((a, s) => a + s.hp, 0) / count
                );
                const riskCount = members.filter(
                  (s) =>
                    s.hp <= 55 ||
                    s.attendanceRate < 78 ||
                    s.previousAverage - s.bimesterAverage >= 1.0
                ).length;

                return (
                  <tr key={cls.id} className="hover:bg-[#FAF8F5]/70">
                    <td className="py-3 px-4">
                      <p className="font-bold text-zinc-900">{cls.name}</p>
                      <p className="text-xs text-zinc-500">
                        {cls.teacherName} · {cls.room}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {members.length}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-extrabold bg-emerald-100 border border-zinc-900">
                        {avgFreq}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-hand text-xl font-bold">
                      {avgGrade}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      {avgHp}/100
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-xs font-extrabold border border-zinc-900 ${
                          riskCount > 0
                            ? "bg-rose-200 text-rose-950"
                            : "bg-emerald-100 text-emerald-950"
                        }`}
                      >
                        {riskCount}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Store Governance & Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Economy & Reward Governance */}
        <div className="lg:col-span-7 sketch-card p-5 space-y-4 bg-white">
          <div className="flex items-center gap-2 border-b-2 border-zinc-900 pb-3">
            <div className="p-2 rounded-xl bg-[#FACC15] border-2 border-zinc-900">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-hand text-2xl leading-none text-zinc-900">
                Governança da Lojinha & Equilíbrio Pedagógico
              </h3>
              <p className="text-xs text-zinc-600">
                Aprove recompensas ou calibre o custo em Ouro — atualiza a Visão do Aluno na hora
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {state.rewards.map((reward) => (
              <div
                key={reward.id}
                className={`p-3.5 rounded-xl border-2 border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  reward.approved ? "bg-[#FAF8F5]" : "bg-amber-50/70"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-sm text-zinc-900">
                      {reward.title}
                    </h4>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold border border-zinc-900 rounded-md uppercase ${
                        reward.approved
                          ? "bg-[#10B981] text-zinc-950"
                          : "bg-[#FACC15] text-zinc-950"
                      }`}
                    >
                      {reward.approved ? "Aprovada" : "Pendente Aprovação"}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    {reward.description}
                  </p>
                  <p className="text-[11px] font-bold text-zinc-500 mt-1">
                    Resgates: {reward.redeemedCount}/{reward.stockLimit}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {/* Cost Calibrator */}
                  <div className="inline-flex items-center bg-white border-2 border-zinc-900 rounded-xl overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        updateRewardCost(reward.id, reward.cost - 10)
                      }
                      className="p-1.5 hover:bg-zinc-100 border-r border-zinc-900"
                      title="Reduzir preço em 10 Ouro"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2.5 text-xs font-extrabold inline-flex items-center gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500" />
                      {reward.cost}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateRewardCost(reward.id, reward.cost + 10)
                      }
                      className="p-1.5 hover:bg-zinc-100 border-l border-zinc-900"
                      title="Aumentar preço em 10 Ouro"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Approve / Pause Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleRewardApproval(reward.id)}
                    className={`sketch-btn-sm px-3 py-1.5 text-xs ${
                      reward.approved
                        ? "bg-white hover:bg-rose-50 text-zinc-800"
                        : "bg-[#10B981] text-zinc-950"
                    }`}
                  >
                    {reward.approved ? (
                      <>
                        <PauseCircle className="w-3.5 h-3.5" /> Pausar
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Create Approved Reward */}
          <form
            onSubmit={handleAddReward}
            className="pt-4 border-t-2 border-dashed border-zinc-300 space-y-2.5"
          >
            <p className="font-hand text-xl text-zinc-900">
              + Adicionar Nova Vantagem Escolar
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Visita guiada ao Lab de Robótica Avançada"
                className="sm:col-span-6 sketch-input text-xs"
              />
              <input
                type="number"
                min={10}
                max={500}
                step={5}
                value={newCost}
                onChange={(e) => setNewCost(Number(e.target.value))}
                className="sm:col-span-2 sketch-input text-xs font-bold"
                title="Preço em Ouro"
              />
              <select
                value={newCat}
                onChange={(e) =>
                  setNewCat(e.target.value as ShopReward["category"])
                }
                className="sm:col-span-2 sketch-input text-xs font-semibold"
              >
                <option value="academico">Acadêmico</option>
                <option value="turma">Turma</option>
                <option value="privilegio">Privilégio</option>
                <option value="avatar">Maker</option>
              </select>
              <button
                type="submit"
                className="sm:col-span-2 sketch-btn-sm py-2 bg-[#8B5CF6] text-white text-xs"
              >
                Criar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Descrição pedagógica breve (opcional)"
                className="sm:col-span-10 sketch-input text-xs"
              />
              <input
                type="number"
                min={1}
                max={100}
                value={newStock}
                onChange={(e) => setNewStock(Number(e.target.value))}
                className="sm:col-span-2 sketch-input text-xs"
                title="Limite de estoque"
              />
            </div>
          </form>
        </div>

        {/* Real-time Audit Trail */}
        <div className="lg:col-span-5 sketch-card p-5 bg-[#FFFDF7] space-y-3">
          <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-[#3B82F6]" />
              <h3 className="font-hand text-2xl leading-none text-zinc-900">
                Auditoria em Tempo Real
              </h3>
            </div>
            <span className="text-[11px] font-bold text-zinc-500">
              {state.logs.length} eventos
            </span>
          </div>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {state.logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-white border-2 border-zinc-900 text-xs space-y-1 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-zinc-900">
                    {log.actor}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-500">
                    {log.timestamp}
                  </span>
                </div>
                <p className="text-zinc-700">
                  {log.action} → <strong>{log.target}</strong>
                </p>
                {log.deltaSummary && (
                  <span className="inline-block px-2 py-0.5 text-[10px] font-extrabold bg-[#FAF8F5] border border-zinc-900 rounded-md">
                    {log.deltaSummary}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

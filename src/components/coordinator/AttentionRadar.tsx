"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  HeartHandshake,
  KeyRound,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { Student } from "@/types";
import { SketchAvatar } from "@/components/shared/SketchAvatar";

function getSuggestedIntervention(student: Student): string {
  const gradeDrop = student.previousAverage - student.bimesterAverage;
  if (student.attendanceRate < 75) {
    return "Agendar conversa acolhedora com responsáveis + plano de recuperação de presença com tutor de turma.";
  }
  if (gradeDrop >= 1.2) {
    return "Convidar para plantão de dúvidas no Espaço Híbrido e parear com colega mentor da turma.";
  }
  return "Oferecer micro-missão de vitória rápida (+25 XP) para restaurar confiança e recuperar Saúde Acadêmica (HP).";
}

export function AttentionRadar() {
  const { state, registerIntervention } = useLoloverse();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const atRiskStudents = state.students
    .filter((s) => {
      const gradeDrop = s.previousAverage - s.bimesterAverage;
      return s.hp <= 55 || s.attendanceRate < 78 || gradeDrop >= 1.0;
    })
    .sort((a, b) => a.hp - b.hp);

  const handleIntervene = (student: Student) => {
    const note =
      notes[student.id]?.trim() || getSuggestedIntervention(student);
    registerIntervention(student.id, note, 15);
    setNotes((prev) => ({ ...prev, [student.id]: "" }));
  };

  return (
    <div className="space-y-4">
      <div className="sketch-card p-4 bg-rose-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-[#F43F5E] text-white border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-hand text-2xl sm:text-3xl leading-none text-zinc-900">
              Radar de Cuidado · Prevenção de Evasão
            </h2>
            <p className="text-xs sm:text-sm text-zinc-700 mt-1">
              Detecção automática de alunos com <strong>HP ≤ 55</strong>,{" "}
              <strong>Frequência &lt; 78%</strong> ou{" "}
              <strong>queda brusca de média (≥ 1.0 ponto)</strong>.
            </p>
          </div>
        </div>
        <span className="px-3 py-1 bg-white border-2 border-zinc-900 rounded-xl font-hand text-xl font-bold text-[#F43F5E]">
          {atRiskStudents.length} em monitoramento
        </span>
      </div>

      {atRiskStudents.length === 0 ? (
        <div className="sketch-card p-8 bg-emerald-50 text-center space-y-2">
          <p className="font-hand text-3xl text-emerald-950">
            Todos os estudantes estão com Saúde Acadêmica estável!
          </p>
          <p className="text-sm text-emerald-900">
            Nenhum alerta crítico no Radar de Cuidado no momento.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {atRiskStudents.map((student) => {
            const cls = state.classes.find((c) => c.id === student.classId);
            const acc = state.accounts.find((a) => a.studentId === student.id);
            const gradeDrop = Number(
              (student.previousAverage - student.bimesterAverage).toFixed(1)
            );
            const suggestion = getSuggestedIntervention(student);

            return (
              <div
                key={student.id}
                className="sketch-card p-4 sm:p-5 bg-white space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Student Profile & Risk Chips */}
                  <div className="flex items-start gap-3.5">
                    <SketchAvatar
                      seed={student.avatarSeed}
                      bgColor={student.avatarColor}
                      size="lg"
                    />
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-hand text-2xl leading-none text-zinc-900">
                          {student.name}
                        </h3>
                        <span className="text-xs font-bold px-2 py-0.5 bg-[#FAF8F5] border border-zinc-900 rounded-md">
                          {cls?.name}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {student.hp <= 55 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-extrabold bg-[#F43F5E] text-white border border-zinc-900 rounded-lg">
                            <AlertTriangle className="w-3 h-3" />
                            HP Crítico ({student.hp}/100)
                          </span>
                        )}
                        {student.attendanceRate < 78 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-extrabold bg-amber-200 text-amber-950 border border-zinc-900 rounded-lg">
                            Frequência {student.attendanceRate}%
                          </span>
                        )}
                        {gradeDrop >= 1.0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-extrabold bg-rose-100 text-rose-900 border border-zinc-900 rounded-lg">
                            <TrendingDown className="w-3 h-3" />
                            Queda de Nota (-{gradeDrop})
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-600">
                        Média atual:{" "}
                        <strong>{student.bimesterAverage.toFixed(1)}</strong>{" "}
                        (anterior: {student.previousAverage.toFixed(1)}) ·
                        Entregas: <strong>{student.deliveryRate}%</strong>
                        {student.lastInterventionNote && (
                          <>
                            {" "}
                            · Último registro:{" "}
                            <em className="text-zinc-800">
                              {student.lastInterventionNote}
                            </em>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  {acc && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] border-2 border-zinc-900 rounded-xl text-xs font-mono font-bold shrink-0 self-start">
                      <KeyRound className="w-3.5 h-3.5 text-[#8B5CF6]" />
                      @{acc.username}
                    </div>
                  )}
                </div>

                {/* Pedagogical Suggestion + Action Bar */}
                <div className="p-3.5 rounded-xl bg-[#FFFBEB] border-2 border-zinc-900 space-y-2.5">
                  <p className="text-xs font-bold text-zinc-800">
                    <span className="uppercase tracking-wider text-[10px] px-1.5 py-0.5 bg-[#FACC15] border border-zinc-900 rounded mr-1.5">
                      Sugestão Pedagógica
                    </span>
                    {suggestion}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={notes[student.id] || ""}
                      onChange={(e) =>
                        setNotes((prev) => ({
                          ...prev,
                          [student.id]: e.target.value,
                        }))
                      }
                      placeholder="Anotar ação pedagógica (opcional — usa sugestão se vazio)..."
                      className="sketch-input bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => handleIntervene(student)}
                      className="sketch-btn-sm px-4 py-2 bg-[#10B981] text-zinc-950 text-xs shrink-0"
                    >
                      <HeartHandshake className="w-4 h-4" />
                      Registrar Apoio (+15 HP)
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

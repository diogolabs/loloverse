"use client";

import React, { useMemo, useState } from "react";
import {
  CalendarDays,
  ClipboardCheck,
  GraduationCap,
  MessageSquare,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import {
  SEGMENT_LABELS,
  matchesCoordinatorScope,
} from "@/data/mockData";
import { computeAverageBnccIndex } from "@/data/bnccAndPaths";
import { ExecutiveKpis } from "@/components/coordinator/ExecutiveKpis";
import { AttentionRadar } from "@/components/coordinator/AttentionRadar";
import { CurriculumScheduleBuilder } from "@/components/coordinator/CurriculumScheduleBuilder";
import { HybridSpaceHub } from "@/components/shared/HybridSpaceHub";
import { SketchAvatar } from "@/components/shared/SketchAvatar";

export function CoordinatorView() {
  const { state, currentAccount } = useLoloverse();
  const [tab, setTab] = useState<
    "staff" | "schedule" | "pedagogical" | "radar" | "espaco"
  >("staff");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");

  // Escopo do Coordenador: filtra turmas, docentes e alunos pelo Segmento & Turno dele!
  const scopedClasses = useMemo(
    () =>
      state.classes.filter((cls) =>
        matchesCoordinatorScope(currentAccount, {
          segment: cls.segment,
          period: cls.period,
        })
      ),
    [state.classes, currentAccount]
  );

  const scopedClassIds = useMemo(
    () => scopedClasses.map((c) => c.id),
    [scopedClasses]
  );

  const scopedTeachers = useMemo(
    () =>
      state.accounts.filter(
        (acc) =>
          acc.role === "teacher" &&
          acc.active !== false &&
          (matchesCoordinatorScope(currentAccount, {
            segment: acc.segment,
            workShift: acc.workShift,
          }) ||
            (acc.classId && scopedClassIds.includes(acc.classId)))
      ),
    [state.accounts, currentAccount, scopedClassIds]
  );

  const scopedStudents = useMemo(
    () => state.students.filter((s) => scopedClassIds.includes(s.classId)),
    [state.students, scopedClassIds]
  );

  const displayedStudents =
    selectedClassFilter === "all"
      ? scopedStudents
      : scopedStudents.filter((s) => s.classId === selectedClassFilter);

  const scopeSegmentLabel =
    SEGMENT_LABELS[currentAccount?.segment || "todos"];
  const scopeShiftLabel = currentAccount?.workShift || "Todos";

  return (
    <div className="space-y-6">
      {/* Header Exclusivo do Coordenador Pedagógico com Escopo Claro */}
      <section className="sketch-card p-5 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#8B5CF6] text-white border-2 border-zinc-900 rounded-lg text-xs font-extrabold uppercase tracking-wider">
              Coordenação Pedagógica
            </span>
            <span className="px-2.5 py-0.5 bg-[#FACC15] text-zinc-950 border-2 border-zinc-900 rounded-lg text-xs font-extrabold">
              Escopo: {scopeSegmentLabel} · Turno: {scopeShiftLabel}
            </span>
          </div>
          <h1 className="font-hand text-3xl sm:text-4xl text-zinc-900 leading-tight mt-1">
            Gestão Pedagógica · {currentAccount?.displayName || "Coordenação"}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 font-medium">
            {scopedTeachers.length} docente(s) · {scopedClasses.length} turma(s) ·{" "}
            {scopedStudents.length} estudante(s) sob sua coordenação.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("staff")}
            className={`sketch-btn px-3.5 py-2 text-xs sm:text-sm ${
              tab === "staff"
                ? "bg-[#8B5CF6] text-white"
                : "bg-white text-zinc-700 hover:bg-violet-50"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Docentes & Turmas
          </button>
          <button
            type="button"
            onClick={() => setTab("schedule")}
            className={`sketch-btn px-3.5 py-2 text-xs sm:text-sm ${
              tab === "schedule"
                ? "bg-[#3B82F6] text-white"
                : "bg-white text-zinc-700 hover:bg-blue-50"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Grade Curricular
          </button>
          <button
            type="button"
            onClick={() => setTab("pedagogical")}
            className={`sketch-btn px-3.5 py-2 text-xs sm:text-sm ${
              tab === "pedagogical"
                ? "bg-[#FACC15] text-zinc-950"
                : "bg-white text-zinc-700 hover:bg-amber-50"
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            Presença & Desempenho
          </button>
          <button
            type="button"
            onClick={() => setTab("radar")}
            className={`sketch-btn px-3.5 py-2 text-xs sm:text-sm ${
              tab === "radar"
                ? "bg-[#F43F5E] text-white"
                : "bg-white text-zinc-700 hover:bg-rose-50"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Radar de Cuidado
          </button>
          <button
            type="button"
            onClick={() => setTab("espaco")}
            className={`sketch-btn px-3.5 py-2 text-xs sm:text-sm ${
              tab === "espaco"
                ? "bg-[#10B981] text-zinc-950"
                : "bg-white text-zinc-700 hover:bg-emerald-50"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Espaço Híbrido
          </button>
        </div>
      </section>

      {/* KPIs Executivos filtrados pelo escopo do Coordenador */}
      <ExecutiveKpis allowedClassIds={scopedClassIds} />

      {/* ABA 1: DOCENTES & TURMAS DO ESCOPO */}
      {tab === "staff" && (
        <div className="space-y-5">
          <section className="sketch-card p-5 bg-[#FFFDF7] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-2.5">
              <div>
                <h2 className="font-hand text-2xl sm:text-3xl leading-none text-zinc-900">
                  Corpo Docente · {scopeSegmentLabel} ({scopeShiftLabel})
                </h2>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Professores cadastrados no seu segmento e turno de trabalho.
                </p>
              </div>
              <span className="px-2.5 py-1 text-xs font-extrabold bg-white border-2 border-zinc-900 rounded-lg">
                {scopedTeachers.length} professor(es)
              </span>
            </div>

            {scopedTeachers.length === 0 ? (
              <p className="text-sm text-zinc-600 italic">
                Nenhum professor vinculado a este segmento/turno ainda.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {scopedTeachers.map((prof) => {
                  const profClasses = scopedClasses.filter(
                    (c) =>
                      c.teacherId === prof.id || c.id === prof.classId
                  );
                  const profSlots = state.scheduleSlots.filter(
                    (s) => s.teacherId === prof.id
                  ).length;

                  return (
                    <div
                      key={prof.id}
                      className="sketch-card-sm p-4 bg-white space-y-2.5"
                    >
                      <div className="flex items-center gap-3">
                        <SketchAvatar
                          seed={prof.avatarSeed}
                          bgColor={prof.avatarColor}
                          config={prof.avatarConfig}
                          size="md"
                        />
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-zinc-900 truncate">
                            {prof.displayName}
                          </h3>
                          <p className="text-[11px] text-zinc-500 truncate">
                            {prof.bio || "Docente Loloverse"}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 text-[10px] font-extrabold">
                        <span className="px-2 py-0.5 bg-violet-100 border border-zinc-900 rounded">
                          {SEGMENT_LABELS[prof.segment || "todos"]}
                        </span>
                        <span className="px-2 py-0.5 bg-amber-100 border border-zinc-900 rounded">
                          {prof.workShift || "Todos"}
                        </span>
                        <span className="px-2 py-0.5 bg-blue-100 border border-zinc-900 rounded">
                          {profSlots} aula(s)/sem
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-600">
                        <strong>Turmas:</strong>{" "}
                        {profClasses.length > 0
                          ? profClasses.map((c) => c.name).join(", ")
                          : "Alocado via Grade Curricular"}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="sketch-card overflow-hidden bg-white">
            <div className="px-5 py-3.5 bg-[#FAF8F5] border-b-2 border-zinc-900">
              <h2 className="font-hand text-2xl leading-none text-zinc-900">
                Turmas do Meu Escopo ({scopedClasses.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b-2 border-zinc-900 bg-zinc-50 text-[11px] font-extrabold uppercase text-zinc-600">
                    <th className="py-3 px-4">Turma</th>
                    <th className="py-3 px-3 text-center">Alunos</th>
                    <th className="py-3 px-3 text-center">Freq. Média</th>
                    <th className="py-3 px-3 text-center">Média Notas</th>
                    <th className="py-3 px-3 text-center">Índice BNCC</th>
                    <th className="py-3 px-3 text-center">Percursos Ativos</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-zinc-200">
                  {scopedClasses.map((cls) => {
                    const members = scopedStudents.filter(
                      (s) => s.classId === cls.id
                    );
                    const n = Math.max(1, members.length);
                    const freq = Math.round(
                      members.reduce((a, s) => a + s.attendanceRate, 0) / n
                    );
                    const grade = (
                      members.reduce((a, s) => a + s.bimesterAverage, 0) / n
                    ).toFixed(1);
                    const bncc = (
                      members.reduce(
                        (a, s) => a + computeAverageBnccIndex(s.bnccAttributes),
                        0
                      ) / n
                    ).toFixed(1);
                    const pathsCount = state.dynamicPaths.filter(
                      (p) => p.classId === cls.id && p.active
                    ).length;

                    return (
                      <tr key={cls.id} className="hover:bg-[#FAF8F5]/70">
                        <td className="py-3 px-4">
                          <p className="font-bold text-sm text-zinc-900">
                            {cls.name}
                          </p>
                          <p className="text-[11px] text-zinc-500">
                            {cls.teacherName} · {cls.room} · {cls.period}
                          </p>
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {members.length}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-emerald-100 border border-zinc-900 font-extrabold">
                            {freq}%
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-hand text-xl font-bold">
                          {grade}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-[#8B5CF6]">
                          {bncc}/20
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {pathsCount}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {/* ABA 2: GRADE CURRICULAR & CONSTRUTOR */}
      {tab === "schedule" && (
        <CurriculumScheduleBuilder
          scopedClasses={scopedClasses}
          scopedTeachers={scopedTeachers}
        />
      )}

      {/* ABA 3: PRESENÇA & DESEMPENHO PEDAGÓGICO */}
      {tab === "pedagogical" && (
        <section className="sketch-card overflow-hidden bg-white">
          <div className="p-4 bg-[#FAF8F5] border-b-2 border-zinc-900 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-hand text-2xl sm:text-3xl leading-none text-zinc-900">
                Presença & Desempenho Pedagógico ({displayedStudents.length} alunos)
              </h2>
              <p className="text-xs text-zinc-600 mt-0.5">
                Acompanhamento de frequência diária, evolução de médias e atributos BNCC do seu escopo.
              </p>
            </div>
            <select
              value={selectedClassFilter}
              onChange={(e) => setSelectedClassFilter(e.target.value)}
              className="sketch-input bg-white py-1.5 text-xs font-bold w-auto"
            >
              <option value="all">Todas as turmas do meu escopo</option>
              {scopedClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b-2 border-zinc-900 bg-zinc-50 text-[11px] font-extrabold uppercase text-zinc-600">
                  <th className="py-3 px-4">Estudante</th>
                  <th className="py-3 px-3 text-center">Hoje</th>
                  <th className="py-3 px-3 text-center">Frequência</th>
                  <th className="py-3 px-3 text-center">Média Atual</th>
                  <th className="py-3 px-3 text-center">Índice BNCC</th>
                  <th className="py-3 px-3 text-center">Saúde (HP)</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-zinc-200">
                {displayedStudents.map((stu) => {
                  const cls = scopedClasses.find((c) => c.id === stu.classId);
                  const delta = Number(
                    (stu.bimesterAverage - stu.previousAverage).toFixed(1)
                  );
                  const bncc = computeAverageBnccIndex(stu.bnccAttributes);
                  return (
                    <tr key={stu.id} className="hover:bg-[#FAF8F5]/70">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <SketchAvatar
                            seed={stu.avatarSeed}
                            bgColor={stu.avatarColor}
                            config={stu.avatarConfig}
                            size="sm"
                          />
                          <div>
                            <p className="font-bold text-zinc-900">{stu.name}</p>
                            <p className="text-[11px] text-zinc-500">
                              {cls?.name} · Nv.{stu.level}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold border border-zinc-900 uppercase ${
                            stu.attendanceToday === "presente"
                              ? "bg-emerald-200 text-emerald-950"
                              : stu.attendanceToday === "atraso"
                              ? "bg-amber-200 text-amber-950"
                              : "bg-rose-200 text-rose-950"
                          }`}
                        >
                          {stu.attendanceToday}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-extrabold">
                        {stu.attendanceRate}%
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="font-hand text-xl font-bold mr-1">
                          {stu.bimesterAverage.toFixed(1)}
                        </span>
                        <span
                          className={`inline-flex items-center text-[10px] font-bold px-1 rounded ${
                            delta >= 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {delta >= 0 ? (
                            <TrendingUp className="w-3 h-3 mr-0.5" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-0.5" />
                          )}
                          {delta >= 0 ? `+${delta}` : delta}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-[#8B5CF6]">
                        {bncc}/20
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold">
                        {stu.hp}/{stu.maxHp}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "radar" && <AttentionRadar allowedClassIds={scopedClassIds} />}
      {tab === "espaco" && <HybridSpaceHub />}
    </div>
  );
}

"use client";

import React, { useState } from "react";
import {
  ClipboardCheck,
  MapPin,
  MessageSquare,
  Sparkles,
  Swords,
  Users,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { AttendancePanel } from "@/components/teacher/AttendancePanel";
import { ClassDojoGrid } from "@/components/teacher/ClassDojoGrid";
import { QuestManager } from "@/components/teacher/QuestManager";
import { SalinhaHub } from "@/components/student/SalinhaHub";

type TeacherTab = "dojo" | "attendance" | "quests" | "salinha";

export function TeacherView() {
  const { state, currentAccount, setSelectedClassId } = useLoloverse();
  const [tab, setTab] = useState<TeacherTab>("dojo");

  const selectedClass =
    state.classes.find((c) => c.id === state.selectedClassId) || state.classes[0];
  const classStudents = state.students.filter(
    (s) => s.classId === selectedClass.id
  );
  const activeQuestsCount = state.quests.filter(
    (q) => q.classId === selectedClass.id && q.active
  ).length;

  return (
    <div className="space-y-6">
      {/* Teacher Hero Header + Class Selector */}
      <section className="sketch-card p-5 bg-white flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#FACC15] border-2 border-zinc-900 rounded-lg text-xs font-extrabold uppercase tracking-wider">
            Visão do Professor · Sala Viva
          </div>
          <h1 className="font-hand text-3xl sm:text-4xl text-zinc-900 leading-tight">
            Olá, {currentAccount?.displayName || selectedClass.teacherName}!
          </h1>
          <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-semibold text-zinc-600">
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-4 h-4 text-[#3B82F6]" />
              {selectedClass.room} · {selectedClass.period}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="w-4 h-4 text-[#10B981]" />
              {classStudents.length} alunos ativos
            </span>
            <span className="inline-flex items-center gap-1">
              <Swords className="w-4 h-4 text-[#8B5CF6]" />
              {activeQuestsCount} quests abertas
            </span>
          </div>
        </div>

        {/* Class Picker */}
        <div className="w-full lg:w-80">
          <label
            htmlFor="class-select"
            className="block text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 mb-1"
          >
            Turma Selecionada
          </label>
          <select
            id="class-select"
            value={state.selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="sketch-input font-bold bg-[#FAF8F5] shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
          >
            {state.classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={() => setTab("dojo")}
          className={`sketch-btn px-4 py-2.5 text-sm ${
            tab === "dojo"
              ? "bg-[#FACC15] text-zinc-950"
              : "bg-white text-zinc-700 hover:bg-amber-50"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Painel ClassDojo
        </button>

        <button
          type="button"
          onClick={() => setTab("attendance")}
          className={`sketch-btn px-4 py-2.5 text-sm ${
            tab === "attendance"
              ? "bg-[#3B82F6] text-white"
              : "bg-white text-zinc-700 hover:bg-blue-50"
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          Frequência & Notas (Activesoft)
        </button>

        <button
          type="button"
          onClick={() => setTab("quests")}
          className={`sketch-btn px-4 py-2.5 text-sm ${
            tab === "quests"
              ? "bg-[#8B5CF6] text-white"
              : "bg-white text-zinc-700 hover:bg-violet-50"
          }`}
        >
          <Swords className="w-4 h-4" />
          Gerenciador de Quests (Habitica)
        </button>

        <button
          type="button"
          onClick={() => setTab("salinha")}
          className={`sketch-btn px-4 py-2.5 text-sm ${
            tab === "salinha"
              ? "bg-[#10B981] text-zinc-950"
              : "bg-white text-zinc-700 hover:bg-emerald-50"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Salinha Híbrida (Moderação)
        </button>
      </div>

      {/* Active Teacher Workspace */}
      <div>
        {tab === "dojo" && <ClassDojoGrid />}
        {tab === "attendance" && <AttendancePanel />}
        {tab === "quests" && <QuestManager />}
        {tab === "salinha" && <SalinhaHub classId={selectedClass.id} />}
      </div>
    </div>
  );
}

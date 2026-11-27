"use client";

import React, { useState } from "react";
import { Compass, MessageSquare, Swords } from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { CharacterSheet } from "@/components/student/CharacterSheet";
import { DynamicPathView } from "@/components/student/DynamicPathView";
import { QuestsAndShop } from "@/components/student/QuestsAndShop";
import { HybridSpaceHub } from "@/components/shared/HybridSpaceHub";

export function StudentView() {
  const { state, currentAccount } = useLoloverse();
  const [workspaceTab, setWorkspaceTab] = useState<
    "percurso" | "missions" | "espaco"
  >("percurso");

  const student =
    state.students.find((s) => s.id === currentAccount?.studentId) ||
    state.students[0];
  const studentClass =
    state.classes.find((c) => c.id === student.classId) || state.classes[0];

  const activePathsCount = state.dynamicPaths.filter(
    (p) => p.classId === student.classId && p.active
  ).length;

  return (
    <div className="space-y-5">
      {/* Main 12-Col Responsive RPG + Percurso Dinâmico + Espaço Híbrido Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Character Sheet (Ficha RPG BNCC) */}
        <div className="lg:col-span-4">
          <CharacterSheet
            student={student}
            classNameTitle={studentClass.name}
          />
        </div>

        {/* Right: Percurso Dinâmico / Missões & Lojinha / Espaço Híbrido */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setWorkspaceTab("percurso")}
              className={`sketch-btn px-4 py-2.5 text-sm ${
                workspaceTab === "percurso"
                  ? "bg-[#FACC15] text-zinc-950"
                  : "bg-white text-zinc-700 hover:bg-amber-50"
              }`}
            >
              <Compass className="w-4 h-4" />
              Percurso Dinâmico
              {activePathsCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-white text-zinc-950 border border-zinc-900 rounded-md">
                  {activePathsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("missions")}
              className={`sketch-btn px-4 py-2.5 text-sm ${
                workspaceTab === "missions"
                  ? "bg-[#10B981] text-zinc-950"
                  : "bg-white text-zinc-700 hover:bg-emerald-50"
              }`}
            >
              <Swords className="w-4 h-4" />
              Missões & Lojinha
            </button>
            <button
              type="button"
              onClick={() => setWorkspaceTab("espaco")}
              className={`sketch-btn px-4 py-2.5 text-sm ${
                workspaceTab === "espaco"
                  ? "bg-[#8B5CF6] text-white"
                  : "bg-white text-zinc-700 hover:bg-violet-50"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Espaço Híbrido
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-[#FACC15] text-zinc-950 border border-zinc-900 rounded-md">
                {state.topics.length} tópicos
              </span>
            </button>
          </div>

          {workspaceTab === "percurso" ? (
            <DynamicPathView student={student} />
          ) : workspaceTab === "missions" ? (
            <QuestsAndShop student={student} />
          ) : (
            <HybridSpaceHub classId={student.classId} />
          )}
        </div>
      </div>
    </div>
  );
}

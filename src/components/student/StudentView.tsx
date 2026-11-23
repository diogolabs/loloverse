"use client";

import React, { useState } from "react";
import { MessageSquare, Swords } from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { CharacterSheet } from "@/components/student/CharacterSheet";
import { QuestsAndShop } from "@/components/student/QuestsAndShop";
import { SalinhaHub } from "@/components/student/SalinhaHub";

export function StudentView() {
  const { state, currentAccount } = useLoloverse();
  const [workspaceTab, setWorkspaceTab] = useState<"missions" | "salinha">(
    "missions"
  );

  const student =
    state.students.find((s) => s.id === currentAccount?.studentId) ||
    state.students[0];
  const studentClass =
    state.classes.find((c) => c.id === student.classId) || state.classes[0];

  return (
    <div className="space-y-5">
      {/* Main 12-Col Responsive RPG + Salinha Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Character Sheet */}
        <div className="lg:col-span-4">
          <CharacterSheet
            student={student}
            classNameTitle={studentClass.name}
          />
        </div>

        {/* Right: Quests/Shop OR Salinha Híbrida */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
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
              onClick={() => setWorkspaceTab("salinha")}
              className={`sketch-btn px-4 py-2.5 text-sm ${
                workspaceTab === "salinha"
                  ? "bg-[#8B5CF6] text-white"
                  : "bg-white text-zinc-700 hover:bg-violet-50"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Salinha Híbrida (Discord)
              <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-[#FACC15] text-zinc-950 border border-zinc-900 rounded-md">
                {state.channels.length} canais
              </span>
            </button>
          </div>

          {workspaceTab === "missions" ? (
            <QuestsAndShop student={student} />
          ) : (
            <SalinhaHub classId={student.classId} />
          )}
        </div>
      </div>
    </div>
  );
}

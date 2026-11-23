"use client";

import React, { useState } from "react";
import { Scale, ShieldAlert } from "lucide-react";
import { ExecutiveKpis } from "@/components/coordinator/ExecutiveKpis";
import { AttentionRadar } from "@/components/coordinator/AttentionRadar";
import { EconomyAudit } from "@/components/coordinator/EconomyAudit";

export function CoordinatorView() {
  const [tab, setTab] = useState<"radar" | "economy">("radar");

  return (
    <div className="space-y-6">
      {/* Coordinator Header */}
      <section className="sketch-card p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#8B5CF6] text-white border-2 border-zinc-900 rounded-lg text-xs font-extrabold uppercase tracking-wider">
            Visão do Coordenador · Governança & Inteligência Escolar
          </div>
          <h1 className="font-hand text-3xl sm:text-4xl text-zinc-900 leading-tight mt-1">
            Painel Executivo · Coord. Helena Prado
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 font-medium">
            Monitoramento preventivo de evasão (Octalysis CD8), auditoria pedagógica e equilíbrio da economia de Ouro.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("radar")}
            className={`sketch-btn px-4 py-2.5 text-sm ${
              tab === "radar"
                ? "bg-[#F43F5E] text-white"
                : "bg-white text-zinc-700 hover:bg-rose-50"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Radar de Atenção (CD8)
          </button>
          <button
            type="button"
            onClick={() => setTab("economy")}
            className={`sketch-btn px-4 py-2.5 text-sm ${
              tab === "economy"
                ? "bg-[#8B5CF6] text-white"
                : "bg-white text-zinc-700 hover:bg-violet-50"
            }`}
          >
            <Scale className="w-4 h-4" />
            Auditoria & Economia
          </button>
        </div>
      </section>

      {/* Executive KPIs always visible */}
      <ExecutiveKpis />

      {/* Active Coordinator Section */}
      {tab === "radar" ? <AttentionRadar /> : <EconomyAudit />}
    </div>
  );
}

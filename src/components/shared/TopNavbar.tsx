"use client";

import React, { useState } from "react";
import {
  Gamepad2,
  GraduationCap,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { Persona } from "@/types";

export function TopNavbar() {
  const { state, persona, setPersona, resetDemoData } = useLoloverse();
  const [confirmReset, setConfirmReset] = useState(false);

  const atRiskCount = state.students.filter(
    (s) => s.hp <= 55 || s.attendanceRate < 78 || s.previousAverage - s.bimesterAverage >= 1.0
  ).length;

  const activeStudent =
    state.students.find((s) => s.id === state.activeStudentId) || state.students[0];

  const personas: {
    id: Persona;
    label: string;
    shortLabel: string;
    subtitle: string;
    icon: React.ReactNode;
    activeBg: string;
    badge?: string;
  }[] = [
    {
      id: "teacher",
      label: "Professor",
      shortLabel: "Prof.",
      subtitle: "Sala & Quests",
      icon: <GraduationCap className="w-4 h-4" />,
      activeBg: "bg-[#FACC15] text-zinc-900",
    },
    {
      id: "student",
      label: "Aluno",
      shortLabel: "Aluno",
      subtitle: activeStudent ? `${activeStudent.name.split(" ")[0]} · Nv.${activeStudent.level}` : "RPG & Salinha",
      icon: <Gamepad2 className="w-4 h-4" />,
      activeBg: "bg-[#10B981] text-zinc-950",
    },
    {
      id: "coordinator",
      label: "Coordenador",
      shortLabel: "Coord.",
      subtitle: "Governança & Radar",
      icon: <ShieldCheck className="w-4 h-4" />,
      activeBg: "bg-[#8B5CF6] text-white",
      badge: atRiskCount > 0 ? String(atRiskCount) : undefined,
    },
  ];

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    resetDemoData();
    setConfirmReset(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/95 backdrop-blur-sm border-b-2 border-zinc-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Hand-drawn Logo */}
        <button
          type="button"
          onClick={() => setPersona("teacher")}
          className="flex items-center gap-2.5 group text-left"
        >
          <div className="relative w-10 h-10 rounded-xl bg-[#FACC15] border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center group-hover:-rotate-3 transition-transform">
            <svg
              viewBox="0 0 36 36"
              className="w-7 h-7"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M7 9C7 7.8 8 7 9.2 7H15.5C18.5 7 20 9 20 11.5V27C18 25.5 15.5 25 12 25H8.5C7.7 25 7 24.3 7 23.5V9Z"
                fill="#FFFFFF"
                stroke="#18181B"
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
              <path
                d="M29 9C29 7.8 28 7 26.8 7H20.5C18 7 16.5 9 16.5 11.5V27C18.5 25.5 21 25 24.5 25H27.5C28.3 25 29 24.3 29 23.5V9Z"
                fill="#3B82F6"
                fillOpacity="0.22"
                stroke="#18181B"
                strokeWidth="2.3"
                strokeLinejoin="round"
              />
              <path
                d="M18 11L19.6 14.8L23.7 15.2L20.5 17.9L21.5 22L18 19.8L14.5 22L15.5 17.9L12.3 15.2L16.4 14.8L18 11Z"
                fill="#F43F5E"
                stroke="#18181B"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-hand text-2xl sm:text-3xl leading-none tracking-wide text-zinc-900">
                Loloverse
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-[#FACC15] rounded-md">
                <Sparkles className="w-2.5 h-2.5" />
                Octalysis
              </span>
            </div>
            <p className="text-[11px] font-medium text-zinc-600 leading-tight hidden sm:block">
              Colégio Horizonte Maker · MVP Interativo
            </p>
          </div>
        </button>

        {/* Prominent Persona Switcher */}
        <nav
          aria-label="Seletor de Visão"
          className="order-3 lg:order-2 w-full lg:w-auto flex items-center justify-center"
        >
          <div className="inline-flex w-full sm:w-auto items-center p-1 gap-1.5 bg-white border-2 border-zinc-900 rounded-2xl shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]">
            {personas.map((item) => {
              const isActive = persona === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPersona(item.id)}
                  className={`relative flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer ${
                    isActive
                      ? `${item.activeBg} border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]`
                      : "border-transparent text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  {item.icon}
                  <div className="text-left leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="sm:hidden">{item.shortLabel}</span>
                      <span className="hidden sm:inline">{item.label}</span>
                      {item.badge && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-extrabold bg-[#F43F5E] text-white border border-zinc-900 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`hidden md:block text-[10px] font-semibold ${
                        isActive && item.id === "coordinator"
                          ? "text-violet-100"
                          : "text-zinc-600"
                      }`}
                    >
                      {item.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Discreet Reset Demo Button */}
        <div className="order-2 lg:order-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-bold rounded-xl border-2 transition-all active:translate-x-[1px] active:translate-y-[1px] ${
              confirmReset
                ? "bg-[#F43F5E] text-white border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                : "bg-white/80 text-zinc-600 border-zinc-300 hover:border-zinc-900 hover:text-zinc-900"
            }`}
            title="Restaurar todos os dados iniciais da demonstração"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">
              {confirmReset ? "Confirmar Reset?" : "Resetar Dados da Demo"}
            </span>
            <span className="sm:hidden">{confirmReset ? "Confirmar?" : "Reset"}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

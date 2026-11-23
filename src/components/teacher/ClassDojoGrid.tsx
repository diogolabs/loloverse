"use client";

import React, { useState } from "react";
import {
  Award,
  Coins,
  Compass,
  EyeOff,
  FileWarning,
  Heart,
  HeartHandshake,
  Lightbulb,
  ShieldAlert,
  Sparkles,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { BEHAVIOR_PRESETS } from "@/data/mockData";
import { BehaviorPreset, Student } from "@/types";
import { SketchAvatar } from "@/components/shared/SketchAvatar";
import { OctalysisBadge } from "@/components/shared/OctalysisBadge";

function PresetIcon({ name }: { name: string }) {
  const cls = "w-5 h-5 shrink-0";
  switch (name) {
    case "Users":
      return <Users className={cls} />;
    case "Lightbulb":
      return <Lightbulb className={cls} />;
    case "HeartHandshake":
      return <HeartHandshake className={cls} />;
    case "Award":
      return <Award className={cls} />;
    case "Compass":
      return <Compass className={cls} />;
    case "FileWarning":
      return <FileWarning className={cls} />;
    case "EyeOff":
      return <EyeOff className={cls} />;
    case "ShieldAlert":
      return <ShieldAlert className={cls} />;
    default:
      return <Sparkles className={cls} />;
  }
}

export function ClassDojoGrid() {
  const { state, applyBehaviorFeedback } = useLoloverse();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"positive" | "alert">("positive");

  const classStudents = state.students.filter(
    (s) => s.classId === state.selectedClassId
  );

  const selectedStudent: Student | undefined = state.students.find(
    (s) => s.id === selectedStudentId
  );

  const positivePresets = BEHAVIOR_PRESETS.filter((p) => p.type === "positive");
  const alertPresets = BEHAVIOR_PRESETS.filter((p) => p.type === "alert");

  const handleApply = (preset: BehaviorPreset) => {
    if (!selectedStudent) return;
    applyBehaviorFeedback(selectedStudent.id, preset);
    setSelectedStudentId(null);
  };

  return (
    <div className="space-y-4">
      {/* Header banner */}
      <div className="sketch-card p-4 bg-[#FFFBEB] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-hand text-2xl text-zinc-900 leading-tight">
            Painel ClassDojo · Feedback Comportamental Instantâneo
          </h2>
          <p className="text-xs sm:text-sm text-zinc-700">
            Clique em qualquer estudante para conceder <strong>XP / Ouro</strong> ou registrar um{" "}
            <strong>Alerta de Saúde Acadêmica (-HP)</strong>. Tudo reflete na hora na ficha do aluno!
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#10B981] text-zinc-950 border-2 border-zinc-900 rounded-lg">
            <Sparkles className="w-3.5 h-3.5" /> +XP & Ouro
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F43F5E] text-white border-2 border-zinc-900 rounded-lg">
            <Heart className="w-3.5 h-3.5" /> Alertas -HP
          </span>
        </div>
      </div>

      {/* Grid of Student Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {classStudents.map((student) => {
          const hpPercent = Math.round((student.hp / student.maxHp) * 100);
          const xpPercent = Math.min(
            100,
            Math.round((student.xp / student.xpToNext) * 100)
          );
          const isLowHp = student.hp <= 55;

          return (
            <button
              key={student.id}
              type="button"
              onClick={() => {
                setSelectedStudentId(student.id);
                setActiveTab("positive");
              }}
              className={`group text-left sketch-card p-4 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
                isLowHp ? "bg-rose-50/80" : "bg-white"
              }`}
            >
              {/* Top Row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <SketchAvatar
                    seed={student.avatarSeed}
                    bgColor={student.avatarColor}
                    size="md"
                    statusDot={student.onlineStatus}
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-zinc-900 truncate group-hover:text-[#3B82F6] transition-colors">
                      {student.name}
                    </h3>
                    <p className="text-[11px] font-semibold text-zinc-500 truncate">
                      {student.roleTitle}
                    </p>
                  </div>
                </div>
                <span className="shrink-0 font-hand text-base px-2 py-0.5 bg-[#FACC15] border-2 border-zinc-900 rounded-lg font-bold shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                  Nv.{student.level}
                </span>
              </div>

              {/* HP Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1 text-zinc-700">
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isLowHp
                          ? "text-[#F43F5E] fill-[#F43F5E]"
                          : "text-[#10B981] fill-[#10B981]"
                      }`}
                    />
                    HP Acadêmico
                  </span>
                  <span className={isLowHp ? "text-[#F43F5E]" : "text-zinc-800"}>
                    {student.hp}/{student.maxHp}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-zinc-200 border-2 border-zinc-900 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      hpPercent <= 50
                        ? "bg-[#F43F5E]"
                        : hpPercent <= 75
                        ? "bg-[#FACC15]"
                        : "bg-[#10B981]"
                    }`}
                    style={{ width: `${hpPercent}%` }}
                  />
                </div>
              </div>

              {/* XP Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="inline-flex items-center gap-1 text-zinc-700">
                    <Zap className="w-3.5 h-3.5 text-[#3B82F6] fill-[#3B82F6]" />
                    XP
                  </span>
                  <span className="text-zinc-600">
                    {student.xp}/{student.xpToNext}
                  </span>
                </div>
                <div className="w-full h-2 bg-zinc-200 border border-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3B82F6] transition-all duration-300"
                    style={{ width: `${xpPercent}%` }}
                  />
                </div>
              </div>

              {/* Footer stats */}
              <div className="pt-2 border-t-2 border-dashed border-zinc-200 flex items-center justify-between text-xs font-bold">
                <span className="inline-flex items-center gap-1 text-amber-700">
                  <Coins className="w-3.5 h-3.5 text-amber-500" />
                  {student.gold} Ouro
                </span>
                <span className="text-[11px] text-zinc-500 group-hover:text-zinc-900 font-bold">
                  Dar feedback →
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Quick Feedback Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setSelectedStudentId(null)}
        >
          <div
            className="animate-pop-in sketch-card w-full max-w-xl bg-[#FAF8F5] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-white border-b-2 border-zinc-900 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SketchAvatar
                  seed={selectedStudent.avatarSeed}
                  bgColor={selectedStudent.avatarColor}
                  size="md"
                />
                <div>
                  <h3 className="font-hand text-2xl leading-none text-zinc-900">
                    {selectedStudent.name}
                  </h3>
                  <p className="text-xs font-semibold text-zinc-600 mt-1">
                    Nível {selectedStudent.level} · {selectedStudent.hp} HP ·{" "}
                    {selectedStudent.gold} Ouro
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentId(null)}
                className="sketch-btn-sm p-1.5 bg-white hover:bg-zinc-100"
                aria-label="Fechar modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Positive vs Alert Switcher */}
            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("positive")}
                  className={`sketch-btn py-2.5 text-sm ${
                    activeTab === "positive"
                      ? "bg-[#10B981] text-zinc-950"
                      : "bg-white text-zinc-700 hover:bg-emerald-50"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  Pontos Positivos
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("alert")}
                  className={`sketch-btn py-2.5 text-sm ${
                    activeTab === "alert"
                      ? "bg-[#F43F5E] text-white"
                      : "bg-white text-zinc-700 hover:bg-rose-50"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  Alertas Comportamentais
                </button>
              </div>

              {/* Preset Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(activeTab === "positive" ? positivePresets : alertPresets).map(
                  (preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleApply(preset)}
                      className={`text-left p-3.5 rounded-xl border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${
                        preset.type === "positive"
                          ? "bg-white hover:bg-emerald-50"
                          : "bg-white hover:bg-rose-50"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className={`p-2 rounded-lg border-2 border-zinc-900 ${
                            preset.type === "positive"
                              ? "bg-[#FACC15]"
                              : "bg-[#F43F5E] text-white"
                          }`}
                        >
                          <PresetIcon name={preset.iconName} />
                        </div>
                        <OctalysisBadge pillar={preset.pillar} compact />
                      </div>

                      <h4 className="font-hand text-xl text-zinc-900 mt-2.5 leading-tight">
                        {preset.label}
                      </h4>
                      <p className="text-xs text-zinc-600 mt-0.5">
                        {preset.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {preset.xpDelta !== 0 && (
                          <span className="px-2 py-0.5 text-[11px] font-extrabold bg-blue-100 text-blue-900 border border-zinc-900 rounded-md">
                            +{preset.xpDelta} XP
                          </span>
                        )}
                        {preset.goldDelta !== 0 && (
                          <span className="px-2 py-0.5 text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-zinc-900 rounded-md">
                            +{preset.goldDelta} Ouro
                          </span>
                        )}
                        {preset.hpDelta !== 0 && (
                          <span
                            className={`px-2 py-0.5 text-[11px] font-extrabold border border-zinc-900 rounded-md ${
                              preset.hpDelta > 0
                                ? "bg-emerald-100 text-emerald-900"
                                : "bg-rose-200 text-rose-950"
                            }`}
                          >
                            {preset.hpDelta > 0
                              ? `+${preset.hpDelta} HP`
                              : `${preset.hpDelta} HP`}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

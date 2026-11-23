"use client";

import React from "react";
import {
  Award,
  Coins,
  Flame,
  Heart,
  Sparkles,
  Zap,
} from "lucide-react";
import { PILLAR_META } from "@/data/mockData";
import { EngagementPillar, Student } from "@/types";
import { SketchAvatar } from "@/components/shared/SketchAvatar";

interface CharacterSheetProps {
  student: Student;
  classNameTitle: string;
}

function CompetencyRadar({ stats }: { stats: Student["pillars"] }) {
  // 4-axis diamond radar chart (Proposito top, Maestria right, Criatividade bottom, Social left)
  const cx = 100;
  const cy = 100;
  const maxR = 68;

  const pTop = (stats.proposito / 100) * maxR;
  const pRight = (stats.maestria / 100) * maxR;
  const pBottom = (stats.criatividade / 100) * maxR;
  const pLeft = (stats.social / 100) * maxR;

  const points = [
    `${cx},${cy - pTop}`,
    `${cx + pRight},${cy}`,
    `${cx},${cy + pBottom}`,
    `${cx - pLeft},${cy}`,
  ].join(" ");

  const rings = [0.33, 0.66, 1];

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 200 200"
        className="w-48 h-48 overflow-visible"
        aria-label="Bússola de Competências do Estudante"
      >
        {/* Concentric diamond rings */}
        {rings.map((ratio) => {
          const r = maxR * ratio;
          return (
            <polygon
              key={ratio}
              points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`}
              fill={ratio === 1 ? "#FAF8F5" : "none"}
              stroke="#18181B"
              strokeWidth={ratio === 1 ? "1.8" : "1"}
              strokeDasharray={ratio === 1 ? undefined : "3 3"}
              strokeOpacity={ratio === 1 ? "0.7" : "0.3"}
            />
          );
        })}

        {/* Axis lines */}
        <line
          x1={cx}
          y1={cy - maxR}
          x2={cx}
          y2={cy + maxR}
          stroke="#18181B"
          strokeOpacity="0.25"
          strokeWidth="1.2"
        />
        <line
          x1={cx - maxR}
          y1={cy}
          x2={cx + maxR}
          y2={cy}
          stroke="#18181B"
          strokeOpacity="0.25"
          strokeWidth="1.2"
        />

        {/* Student Competency Polygon */}
        <polygon
          points={points}
          fill="#8B5CF6"
          fillOpacity="0.32"
          stroke="#18181B"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Vertices dots */}
        <circle cx={cx} cy={cy - pTop} r="4.5" fill="#8B5CF6" stroke="#18181B" strokeWidth="2" />
        <circle cx={cx + pRight} cy={cy} r="4.5" fill="#3B82F6" stroke="#18181B" strokeWidth="2" />
        <circle cx={cx} cy={cy + pBottom} r="4.5" fill="#FACC15" stroke="#18181B" strokeWidth="2" />
        <circle cx={cx - pLeft} cy={cy} r="4.5" fill="#10B981" stroke="#18181B" strokeWidth="2" />

        {/* Axis labels */}
        <text
          x={cx}
          y={18}
          textAnchor="middle"
          className="fill-zinc-900 text-[11px] font-bold"
        >
          Propósito ({stats.proposito})
        </text>
        <text
          x={196}
          y={cy + 4}
          textAnchor="end"
          className="fill-zinc-900 text-[11px] font-bold"
        >
          Maestria
        </text>
        <text
          x={cx}
          y={192}
          textAnchor="middle"
          className="fill-zinc-900 text-[11px] font-bold"
        >
          Criatividade ({stats.criatividade})
        </text>
        <text
          x={4}
          y={cy + 4}
          textAnchor="start"
          className="fill-zinc-900 text-[11px] font-bold"
        >
          Social
        </text>
      </svg>
    </div>
  );
}

export function CharacterSheet({
  student,
  classNameTitle,
}: CharacterSheetProps) {
  const hpPercent = Math.round((student.hp / student.maxHp) * 100);
  const xpPercent = Math.min(
    100,
    Math.round((student.xp / student.xpToNext) * 100)
  );

  const pillars: EngagementPillar[] = [
    "proposito",
    "maestria",
    "criatividade",
    "social",
  ];

  return (
    <aside className="sketch-card p-5 bg-white space-y-5 relative overflow-hidden">
      {/* Decorative notebook tape */}
      <div className="absolute -top-2 right-8 w-16 h-5 bg-[#FACC15]/80 border-2 border-zinc-900 rotate-3" />

      {/* Identity Header */}
      <div className="flex items-center gap-4">
        <SketchAvatar
          seed={student.avatarSeed}
          bgColor={student.avatarColor}
          size="xl"
          statusDot={student.onlineStatus}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className="font-hand text-lg px-2 py-0.5 bg-[#FACC15] border-2 border-zinc-900 rounded-lg font-bold shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
              Nível {student.level}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-extrabold bg-orange-100 text-orange-900 border-2 border-zinc-900 rounded-lg">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
              {student.streakDays}d
            </span>
          </div>
          <h2 className="font-hand text-3xl leading-none text-zinc-900 truncate">
            {student.name}
          </h2>
          <p className="text-xs font-bold text-[#8B5CF6] mt-0.5">
            {student.roleTitle}
          </p>
          <p className="text-[11px] font-semibold text-zinc-500 truncate mt-0.5">
            {classNameTitle}
          </p>
        </div>
      </div>

      {/* Gold + Academic Quick Ribbon */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-xl bg-amber-100 border-2 border-zinc-900 text-center shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <div className="flex items-center justify-center gap-1 text-[11px] font-extrabold text-amber-900">
            <Coins className="w-3.5 h-3.5" /> OURO
          </div>
          <p className="font-hand text-2xl leading-tight text-zinc-900">
            {student.gold}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-100 border-2 border-zinc-900 text-center shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <div className="text-[11px] font-extrabold text-blue-900">MÉDIA</div>
          <p className="font-hand text-2xl leading-tight text-zinc-900">
            {student.bimesterAverage.toFixed(1)}
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-100 border-2 border-zinc-900 text-center shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
          <div className="text-[11px] font-extrabold text-emerald-900">FREQ.</div>
          <p className="font-hand text-2xl leading-tight text-zinc-900">
            {student.attendanceRate}%
          </p>
        </div>
      </div>

      {/* HP & XP Vital Bars */}
      <div className="space-y-3 p-3.5 rounded-xl bg-[#FAF8F5] border-2 border-zinc-900">
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="inline-flex items-center gap-1.5 text-zinc-900">
              <Heart className="w-4 h-4 text-[#F43F5E] fill-[#F43F5E]" />
              HP · Saúde Acadêmica
            </span>
            <span className={hpPercent <= 55 ? "text-[#F43F5E]" : "text-zinc-900"}>
              {student.hp} / {student.maxHp}
            </span>
          </div>
          <div className="w-full h-3.5 bg-white border-2 border-zinc-900 rounded-full overflow-hidden">
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
          {hpPercent <= 55 && (
            <p className="text-[11px] font-bold text-[#F43F5E]">
              Atenção: conclua missões ou participe do Espaço Híbrido para recuperar HP!
            </p>
          )}
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="inline-flex items-center gap-1.5 text-zinc-900">
              <Zap className="w-4 h-4 text-[#3B82F6] fill-[#3B82F6]" />
              Experiência (XP)
            </span>
            <span className="text-zinc-700">
              {student.xp} / {student.xpToNext}
            </span>
          </div>
          <div className="w-full h-3 bg-white border-2 border-zinc-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#3B82F6] transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Competency Attributes */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-hand text-2xl leading-none text-zinc-900 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
            Bússola de Competências
          </h3>
          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-violet-100 border border-zinc-900 rounded-md">
            Perfil Escolar
          </span>
        </div>

        <CompetencyRadar stats={student.pillars} />

        <div className="space-y-2">
          {pillars.map((pillar) => {
            const meta = PILLAR_META[pillar];
            const val = student.pillars[pillar];
            return (
              <div key={pillar} className="space-y-0.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-zinc-800">{meta.shortLabel}</span>
                  <span className="text-zinc-600">{val}/100</span>
                </div>
                <div className="w-full h-2 bg-zinc-200 border border-zinc-900 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${val}%`, backgroundColor: meta.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badges */}
      <div className="pt-3 border-t-2 border-dashed border-zinc-200">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 mb-2 flex items-center gap-1">
          <Award className="w-3.5 h-3.5 text-zinc-700" />
          Insígnias Conquistadas
        </p>
        <div className="flex flex-wrap gap-1.5">
          {student.badges.map((badge) => (
            <span
              key={badge}
              className="px-2 py-0.5 text-xs font-bold bg-[#FAF8F5] border-2 border-zinc-900 rounded-lg"
            >
              ★ {badge}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

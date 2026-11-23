"use client";

import React from "react";
import {
  Activity,
  CheckCircle2,
  Coins,
  Sparkles,
  Users,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";

export function ExecutiveKpis() {
  const { state } = useLoloverse();
  const totalStudents = Math.max(1, state.students.length);

  const avgAttendance = Math.round(
    state.students.reduce((acc, s) => acc + s.attendanceRate, 0) / totalStudents
  );

  const avgDelivery = Math.round(
    state.students.reduce((acc, s) => acc + s.deliveryRate, 0) / totalStudents
  );

  const avgEngagement = Math.round(
    state.students.reduce(
      (acc, s) =>
        acc +
        (s.pillars.proposito +
          s.pillars.maestria +
          s.pillars.criatividade +
          s.pillars.social) /
          4,
      0
    ) / totalStudents
  );

  const totalGoldInCirculation = state.students.reduce(
    (acc, s) => acc + s.gold,
    0
  );

  const presentToday = state.students.filter(
    (s) => s.attendanceToday === "presente"
  ).length;

  const kpis = [
    {
      label: "Frequência Média",
      value: `${avgAttendance}%`,
      sub: `${presentToday}/${state.students.length} presentes hoje`,
      bg: "bg-emerald-100",
      iconBg: "bg-[#10B981] text-zinc-950",
      icon: <Users className="w-5 h-5" />,
    },
    {
      label: "Índice de Engajamento",
      value: `${avgEngagement}/100`,
      sub: "Média das 4 competências da escola",
      bg: "bg-violet-100",
      iconBg: "bg-[#8B5CF6] text-white",
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      label: "Índice de Entregas",
      value: `${avgDelivery}%`,
      sub: `${state.quests.filter((q) => q.active).length} quests ativas na escola`,
      bg: "bg-blue-100",
      iconBg: "bg-[#3B82F6] text-white",
      icon: <CheckCircle2 className="w-5 h-5" />,
    },
    {
      label: "Economia de Ouro",
      value: `${totalGoldInCirculation}`,
      sub: `${state.redemptions.length} resgates registrados`,
      bg: "bg-amber-100",
      iconBg: "bg-[#FACC15] text-zinc-950",
      icon: <Coins className="w-5 h-5" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className={`sketch-card p-4 ${kpi.bg} flex flex-col justify-between gap-3`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">
              {kpi.label}
            </span>
            <div
              className={`p-2 rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] ${kpi.iconBg}`}
            >
              {kpi.icon}
            </div>
          </div>

          <div>
            <p className="font-hand text-4xl leading-none text-zinc-900">
              {kpi.value}
            </p>
            <p className="text-xs font-semibold text-zinc-700 mt-1.5 flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 shrink-0" />
              {kpi.sub}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

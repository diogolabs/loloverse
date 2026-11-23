"use client";

import React from "react";
import {
  Check,
  Clock,
  TrendingDown,
  TrendingUp,
  X,
  Heart,
  BookOpen,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { AttendanceStatus } from "@/types";
import { SketchAvatar } from "@/components/shared/SketchAvatar";

export function AttendancePanel() {
  const { state, updateAttendance } = useLoloverse();

  const classStudents = state.students.filter(
    (s) => s.classId === state.selectedClassId
  );

  const presentCount = classStudents.filter(
    (s) => s.attendanceToday === "presente"
  ).length;
  const lateCount = classStudents.filter(
    (s) => s.attendanceToday === "atraso"
  ).length;
  const absentCount = classStudents.filter(
    (s) => s.attendanceToday === "falta"
  ).length;
  const avgGrade =
    classStudents.length > 0
      ? (
          classStudents.reduce((acc, s) => acc + s.bimesterAverage, 0) /
          classStudents.length
        ).toFixed(1)
      : "0.0";

  const statusButtons: {
    status: AttendanceStatus;
    label: string;
    icon: React.ReactNode;
    activeClass: string;
  }[] = [
    {
      status: "presente",
      label: "Presente",
      icon: <Check className="w-3.5 h-3.5" />,
      activeClass: "bg-[#10B981] text-zinc-950 border-zinc-900",
    },
    {
      status: "atraso",
      label: "Atraso",
      icon: <Clock className="w-3.5 h-3.5" />,
      activeClass: "bg-[#FACC15] text-zinc-950 border-zinc-900",
    },
    {
      status: "falta",
      label: "Falta",
      icon: <X className="w-3.5 h-3.5" />,
      activeClass: "bg-[#F43F5E] text-white border-zinc-900",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Quick summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="sketch-card-sm p-3.5 bg-emerald-50">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
            Presentes Hoje
          </p>
          <p className="font-hand text-3xl text-zinc-900 mt-0.5">
            {presentCount}{" "}
            <span className="text-base font-sans font-semibold text-zinc-500">
              / {classStudents.length}
            </span>
          </p>
        </div>
        <div className="sketch-card-sm p-3.5 bg-amber-50">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
            Atrasos
          </p>
          <p className="font-hand text-3xl text-zinc-900 mt-0.5">{lateCount}</p>
        </div>
        <div className="sketch-card-sm p-3.5 bg-rose-50">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
            Faltas
          </p>
          <p className="font-hand text-3xl text-[#F43F5E] mt-0.5">
            {absentCount}
          </p>
        </div>
        <div className="sketch-card-sm p-3.5 bg-blue-50">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-600">
            Média Bimestral
          </p>
          <p className="font-hand text-3xl text-[#3B82F6] mt-0.5">{avgGrade}</p>
        </div>
      </div>

      {/* Attendance & Grades Table */}
      <div className="sketch-card overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 bg-[#FAF8F5] border-b-2 border-zinc-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#3B82F6]" />
            <div>
              <h2 className="font-hand text-2xl leading-none text-zinc-900">
                Diário de Classe & Frequência
              </h2>
              <p className="text-xs text-zinc-600 font-medium">
                Chamada sincronizada com a Saúde Acadêmica (HP) e Radar da Coordenação
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-xs font-bold bg-white border-2 border-zinc-900 rounded-lg">
            3º Bimestre · Aula de Hoje
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-zinc-900 bg-zinc-50 text-[11px] font-extrabold uppercase tracking-wider text-zinc-600">
                <th className="py-3 px-4">Estudante</th>
                <th className="py-3 px-4">Chamada de Hoje</th>
                <th className="py-3 px-4 text-center">Freq. Acumulada</th>
                <th className="py-3 px-4 text-center">Média Bimestral</th>
                <th className="py-3 px-4 text-center">Saúde (HP)</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-zinc-200">
              {classStudents.map((student) => {
                const gradeDelta = Number(
                  (student.bimesterAverage - student.previousAverage).toFixed(1)
                );
                const lowGrade = student.bimesterAverage < 6.5;
                const lowAttendance = student.attendanceRate < 80;

                return (
                  <tr
                    key={student.id}
                    className="hover:bg-[#FAF8F5]/70 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <SketchAvatar
                          seed={student.avatarSeed}
                          bgColor={student.avatarColor}
                          size="sm"
                        />
                        <div>
                          <p className="font-bold text-sm text-zinc-900">
                            {student.name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            Nv.{student.level} · {student.roleTitle}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="inline-flex items-center gap-1.5">
                        {statusButtons.map((btn) => {
                          const isSelected = student.attendanceToday === btn.status;
                          return (
                            <button
                              key={btn.status}
                              type="button"
                              onClick={() =>
                                updateAttendance(student.id, btn.status)
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border-2 transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                                isSelected
                                  ? `${btn.activeClass} shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]`
                                  : "bg-white text-zinc-600 border-zinc-300 hover:border-zinc-900 hover:text-zinc-900"
                              }`}
                            >
                              {btn.icon}
                              <span className="hidden sm:inline">{btn.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold border-2 border-zinc-900 ${
                          lowAttendance
                            ? "bg-rose-200 text-rose-950"
                            : "bg-emerald-100 text-emerald-950"
                        }`}
                      >
                        {student.attendanceRate}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`font-hand text-xl font-bold ${
                            lowGrade ? "text-[#F43F5E]" : "text-zinc-900"
                          }`}
                        >
                          {student.bimesterAverage.toFixed(1)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md ${
                            gradeDelta >= 0
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-700"
                          }`}
                          title={`Bimestre anterior: ${student.previousAverage.toFixed(1)}`}
                        >
                          {gradeDelta >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {gradeDelta >= 0 ? `+${gradeDelta}` : gradeDelta}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Heart
                          className={`w-4 h-4 ${
                            student.hp <= 55
                              ? "text-[#F43F5E] fill-[#F43F5E]"
                              : "text-emerald-600 fill-emerald-500"
                          }`}
                        />
                        <span className="text-xs font-extrabold text-zinc-800">
                          {student.hp}/{student.maxHp}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

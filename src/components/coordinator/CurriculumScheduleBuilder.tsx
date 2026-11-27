"use client";

import React, { useState } from "react";
import { CalendarDays, Plus, Trash2, Users } from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { BNCC_ATTRIBUTE_KEYS, BNCC_ATTRIBUTE_META } from "@/data/bnccAndPaths";
import { WEEK_DAYS } from "@/data/mockData";
import { Account, BnccAttributeKey, ClassRoom, WeekDay } from "@/types";
import { PillarBadge } from "@/components/shared/PillarBadge";

interface CurriculumScheduleBuilderProps {
  scopedClasses: ClassRoom[];
  scopedTeachers: Account[];
}

const TIME_SLOTS = [1, 2, 3, 4, 5, 6];

export function CurriculumScheduleBuilder({
  scopedClasses,
  scopedTeachers,
}: CurriculumScheduleBuilderProps) {
  const { state, upsertScheduleSlot, deleteScheduleSlot } = useLoloverse();

  const [selectedClassId, setSelectedClassId] = useState(
    scopedClasses[0]?.id || ""
  );
  const [dayOfWeek, setDayOfWeek] = useState<WeekDay>("seg");
  const [slotIndex, setSlotIndex] = useState<number>(1);
  const [subject, setSubject] = useState("");
  const [teacherId, setTeacherId] = useState(scopedTeachers[0]?.id || "");
  const [room, setRoom] = useState(scopedClasses[0]?.room || "Sala 01");
  const [bnccFocus, setBnccFocus] = useState<BnccAttributeKey>("con");

  const activeClass =
    scopedClasses.find((c) => c.id === selectedClassId) ||
    scopedClasses[0] ||
    null;

  if (!activeClass) {
    return (
      <div className="sketch-card p-6 bg-white text-center text-sm text-zinc-600">
        Nenhuma turma encontrada no seu segmento e turno de coordenação.
      </div>
    );
  }

  const classSlots = state.scheduleSlots.filter(
    (s) => s.classId === activeClass.id
  );

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    const teacher = scopedTeachers.find((t) => t.id === teacherId);
    upsertScheduleSlot({
      classId: activeClass.id,
      dayOfWeek,
      slotIndex,
      subject,
      teacherId: teacher?.id,
      teacherName: teacher?.displayName || "Docente a definir",
      room: room.trim() || activeClass.room,
      bnccFocus,
    });
    setSubject("");
  };

  const teacherHours = scopedTeachers.map((t) => ({
    teacher: t,
    count: state.scheduleSlots.filter((s) => s.teacherId === t.id).length,
  }));

  return (
    <div className="space-y-5">
      {/* Cabeçalho + Construtor Rápido */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <form
          onSubmit={handleSaveSlot}
          className="lg:col-span-4 sketch-card p-5 bg-[#FFFDF7] space-y-3 h-fit"
        >
          <div className="flex items-center gap-2 border-b-2 border-zinc-900 pb-2.5">
            <CalendarDays className="w-5 h-5 text-[#3B82F6]" />
            <div>
              <h3 className="font-hand text-2xl leading-none text-zinc-900">
                Alocar Aula na Grade
              </h3>
              <p className="text-[11px] text-zinc-600">
                Com detector automático de conflito docente.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
              Turma do Meu Escopo
            </label>
            <select
              value={activeClass.id}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const found = scopedClasses.find(
                  (c) => c.id === e.target.value
                );
                if (found?.room) setRoom(found.room);
              }}
              className="sketch-input bg-white text-xs font-bold"
            >
              {scopedClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.period})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Dia
              </label>
              <select
                value={dayOfWeek}
                onChange={(e) => setDayOfWeek(e.target.value as WeekDay)}
                className="sketch-input bg-white text-xs font-bold"
              >
                {WEEK_DAYS.map((d) => (
                  <option key={d.key} value={d.key}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Horário
              </label>
              <select
                value={slotIndex}
                onChange={(e) => setSlotIndex(Number(e.target.value))}
                className="sketch-input bg-white text-xs font-bold"
              >
                {TIME_SLOTS.map((n) => (
                  <option key={n} value={n}>
                    {n}º Horário
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
              Componente Curricular / Disciplina
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Matemática, História, Robótica..."
              className="sketch-input bg-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
              Professor do Turno/Segmento
            </label>
            <select
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="sketch-input bg-white text-xs font-semibold"
            >
              <option value="">Sem docente atribuído</option>
              {scopedTeachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.displayName} ({t.workShift || "Turno"})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Sala / Lab
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="sketch-input bg-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Foco BNCC
              </label>
              <select
                value={bnccFocus}
                onChange={(e) =>
                  setBnccFocus(e.target.value as BnccAttributeKey)
                }
                className="sketch-input bg-white text-xs font-bold"
              >
                {BNCC_ATTRIBUTE_KEYS.map((k) => (
                  <option key={k} value={k}>
                    {BNCC_ATTRIBUTE_META[k].code} ·{" "}
                    {BNCC_ATTRIBUTE_META[k].shortLabel}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="sketch-btn w-full py-2.5 bg-[#10B981] text-zinc-950 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            Salvar na Grade Semanal
          </button>
        </form>

        {/* Grade Semanal Visual */}
        <div className="lg:col-span-8 sketch-card overflow-hidden bg-white">
          <div className="px-4 py-3 bg-[#FAF8F5] border-b-2 border-zinc-900 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-hand text-2xl leading-none text-zinc-900">
              Grade Curricular · {activeClass.name} ({activeClass.period})
            </h3>
            <span className="px-2.5 py-0.5 text-xs font-extrabold bg-white border-2 border-zinc-900 rounded-lg">
              {classSlots.length} aula(s) alocadas
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b-2 border-zinc-900 bg-zinc-50 text-[11px] font-extrabold uppercase text-zinc-600">
                  <th className="py-2.5 px-2.5 w-16">Hor.</th>
                  {WEEK_DAYS.map((d) => (
                    <th key={d.key} className="py-2.5 px-2.5 min-w-[130px]">
                      {d.short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-xs">
                {TIME_SLOTS.map((slotNum) => (
                  <tr key={slotNum}>
                    <td className="py-2 px-2.5 font-hand text-lg font-bold text-zinc-700 bg-[#FAF8F5] border-r border-zinc-200">
                      {slotNum}º
                    </td>
                    {WEEK_DAYS.map((d) => {
                      const cell = classSlots.find(
                        (s) => s.dayOfWeek === d.key && s.slotIndex === slotNum
                      );
                      return (
                        <td
                          key={d.key}
                          className="p-1.5 align-top border-r border-zinc-100"
                        >
                          {cell ? (
                            <div className="p-2 rounded-xl bg-[#FFFDF7] border-2 border-zinc-900 space-y-1 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                              <div className="flex items-start justify-between gap-1">
                                <p className="font-extrabold text-[11px] text-zinc-900 leading-tight">
                                  {cell.subject}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => deleteScheduleSlot(cell.id)}
                                  className="text-zinc-400 hover:text-[#F43F5E]"
                                  title="Remover horário"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="text-[10px] font-semibold text-zinc-600 truncate">
                                {cell.teacherName}
                              </p>
                              <div className="flex items-center justify-between gap-1 pt-0.5">
                                <span className="text-[9px] font-bold text-zinc-500">
                                  {cell.room}
                                </span>
                                {cell.bnccFocus && (
                                  <PillarBadge
                                    bnccAttr={cell.bnccFocus}
                                    compact
                                  />
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setDayOfWeek(d.key);
                                setSlotIndex(slotNum);
                              }}
                              className="w-full h-14 rounded-xl border border-dashed border-zinc-300 hover:border-zinc-900 hover:bg-[#FAF8F5] text-[10px] font-bold text-zinc-400 hover:text-zinc-700 transition-colors"
                            >
                              + Alocar
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Carga Horária dos Docentes do Escopo */}
      <div className="sketch-card p-4 bg-[#FAF8F5] space-y-2.5">
        <p className="font-hand text-xl text-zinc-900 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-[#8B5CF6]" />
          Carga Alocada dos Docentes do Meu Turno/Segmento
        </p>
        <div className="flex flex-wrap gap-2">
          {teacherHours.map(({ teacher, count }) => (
            <div
              key={teacher.id}
              className="px-3 py-1.5 rounded-xl bg-white border-2 border-zinc-900 text-xs font-bold flex items-center gap-2"
            >
              <span>{teacher.displayName}</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 border border-zinc-900 text-[10px] font-extrabold">
                {count} aula(s)/sem
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

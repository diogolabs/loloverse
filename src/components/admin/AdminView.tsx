"use client";

import React, { useState } from "react";
import {
  Calculator,
  CheckCircle2,
  KeyRound,
  Plus,
  Scale,
  School,
  Search,
  ShieldCheck,
  Sliders,
  UserCog,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { SEGMENT_LABELS, WORK_SHIFT_OPTIONS } from "@/data/mockData";
import {
  GradingFormulaType,
  GradingPolicy,
  Persona,
  RoundingRule,
  SchoolSegment,
  WorkShift,
} from "@/types";
import { InviteManager } from "@/components/coordinator/InviteManager";
import { EconomyAudit } from "@/components/coordinator/EconomyAudit";
import { SketchAvatar } from "@/components/shared/SketchAvatar";

function simulateAverage(
  policy: {
    formulaType: GradingFormulaType;
    weightExams: number;
    weightActivities: number;
    weightDynamicPaths: number;
    rounding: RoundingRule;
  },
  exam: number,
  act: number,
  path: number
): number {
  let raw = 0;
  if (policy.formulaType === "aritmetica") {
    raw = (exam + act + path) / 3;
  } else if (policy.formulaType === "recuperacao_substitutiva") {
    const sorted = [exam, act, path].sort((a, b) => b - a);
    raw = (sorted[0] + sorted[1]) / 2;
  } else {
    const totalW = Math.max(
      1,
      policy.weightExams + policy.weightActivities + policy.weightDynamicPaths
    );
    raw =
      (exam * policy.weightExams +
        act * policy.weightActivities +
        path * policy.weightDynamicPaths) /
      totalW;
  }
  if (policy.rounding === "meio_ponto") {
    return Math.round(raw * 2) / 2;
  }
  if (policy.rounding === "decimo") {
    return Number(raw.toFixed(1));
  }
  return Number(raw.toFixed(2));
}

export function AdminView() {
  const {
    state,
    currentAccount,
    isBackendConnected,
    updateUserAccess,
    createClassRoom,
    updateClassRoom,
    saveGradingPolicy,
  } = useLoloverse();

  const [tab, setTab] = useState<
    "users" | "classes" | "formulas" | "invites" | "audit"
  >("users");

  // Filtros Contas & Permissões
  const [userSearch, setUserSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Persona>("all");

  // Nova Turma / Série
  const [clsCode, setClsCode] = useState("");
  const [clsName, setClsName] = useState("");
  const [clsGrade, setClsGrade] = useState("");
  const [clsSegment, setClsSegment] = useState<SchoolSegment>("fund2");
  const [clsPeriod, setClsPeriod] = useState<WorkShift>("Manhã");
  const [clsRoom, setClsRoom] = useState("");
  const [clsTeacherId, setClsTeacherId] = useState("");

  // Fórmula de Média
  const [editingPolicyId, setEditingPolicyId] = useState<string | undefined>(
    undefined
  );
  const [polName, setPolName] = useState("");
  const [polSegment, setPolSegment] = useState<SchoolSegment>("fund2");
  const [polTerm, setPolTerm] = useState<"bimestral" | "trimestral">("bimestral");
  const [polType, setPolType] = useState<GradingFormulaType>("ponderada");
  const [polPass, setPolPass] = useState(6.0);
  const [polWExams, setPolWExams] = useState(50);
  const [polWAct, setPolWAct] = useState(20);
  const [polWPaths, setPolWPaths] = useState(30);
  const [polRound, setPolRound] = useState<RoundingRule>("decimo");

  // Simulador
  const [simExam, setSimExam] = useState(7.5);
  const [simAct, setSimAct] = useState(8.5);
  const [simPath, setSimPath] = useState(9.0);

  const teachers = state.accounts.filter((a) => a.role === "teacher");

  const filteredAccounts = state.accounts.filter((acc) => {
    if (roleFilter !== "all" && acc.role !== roleFilter) return false;
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      acc.displayName.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      acc.username.toLowerCase().includes(q)
    );
  });

  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clsName.trim()) return;
    const chosenTeacher = teachers.find((t) => t.id === clsTeacherId);
    createClassRoom({
      code: clsCode || clsName,
      name: clsName,
      grade: clsGrade || clsName,
      segment: clsSegment,
      period: clsPeriod,
      room: clsRoom || "Sala 01",
      teacherId: chosenTeacher?.id,
      teacherName: chosenTeacher?.displayName || "Docente Titular",
    });
    setClsCode("");
    setClsName("");
    setClsGrade("");
    setClsRoom("");
  };

  const loadPolicyToForm = (p: GradingPolicy) => {
    setEditingPolicyId(p.id);
    setPolName(p.name);
    setPolSegment(p.segment);
    setPolTerm(p.termSystem);
    setPolType(p.formulaType);
    setPolPass(p.passingGrade);
    setPolWExams(p.weightExams);
    setPolWAct(p.weightActivities);
    setPolWPaths(p.weightDynamicPaths);
    setPolRound(p.rounding);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!polName.trim()) return;
    saveGradingPolicy({
      id: editingPolicyId,
      name: polName,
      segment: polSegment,
      termSystem: polTerm,
      formulaType: polType,
      passingGrade: polPass,
      weightExams: polWExams,
      weightActivities: polWAct,
      weightDynamicPaths: polWPaths,
      rounding: polRound,
      active: true,
    });
    setEditingPolicyId(undefined);
    setPolName("");
  };

  const totalWeights = polWExams + polWAct + polWPaths;
  const simulatedResult = simulateAverage(
    {
      formulaType: polType,
      weightExams: polWExams,
      weightActivities: polWAct,
      weightDynamicPaths: polWPaths,
      rounding: polRound,
    },
    simExam,
    simAct,
    simPath
  );

  return (
    <div className="space-y-6">
      {/* Header Exclusivo do Admin */}
      <section className="sketch-card p-5 bg-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-zinc-900 text-[#FACC15] border-2 border-zinc-900 rounded-lg text-xs font-extrabold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Administração do Sistema · Estrutura & Permissões
          </div>
          <h1 className="font-hand text-3xl sm:text-4xl text-zinc-900 leading-tight mt-1">
            Central do Administrador · {currentAccount?.displayName}
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 font-medium">
            Gerencie contas e permissões, segmentos/turnos, turmas e séries, fórmulas de média, convites e auditoria global.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setTab("users")}
            className={`sketch-btn px-3.5 py-2 text-xs sm:text-sm ${
              tab === "users"
                ? "bg-zinc-900 text-[#FACC15]"
                : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <UserCog className="w-4 h-4" />
            Contas & Permissões ({state.accounts.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("classes")}
            className={`sketch-btn px-3.5 py-2 text-xs sm:text-sm ${
              tab === "classes"
                ? "bg-[#3B82F6] text-white"
                : "bg-white text-zinc-700 hover:bg-blue-50"
            }`}
          >
            <School className="w-4 h-4" />
            Turmas & Séries ({state.classes.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("formulas")}
            className={`sketch-btn px-3.5 py-2 text-xs sm:text-sm ${
              tab === "formulas"
                ? "bg-[#8B5CF6] text-white"
                : "bg-white text-zinc-700 hover:bg-violet-50"
            }`}
          >
            <Calculator className="w-4 h-4" />
            Fórmulas de Média
          </button>
          {isBackendConnected && (
            <button
              type="button"
              onClick={() => setTab("invites")}
              className={`sketch-btn px-3.5 py-2 text-xs sm:text-sm ${
                tab === "invites"
                  ? "bg-[#FACC15] text-zinc-950"
                  : "bg-white text-zinc-700 hover:bg-amber-50"
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Convites
            </button>
          )}
          <button
            type="button"
            onClick={() => setTab("audit")}
            className={`sketch-btn px-3.5 py-2 text-xs sm:text-sm ${
              tab === "audit"
                ? "bg-[#10B981] text-zinc-950"
                : "bg-white text-zinc-700 hover:bg-emerald-50"
            }`}
          >
            <Scale className="w-4 h-4" />
            Auditoria & Economia
          </button>
        </div>
      </section>

      {/* ABA 1: CONTAS & PERMISSÕES (CARGO, SEGMENTO, TURNO, ATIVO) */}
      {tab === "users" && (
        <section className="sketch-card overflow-hidden bg-white">
          <div className="p-4 sm:p-5 bg-[#FAF8F5] border-b-2 border-zinc-900 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-hand text-2xl sm:text-3xl leading-none text-zinc-900">
                Contas de Usuário, Permissões & Escopo de Atuação
              </h2>
              <p className="text-xs text-zinc-600 mt-0.5">
                Defina o cargo, o segmento (ex.: Fundamental II) e o turno de trabalho de cada coordenador e professor.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar nome ou e-mail..."
                  className="sketch-input bg-white pl-8 py-1.5 text-xs w-52"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "all" | Persona)}
                className="sketch-input bg-white py-1.5 text-xs font-bold w-auto"
              >
                <option value="all">Todos os cargos</option>
                <option value="admin">Admin</option>
                <option value="coordinator">Coordenador</option>
                <option value="teacher">Professor</option>
                <option value="student">Aluno</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-zinc-900 bg-zinc-50 text-[11px] font-extrabold uppercase tracking-wider text-zinc-600">
                  <th className="py-3 px-4">Usuário</th>
                  <th className="py-3 px-3">Cargo</th>
                  <th className="py-3 px-3">Segmento</th>
                  <th className="py-3 px-3">Turno</th>
                  <th className="py-3 px-3">Turma</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-zinc-200 text-xs">
                {filteredAccounts.map((acc) => {
                  const isSelf = acc.id === currentAccount?.id;
                  return (
                    <tr key={acc.id} className="hover:bg-[#FAF8F5]/70">
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <SketchAvatar
                            seed={acc.avatarSeed}
                            bgColor={acc.avatarColor}
                            config={acc.avatarConfig}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 truncate">
                              {acc.displayName} {isSelf ? "(Você)" : ""}
                            </p>
                            <p className="text-[11px] font-mono text-zinc-500 truncate">
                              {acc.email || `@${acc.username}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          disabled={isSelf}
                          value={acc.role}
                          onChange={(e) =>
                            updateUserAccess(acc.id, {
                              role: e.target.value as Persona,
                            })
                          }
                          className="sketch-input py-1 px-2 text-xs font-bold bg-white disabled:opacity-60"
                        >
                          <option value="student">Aluno</option>
                          <option value="teacher">Professor</option>
                          <option value="coordinator">Coordenador</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={acc.segment || "todos"}
                          onChange={(e) =>
                            updateUserAccess(acc.id, {
                              segment: e.target.value as SchoolSegment,
                            })
                          }
                          className="sketch-input py-1 px-2 text-xs font-semibold bg-white"
                        >
                          {(Object.keys(SEGMENT_LABELS) as SchoolSegment[]).map(
                            (seg) => (
                              <option key={seg} value={seg}>
                                {SEGMENT_LABELS[seg]}
                              </option>
                            )
                          )}
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={acc.workShift || "Todos"}
                          onChange={(e) =>
                            updateUserAccess(acc.id, {
                              workShift: e.target.value as WorkShift,
                            })
                          }
                          className="sketch-input py-1 px-2 text-xs font-semibold bg-white"
                        >
                          {WORK_SHIFT_OPTIONS.map((sh) => (
                            <option key={sh} value={sh}>
                              {sh}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3">
                        <select
                          value={acc.classId || ""}
                          onChange={(e) =>
                            updateUserAccess(acc.id, {
                              classId: e.target.value,
                            })
                          }
                          className="sketch-input py-1 px-2 text-xs bg-white max-w-[170px]"
                        >
                          <option value="">Sem turma fixa</option>
                          {state.classes.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() =>
                            updateUserAccess(acc.id, {
                              active: acc.active === false,
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold border-2 border-zinc-900 disabled:opacity-50 ${
                            acc.active !== false
                              ? "bg-emerald-200 text-emerald-950"
                              : "bg-rose-200 text-rose-950"
                          }`}
                        >
                          {acc.active !== false ? "Ativo" : "Inativo"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ABA 2: TURMAS & SÉRIES */}
      {tab === "classes" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form
            onSubmit={handleCreateClass}
            className="lg:col-span-5 sketch-card p-5 bg-[#FFFDF7] space-y-3.5 h-fit"
          >
            <h2 className="font-hand text-2xl leading-none text-zinc-900 border-b-2 border-zinc-900 pb-2.5">
              Criar Nova Turma / Série
            </h2>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Código Único
                </label>
                <input
                  type="text"
                  value={clsCode}
                  onChange={(e) => setClsCode(e.target.value)}
                  placeholder="Ex: 7b-2026"
                  className="sketch-input bg-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Série / Ano
                </label>
                <input
                  type="text"
                  required
                  value={clsGrade}
                  onChange={(e) => setClsGrade(e.target.value)}
                  placeholder="Ex: 7º Ano EF"
                  className="sketch-input bg-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Nome Completo da Turma
              </label>
              <input
                type="text"
                required
                value={clsName}
                onChange={(e) => setClsName(e.target.value)}
                placeholder="Ex: 7º Ano B - Ciências & Cultura Maker"
                className="sketch-input bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Segmento
                </label>
                <select
                  value={clsSegment}
                  onChange={(e) =>
                    setClsSegment(e.target.value as SchoolSegment)
                  }
                  className="sketch-input bg-white text-xs font-bold"
                >
                  <option value="infantil">Educação Infantil</option>
                  <option value="fund1">Fundamental I</option>
                  <option value="fund2">Fundamental II</option>
                  <option value="em">Ensino Médio</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Turno
                </label>
                <select
                  value={clsPeriod}
                  onChange={(e) => setClsPeriod(e.target.value as WorkShift)}
                  className="sketch-input bg-white text-xs font-bold"
                >
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noite">Noite</option>
                  <option value="Integral">Integral</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Sala / Laboratório
                </label>
                <input
                  type="text"
                  value={clsRoom}
                  onChange={(e) => setClsRoom(e.target.value)}
                  placeholder="Ex: Sala 12"
                  className="sketch-input bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Docente Titular
                </label>
                <select
                  value={clsTeacherId}
                  onChange={(e) => setClsTeacherId(e.target.value)}
                  className="sketch-input bg-white text-xs font-semibold"
                >
                  <option value="">Definir depois</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="sketch-btn w-full py-2.5 bg-[#3B82F6] text-white text-sm"
            >
              <Plus className="w-4 h-4" />
              Criar Turma na Escola
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {state.classes.map((cls) => {
              const stuCount = state.students.filter(
                (s) => s.classId === cls.id
              ).length;
              return (
                <div
                  key={cls.id}
                  className="sketch-card p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-violet-100 text-violet-950 border border-zinc-900 rounded">
                        {SEGMENT_LABELS[cls.segment || "fund2"]}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 text-amber-950 border border-zinc-900 rounded">
                        {cls.period}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#FAF8F5] border border-zinc-400 rounded">
                        {cls.grade}
                      </span>
                    </div>
                    <h3 className="font-hand text-2xl leading-none text-zinc-900">
                      {cls.name}
                    </h3>
                    <p className="text-xs text-zinc-600">
                      {cls.teacherName} · {cls.room} ·{" "}
                      <strong>{stuCount} aluno(s)</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={cls.segment}
                      onChange={(e) =>
                        updateClassRoom(cls.id, {
                          segment: e.target.value as SchoolSegment,
                        })
                      }
                      className="sketch-input py-1 px-2 text-xs font-bold bg-[#FAF8F5] w-auto"
                    >
                      <option value="infantil">Infantil</option>
                      <option value="fund1">Fund I</option>
                      <option value="fund2">Fund II</option>
                      <option value="em">Ensino Médio</option>
                    </select>
                    <select
                      value={cls.period}
                      onChange={(e) =>
                        updateClassRoom(cls.id, {
                          period: e.target.value as WorkShift,
                        })
                      }
                      className="sketch-input py-1 px-2 text-xs font-bold bg-[#FAF8F5] w-auto"
                    >
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Noite">Noite</option>
                      <option value="Integral">Integral</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 3: FÓRMULAS DE MÉDIA & REGRAS AVALIATIVAS */}
      {tab === "formulas" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form
            onSubmit={handleSavePolicy}
            className="lg:col-span-6 sketch-card p-5 bg-[#FFFDF7] space-y-4"
          >
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-2.5">
              <h2 className="font-hand text-2xl leading-none text-zinc-900 flex items-center gap-1.5">
                <Sliders className="w-5 h-5 text-[#8B5CF6]" />
                {editingPolicyId
                  ? "Editar Fórmula de Média"
                  : "Configurar Fórmula de Média"}
              </h2>
              {editingPolicyId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPolicyId(undefined);
                    setPolName("");
                  }}
                  className="text-xs font-bold underline text-zinc-600"
                >
                  Nova regra
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Nome da Regra Institucional
              </label>
              <input
                type="text"
                required
                value={polName}
                onChange={(e) => setPolName(e.target.value)}
                placeholder="Ex: Regra Oficial · Fundamental II (2026)"
                className="sketch-input bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Segmento
                </label>
                <select
                  value={polSegment}
                  onChange={(e) =>
                    setPolSegment(e.target.value as SchoolSegment)
                  }
                  className="sketch-input bg-white text-xs font-bold"
                >
                  {(Object.keys(SEGMENT_LABELS) as SchoolSegment[]).map((s) => (
                    <option key={s} value={s}>
                      {SEGMENT_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Regime Letivo
                </label>
                <select
                  value={polTerm}
                  onChange={(e) =>
                    setPolTerm(e.target.value as "bimestral" | "trimestral")
                  }
                  className="sketch-input bg-white text-xs font-bold"
                >
                  <option value="bimestral">Bimestral (4 períodos)</option>
                  <option value="trimestral">Trimestral (3 períodos)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Fórmula
                </label>
                <select
                  value={polType}
                  onChange={(e) =>
                    setPolType(e.target.value as GradingFormulaType)
                  }
                  className="sketch-input bg-white text-xs font-bold"
                >
                  <option value="ponderada">Ponderada</option>
                  <option value="aritmetica">Aritmética</option>
                  <option value="recuperacao_substitutiva">
                    Descarta Menor
                  </option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Média Mínima
                </label>
                <input
                  type="number"
                  step={0.5}
                  min={4}
                  max={9}
                  value={polPass}
                  onChange={(e) => setPolPass(Number(e.target.value))}
                  className="sketch-input bg-white text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Arredondar
                </label>
                <select
                  value={polRound}
                  onChange={(e) => setPolRound(e.target.value as RoundingRule)}
                  className="sketch-input bg-white text-xs font-bold"
                >
                  <option value="decimo">0.1 (Décimo)</option>
                  <option value="meio_ponto">0.5 (Meio ponto)</option>
                  <option value="exato">Exato (0.01)</option>
                </select>
              </div>
            </div>

            {polType === "ponderada" && (
              <div className="p-3.5 rounded-xl bg-white border-2 border-zinc-900 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-extrabold">
                  <span>Pesos da Média Ponderada</span>
                  <span
                    className={
                      totalWeights === 100
                        ? "text-emerald-700"
                        : "text-[#F43F5E]"
                    }
                  >
                    Soma: {totalWeights}%
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600">
                      Provas (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={polWExams}
                      onChange={(e) => setPolWExams(Number(e.target.value))}
                      className="sketch-input py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600">
                      Atividades (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={polWAct}
                      onChange={(e) => setPolWAct(Number(e.target.value))}
                      className="sketch-input py-1 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-zinc-600">
                      Percursos (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={polWPaths}
                      onChange={(e) => setPolWPaths(Number(e.target.value))}
                      className="sketch-input py-1 text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Simulador ao Vivo */}
            <div className="p-3.5 rounded-xl bg-violet-50 border-2 border-zinc-900 space-y-2">
              <p className="text-[11px] font-extrabold uppercase text-violet-950">
                Simulador ao Vivo da Fórmula
              </p>
              <div className="grid grid-cols-4 gap-2 items-end">
                <div>
                  <label className="text-[10px] font-bold text-zinc-600">
                    Prova
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={10}
                    value={simExam}
                    onChange={(e) => setSimExam(Number(e.target.value))}
                    className="sketch-input bg-white py-1 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-600">
                    Ativid.
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={10}
                    value={simAct}
                    onChange={(e) => setSimAct(Number(e.target.value))}
                    className="sketch-input bg-white py-1 text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-zinc-600">
                    Percurso
                  </label>
                  <input
                    type="number"
                    step={0.5}
                    min={0}
                    max={10}
                    value={simPath}
                    onChange={(e) => setSimPath(Number(e.target.value))}
                    className="sketch-input bg-white py-1 text-xs font-bold"
                  />
                </div>
                <div className="p-1.5 rounded-xl bg-white border-2 border-zinc-900 text-center">
                  <p className="text-[9px] font-extrabold uppercase text-zinc-500">
                    Média
                  </p>
                  <p
                    className={`font-hand text-2xl leading-none font-bold ${
                      simulatedResult >= polPass
                        ? "text-emerald-700"
                        : "text-[#F43F5E]"
                    }`}
                  >
                    {simulatedResult.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={polType === "ponderada" && totalWeights !== 100}
              className="sketch-btn w-full py-2.5 bg-[#8B5CF6] text-white text-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              Salvar Fórmula de Média
            </button>
          </form>

          <div className="lg:col-span-6 space-y-3">
            <h3 className="font-hand text-2xl text-zinc-900">
              Fórmulas Ativas na Escola ({state.gradingPolicies.length})
            </h3>
            {state.gradingPolicies.map((pol) => (
              <div
                key={pol.id}
                className="sketch-card p-4 bg-white space-y-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-violet-100 border border-zinc-900 rounded">
                      {SEGMENT_LABELS[pol.segment]}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-extrabold bg-amber-100 border border-zinc-900 rounded uppercase">
                      {pol.termSystem}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 border border-zinc-900 rounded">
                      Mín: {pol.passingGrade.toFixed(1)}
                    </span>
                  </div>
                  <h4 className="font-hand text-2xl leading-none text-zinc-900">
                    {pol.name}
                  </h4>
                  <p className="text-xs text-zinc-600">
                    {pol.formulaType === "ponderada"
                      ? `Ponderada: Provas ${pol.weightExams}% · Atividades ${pol.weightActivities}% · Percursos ${pol.weightDynamicPaths}%`
                      : pol.formulaType === "aritmetica"
                      ? "Média Aritmética Simples entre os instrumentos"
                      : "Substituição da menor nota (média das 2 maiores)"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadPolicyToForm(pol)}
                  className="sketch-btn-sm px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#FACC15] text-xs shrink-0"
                >
                  Editar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "invites" && <InviteManager />}
      {tab === "audit" && <EconomyAudit />}
    </div>
  );
}

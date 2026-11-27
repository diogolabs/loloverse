"use client";

import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  ClipboardList,
  Compass,
  FileText,
  Link as LinkIcon,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import {
  BNCC_ATTRIBUTE_META,
  PATH_STEP_FORMAT_META,
  RUBRIC_CRITERIA,
  RUBRIC_LEVELS,
} from "@/data/bnccAndPaths";
import { PathStep, Student } from "@/types";
import { PillarBadge } from "@/components/shared/PillarBadge";
import { SketchAvatar } from "@/components/shared/SketchAvatar";

export function DynamicPathView({ student }: { student: Student }) {
  const { state, submitPathStep } = useLoloverse();

  const classPaths = state.dynamicPaths.filter(
    (p) => p.classId === student.classId && p.active
  );
  const [selectedPathId, setSelectedPathId] = useState<string>(
    classPaths[0]?.id || ""
  );
  const [openStepId, setOpenStepId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [draftFormat, setDraftFormat] = useState("");
  const [draftLink, setDraftLink] = useState("");

  const activePath =
    classPaths.find((p) => p.id === selectedPathId) || classPaths[0] || null;

  if (!activePath) {
    return (
      <div className="sketch-card p-8 bg-white text-center space-y-2">
        <p className="font-hand text-3xl text-zinc-900">
          Nenhum Percurso Dinâmico ativo nesta turma ainda!
        </p>
        <p className="text-sm text-zinc-600">
          Quando o professor publicar um Percurso Dinâmico, as etapas do Ciclo 1 e Ciclo 2 aparecerão aqui.
        </p>
      </div>
    );
  }

  const steps = state.pathSteps
    .filter((s) => s.pathId === activePath.id)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const cycle1Steps = steps.filter((s) => s.cycle === "ciclo1");
  const cycle2Steps = steps.filter((s) => s.cycle === "ciclo2");

  const myTeam = state.pathTeams.find(
    (t) => t.pathId === activePath.id && t.memberIds.includes(student.id)
  );
  const myEvaluation = state.pathEvaluations.find(
    (e) => e.pathId === activePath.id && e.studentId === student.id
  );

  const openStepEditor = (step: PathStep) => {
    const existing = state.pathSubmissions.find(
      (s) => s.stepId === step.id && s.studentId === student.id
    );
    setOpenStepId(step.id);
    setDraftContent(existing?.content || "");
    setDraftFormat(existing?.artifactFormat || "");
    setDraftLink(existing?.attachmentUrl || "");
  };

  const handleSubmit = (e: React.FormEvent, step: PathStep) => {
    e.preventDefault();
    submitPathStep({
      pathId: activePath.id,
      stepId: step.id,
      studentId: student.id,
      teamId: step.scope === "equipe" ? myTeam?.id : undefined,
      artifactFormat: draftFormat,
      content: draftContent,
      attachmentUrl: draftLink,
    });
    setOpenStepId(null);
    setDraftContent("");
    setDraftFormat("");
    setDraftLink("");
  };

  const gradingModeBadge =
    activePath.gradingMode === "formativo"
      ? "Modo Formativo · Média oficial intacta"
      : activePath.gradingMode === "ponderado"
      ? `Composição de Média (${activePath.gradeWeight}% opt-in)`
      : `Bônus Contínuo (até +${(activePath.gradeWeight / 10).toFixed(1)})`;

  const renderStepCard = (step: PathStep) => {
    const meta = PATH_STEP_FORMAT_META[step.stepFormat];
    const mySub = state.pathSubmissions.find(
      (s) => s.stepId === step.id && s.studentId === student.id
    );
    const isEditing = openStepId === step.id;

    return (
      <div
        key={step.id}
        className={`sketch-card-sm p-4 space-y-3 transition-all ${
          mySub?.status === "validado"
            ? "bg-emerald-50/70"
            : mySub?.status === "revisao"
            ? "bg-amber-50/80"
            : "bg-white"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`px-2 py-0.5 text-[11px] font-extrabold border-2 border-zinc-900 rounded-lg ${meta.bgClass} ${meta.textClass}`}
              >
                {meta.label}
              </span>
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-[#FAF8F5] border border-zinc-900 rounded-md text-zinc-700">
                {step.scope === "individual"
                  ? "Individual"
                  : step.scope === "equipe"
                  ? "Equipe"
                  : "Turma"}
              </span>
              <PillarBadge bnccAttr={step.bnccAttr} compact />
              <span className="text-[11px] font-bold text-zinc-500">
                Prazo: {step.dueDate}
              </span>
            </div>

            <h4 className="font-hand text-2xl leading-tight text-zinc-900">
              {step.title}
            </h4>
            <p className="text-xs sm:text-sm text-zinc-700">
              {step.description}
            </p>

            {step.guidingQuestions && step.guidingQuestions.length > 0 && (
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-dashed border-zinc-400 space-y-1 mt-1">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                  Perguntas que guiam esta etapa
                </p>
                <ul className="list-disc pl-4 space-y-0.5 text-xs text-zinc-700">
                  {step.guidingQuestions.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="shrink-0">
            {mySub ? (
              <div className="flex flex-col items-end gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-extrabold border-2 border-zinc-900 ${
                    mySub.status === "validado"
                      ? "bg-[#10B981] text-zinc-950"
                      : mySub.status === "revisao"
                      ? "bg-[#FACC15] text-zinc-950"
                      : "bg-blue-100 text-blue-950"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {mySub.status === "validado"
                    ? "Validado"
                    : mySub.status === "revisao"
                    ? "Revisar & Aprimorar"
                    : "Evidência Enviada"}
                </span>
                <button
                  type="button"
                  onClick={() => openStepEditor(step)}
                  className="text-[11px] font-extrabold text-[#3B82F6] hover:underline"
                >
                  {mySub.status === "revisao"
                    ? "Enviar versão revisada"
                    : "Editar registro"}
                </button>
              </div>
            ) : step.requiresEvidence ? (
              <button
                type="button"
                onClick={() => openStepEditor(step)}
                className="sketch-btn-sm px-3.5 py-2 bg-[#10B981] text-zinc-950 text-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                Registrar Evidência
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#FAF8F5] border border-zinc-300 text-zinc-600">
                Etapa Guiada em Sala
              </span>
            )}
          </div>
        </div>

        {/* Evidência registrada + devolutiva do professor */}
        {mySub && !isEditing && (
          <div className="p-3 rounded-xl bg-white border-2 border-zinc-900 space-y-2 text-xs">
            <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500">
              <span>
                Seu registro{" "}
                {mySub.artifactFormat ? `· ${mySub.artifactFormat}` : ""}
              </span>
              <span>{mySub.timestamp}</span>
            </div>
            <p className="text-zinc-800 leading-relaxed">{mySub.content}</p>
            {mySub.attachmentUrl && (
              <a
                href={mySub.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#3B82F6] font-bold hover:underline"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Abrir link do artefato
              </a>
            )}
            {mySub.teacherFeedback && (
              <div className="p-2.5 rounded-lg bg-violet-50 border border-zinc-900 text-violet-950">
                <p className="text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <MessageSquareText className="w-3 h-3" /> Devolutiva do Professor
                </p>
                <p className="mt-0.5 font-medium">{mySub.teacherFeedback}</p>
              </div>
            )}
          </div>
        )}

        {/* Formulário de entrega de evidência */}
        {isEditing && (
          <form
            onSubmit={(e) => handleSubmit(e, step)}
            className="p-3.5 rounded-xl bg-[#FFFDF7] border-2 border-zinc-900 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-zinc-700 mb-1">
                  Formato da Entrega (opcional)
                </label>
                <input
                  type="text"
                  value={draftFormat}
                  onChange={(e) => setDraftFormat(e.target.value)}
                  placeholder="Ex: Mapa conceitual, Protótipo, Síntese, Vídeo..."
                  className="sketch-input bg-white text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-zinc-700 mb-1">
                  Link do Artefato (opcional)
                </label>
                <input
                  type="url"
                  value={draftLink}
                  onChange={(e) => setDraftLink(e.target.value)}
                  placeholder="https://..."
                  className="sketch-input bg-white text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-zinc-700 mb-1">
                Registro de Evidência & Raciocínio
              </label>
              <textarea
                rows={3}
                required
                minLength={10}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder={meta.promptPlaceholder}
                className="sketch-input bg-white text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpenStepId(null)}
                className="sketch-btn-sm px-3 py-1.5 bg-white text-xs"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="sketch-btn-sm px-4 py-1.5 bg-[#10B981] text-zinc-950 text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Enviar Evidência (+35 XP · +1 {step.bnccAttr.toUpperCase()})
              </button>
            </div>
          </form>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Seletor caso existam vários Percursos na turma */}
      {classPaths.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {classPaths.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPathId(p.id)}
              className={`sketch-btn-sm px-3 py-1.5 text-xs ${
                p.id === activePath.id
                  ? "bg-[#FACC15] text-zinc-950"
                  : "bg-white text-zinc-700"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
      )}

      {/* Hero do Percurso Dinâmico */}
      <section className="sketch-card p-5 bg-[#FFFDF7] space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-extrabold bg-[#8B5CF6] text-white border-2 border-zinc-900 rounded-lg">
                <Compass className="w-3.5 h-3.5" />
                Percurso Dinâmico
              </span>
              <span className="px-2 py-0.5 text-[11px] font-extrabold bg-[#FACC15] text-zinc-950 border-2 border-zinc-900 rounded-lg">
                {activePath.currentCycle === "ciclo1"
                  ? "Ciclo 1 · Exploração & Base"
                  : activePath.currentCycle === "ciclo2"
                  ? "Ciclo 2 · Criação & Mostra"
                  : "Mostra Pública Concluída!"}
              </span>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-white border border-zinc-900 rounded-md text-zinc-700">
                {gradingModeBadge}
              </span>
            </div>

            <h2 className="font-hand text-3xl sm:text-4xl leading-none text-zinc-900">
              {activePath.title}
            </h2>
            <p className="text-sm font-semibold text-zinc-800 leading-snug">
              &ldquo;{activePath.drivingQuestion}&rdquo;
            </p>
            <p className="text-xs text-zinc-600">
              <strong>Recorte BNCC:</strong> {activePath.bnccSummary} ·{" "}
              <strong>Mostra Pública:</strong> {activePath.culminationDate}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-amber-100 border-2 border-zinc-900 text-center shrink-0 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
            <p className="text-[10px] font-extrabold uppercase text-amber-900">
              Título Desbloqueável
            </p>
            <p className="font-hand text-xl font-bold text-zinc-900 flex items-center justify-center gap-1 mt-0.5">
              <Award className="w-4 h-4 text-[#8B5CF6]" />
              {activePath.disciplinaryTitle}
            </p>
          </div>
        </div>

        {/* Cartão da Minha Equipe & Papel */}
        {myTeam && (
          <div className="p-3.5 rounded-xl bg-white border-2 border-zinc-900 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-hand text-xl text-zinc-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#10B981]" />
                {myTeam.name}
              </p>
              <span className="px-2.5 py-0.5 text-xs font-extrabold bg-emerald-100 text-emerald-950 border border-zinc-900 rounded-lg">
                Seu papel: {myTeam.roles[student.id] || "Integrante"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {myTeam.memberIds.map((mid) => {
                const mate = state.students.find((s) => s.id === mid);
                if (!mate) return null;
                const specialties = (mate.topSpecialties || []).slice(0, 2);
                return (
                  <div
                    key={mid}
                    className="p-2 rounded-lg bg-[#FAF8F5] border border-zinc-900 flex items-center gap-2"
                  >
                    <SketchAvatar
                      seed={mate.avatarSeed}
                      bgColor={mate.avatarColor}
                      config={mate.avatarConfig}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-zinc-900 truncate">
                        {mate.name}
                        {mate.id === student.id ? " (Você)" : ""}
                      </p>
                      <p className="text-[10px] font-semibold text-zinc-600 truncate">
                        {myTeam.roles[mid] || "Integrante"}
                      </p>
                      {specialties.length > 0 && (
                        <div className="flex gap-1 mt-0.5">
                          {specialties.map((sp) => (
                            <span
                              key={sp}
                              className={`px-1 py-0.2 text-[9px] font-extrabold rounded border border-zinc-900 ${BNCC_ATTRIBUTE_META[sp].bgClass}`}
                            >
                              {BNCC_ATTRIBUTE_META[sp].code}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* CICLO 1 · EXPLORAÇÃO & BASE */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-hand text-2xl text-zinc-900 flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-sans font-extrabold bg-[#3B82F6] text-white border-2 border-zinc-900 rounded-lg">
              CICLO 1
            </span>
            Exploração & Base ({cycle1Steps.length} etapas)
          </h3>
        </div>
        {cycle1Steps.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">
            Nenhuma etapa publicada neste ciclo ainda.
          </p>
        ) : (
          <div className="space-y-3">{cycle1Steps.map(renderStepCard)}</div>
        )}
      </section>

      {/* CICLO 2 · CRIAÇÃO & MOSTRA */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-hand text-2xl text-zinc-900 flex items-center gap-2">
            <span className="px-2 py-0.5 text-xs font-sans font-extrabold bg-[#10B981] text-zinc-950 border-2 border-zinc-900 rounded-lg">
              CICLO 2
            </span>
            Criação & Mostra Pública ({cycle2Steps.length} etapas)
          </h3>
        </div>
        {cycle2Steps.length === 0 ? (
          <p className="text-xs text-zinc-500 italic">
            As etapas de produção e Mostra Pública serão abertas pelo professor após o Ciclo 1.
          </p>
        ) : (
          <div className="space-y-3">{cycle2Steps.map(renderStepCard)}</div>
        )}
      </section>

      {/* MINHA RUBRICA 4D PRIVADA */}
      {myEvaluation && (
        <section className="sketch-card p-5 bg-white space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-zinc-900 pb-3">
            <div>
              <h3 className="font-hand text-2xl leading-none text-zinc-900 flex items-center gap-1.5">
                <ClipboardList className="w-5 h-5 text-[#8B5CF6]" />
                Minha Avaliação por Evidências (Rubrica 4D)
              </h3>
              <p className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                Visível somente para você, professores e coordenação.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-[#FAF8F5] border-2 border-zinc-900 rounded-xl font-hand text-2xl font-bold text-zinc-900">
                Conceito: {myEvaluation.suggestedScore.toFixed(1)}
              </span>
              {myEvaluation.publishedToGradebook && (
                <span className="px-2 py-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-950 border border-zinc-900 rounded-lg">
                  Lançado no Diário
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {RUBRIC_CRITERIA.map((crit) => {
              const lvl = myEvaluation[crit.field];
              const lvlMeta = RUBRIC_LEVELS[lvl];
              return (
                <div
                  key={crit.field}
                  className="p-3 rounded-xl bg-[#FAF8F5] border-2 border-zinc-900 space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-zinc-900">
                      {crit.label}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold border border-zinc-900 rounded-md ${lvlMeta.bgClass}`}
                    >
                      Nv.{lvl} · {lvlMeta.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600">{crit.hint}</p>
                </div>
              );
            })}
          </div>

          {myEvaluation.qualitativeNote && (
            <div className="p-3.5 rounded-xl bg-violet-50 border-2 border-zinc-900 text-xs text-violet-950">
              <p className="font-extrabold uppercase tracking-wider text-[10px] flex items-center gap-1 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Devolutiva Pedagógica
              </p>
              <p className="leading-relaxed font-medium">
                {myEvaluation.qualitativeNote}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

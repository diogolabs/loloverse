"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  Plus,
  Shuffle,
  Sparkles,
  Users,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import {
  BNCC_ATTRIBUTE_KEYS,
  BNCC_ATTRIBUTE_META,
  DISCIPLINARY_TITLES,
  PATH_STEP_FORMAT_KEYS,
  PATH_STEP_FORMAT_META,
  RUBRIC_CRITERIA,
  RUBRIC_LEVELS,
  TEAM_ROLE_PRESETS,
  computeAverageBnccIndex,
  computeSuggestedRubricScore,
} from "@/data/bnccAndPaths";
import {
  BnccAttributeKey,
  PathCycle,
  PathGradingMode,
  PathStepFormat,
  PathStepScope,
  RubricLevel,
} from "@/types";
import { PillarBadge } from "@/components/shared/PillarBadge";
import { SketchAvatar } from "@/components/shared/SketchAvatar";

export function DynamicPathManager() {
  const {
    state,
    createDynamicPath,
    addPathStep,
    advancePathCycle,
    createPathTeams,
    reviewPathSubmission,
    evaluateStudentPath,
  } = useLoloverse();

  const classStudents = state.students.filter(
    (s) => s.classId === state.selectedClassId
  );
  const classPaths = state.dynamicPaths.filter(
    (p) => p.classId === state.selectedClassId
  );

  const [selectedPathId, setSelectedPathId] = useState<string>(
    classPaths[0]?.id || ""
  );
  const [subTab, setSubTab] = useState<"steps" | "teams" | "rubric" | "new">(
    classPaths.length === 0 ? "new" : "steps"
  );

  // Novo Percurso
  const [pTitle, setPTitle] = useState("");
  const [pQuestion, setPQuestion] = useState("");
  const [pBncc, setPBncc] = useState("");
  const [pMode, setPMode] = useState<PathGradingMode>("formativo");
  const [pWeight, setPWeight] = useState(30);
  const [pDate, setPDate] = useState("Sexta, 14h");
  const [pDiscTitle, setPDiscTitle] = useState(DISCIPLINARY_TITLES[1]);

  // Nova Etapa (12 Formatos do Percurso Dinâmico)
  const [sFormat, setSFormat] = useState<PathStepFormat>("registro_bordo");
  const [sCycle, setSCycle] = useState<PathCycle>("ciclo1");
  const [sScope, setSScope] = useState<PathStepScope>("individual");
  const [sBnccAttr, setSBnccAttr] = useState<BnccAttributeKey>("con");
  const [sTitle, setSTitle] = useState("");
  const [sDesc, setSDesc] = useState("");
  const [sDue, setSDue] = useState("Quinta, 18h");
  const [sRequiresEv, setSRequiresEv] = useState(true);

  // Equipes
  const [teamCount, setTeamCount] = useState(2);
  const [openRooms, setOpenRooms] = useState(true);

  // Devolutivas rápidas
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>(
    {}
  );

  // Rubrica 4D por aluno
  const [evalStudentId, setEvalStudentId] = useState<string>(
    classStudents[0]?.id || ""
  );
  const [rigor, setRigor] = useState<RubricLevel>(3);
  const [evidence, setEvidence] = useState<RubricLevel>(3);
  const [authorship, setAuthorship] = useState<RubricLevel>(3);
  const [collab, setCollab] = useState<RubricLevel>(3);
  const [qualNote, setQualNote] = useState("");

  const activePath =
    classPaths.find((p) => p.id === selectedPathId) || classPaths[0] || null;

  const steps = activePath
    ? state.pathSteps
        .filter((s) => s.pathId === activePath.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
    : [];
  const teams = activePath
    ? state.pathTeams.filter((t) => t.pathId === activePath.id)
    : [];
  const submissions = activePath
    ? state.pathSubmissions.filter((s) => s.pathId === activePath.id)
    : [];

  const handleFormatChange = (fmt: PathStepFormat) => {
    const meta = PATH_STEP_FORMAT_META[fmt];
    setSFormat(fmt);
    setSCycle(meta.defaultCycle);
    setSScope(meta.defaultScope);
    setSBnccAttr(meta.defaultBnccAttr);
    setSRequiresEv(meta.requiresEvidenceDefault);
  };

  const handleCreatePath = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle.trim()) return;
    const newId = createDynamicPath({
      classId: state.selectedClassId,
      title: pTitle,
      drivingQuestion:
        pQuestion.trim() ||
        "Como investigar evidências reais e criar uma solução comunicável para este desafio?",
      bnccSummary: pBncc.trim() || "Competências Gerais BNCC 1, 2, 4, 7 e 9",
      gradingMode: pMode,
      gradeWeight: pMode === "formativo" ? 0 : pWeight,
      culminationDate: pDate,
      disciplinaryTitle: pDiscTitle,
    });
    if (newId) setSelectedPathId(newId);
    setPTitle("");
    setPQuestion("");
    setPBncc("");
    setSubTab("steps");
  };

  const handleAddStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePath || !sTitle.trim()) return;
    const meta = PATH_STEP_FORMAT_META[sFormat];
    addPathStep({
      pathId: activePath.id,
      cycle: sCycle,
      stepFormat: sFormat,
      scope: sScope,
      title: sTitle,
      description: sDesc.trim() || meta.description,
      guidingQuestions: meta.defaultQuestions,
      bnccAttr: sBnccAttr,
      requiresEvidence: sRequiresEv,
      dueDate: sDue,
    });
    setSTitle("");
    setSDesc("");
  };

  const handleBalancedTeams = () => {
    if (!activePath || classStudents.length === 0) return;
    const count = Math.max(1, Math.min(classStudents.length, teamCount));
    // Distribui alunos em zigue-zague por índice BNCC (equipes equilibradas!)
    const sorted = [...classStudents].sort(
      (a, b) =>
        computeAverageBnccIndex(b.bnccAttributes) -
        computeAverageBnccIndex(a.bnccAttributes)
    );
    const buckets: Array<{
      name: string;
      memberIds: string[];
      roles: Record<string, string>;
    }> = Array.from({ length: count }, (_, idx) => ({
      name: `Equipe ${String.fromCharCode(65 + idx)}`,
      memberIds: [],
      roles: {},
    }));

    sorted.forEach((stu, i) => {
      const round = Math.floor(i / count);
      const bucketIdx = round % 2 === 0 ? i % count : count - 1 - (i % count);
      const b = buckets[bucketIdx];
      b.memberIds.push(stu.id);
      b.roles[stu.id] =
        TEAM_ROLE_PRESETS[(b.memberIds.length - 1) % TEAM_ROLE_PRESETS.length];
    });

    createPathTeams(activePath.id, buckets, openRooms);
  };

  const loadStudentEvaluation = (stuId: string) => {
    setEvalStudentId(stuId);
    if (!activePath) return;
    const existing = state.pathEvaluations.find(
      (e) => e.pathId === activePath.id && e.studentId === stuId
    );
    if (existing) {
      setRigor(existing.rigorLevel);
      setEvidence(existing.evidenceLevel);
      setAuthorship(existing.authorshipLevel);
      setCollab(existing.collaborationLevel);
      setQualNote(existing.qualitativeNote || "");
    } else {
      setRigor(3);
      setEvidence(3);
      setAuthorship(3);
      setCollab(3);
      setQualNote("");
    }
  };

  const selectedEvalStudent =
    classStudents.find((s) => s.id === evalStudentId) || classStudents[0];
  const liveScore = computeSuggestedRubricScore({
    rigorLevel: rigor,
    evidenceLevel: evidence,
    authorshipLevel: authorship,
    collaborationLevel: collab,
  });

  return (
    <div className="space-y-5">
      {/* Barra superior: Seletor de Percurso + Ações */}
      <div className="sketch-card p-4 bg-[#FFFDF7] flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="p-2 rounded-xl bg-[#8B5CF6] text-white border-2 border-zinc-900">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-hand text-2xl sm:text-3xl leading-none text-zinc-900">
              Percurso Dinâmico · Avaliação por Evidências
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Ciclo 1 (Exploração & Base) → Ciclo 2 (Criação & Mostra Pública) · Notas oficiais protegidas por ponte opt-in.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {classPaths.length > 0 && (
            <select
              value={activePath?.id || ""}
              onChange={(e) => setSelectedPathId(e.target.value)}
              className="sketch-input py-1.5 text-xs font-bold bg-white w-auto max-w-xs"
            >
              {classPaths.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setSubTab("new")}
            className="sketch-btn-sm px-3 py-2 bg-[#FACC15] text-zinc-950 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo Percurso
          </button>
        </div>
      </div>

      {/* Sub-navegação quando existe Percurso selecionado */}
      {activePath && subTab !== "new" && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSubTab("steps")}
              className={`sketch-btn-sm px-3.5 py-2 text-xs ${
                subTab === "steps"
                  ? "bg-[#3B82F6] text-white"
                  : "bg-white text-zinc-700"
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Etapas & Entregas ({steps.length})
            </button>
            <button
              type="button"
              onClick={() => setSubTab("teams")}
              className={`sketch-btn-sm px-3.5 py-2 text-xs ${
                subTab === "teams"
                  ? "bg-[#10B981] text-zinc-950"
                  : "bg-white text-zinc-700"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Montagem de Equipes ({teams.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setSubTab("rubric");
                if (selectedEvalStudent) {
                  loadStudentEvaluation(selectedEvalStudent.id);
                }
              }}
              className={`sketch-btn-sm px-3.5 py-2 text-xs ${
                subTab === "rubric"
                  ? "bg-[#8B5CF6] text-white"
                  : "bg-white text-zinc-700"
              }`}
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Rubrica 4D & Ponte de Nota
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activePath.currentCycle === "ciclo1" && (
              <button
                type="button"
                onClick={() => advancePathCycle(activePath.id, "ciclo2")}
                className="sketch-btn-sm px-3 py-1.5 bg-emerald-100 hover:bg-[#10B981] text-zinc-950 text-xs"
              >
                Avançar para Ciclo 2 <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
            {activePath.currentCycle === "ciclo2" && (
              <button
                type="button"
                onClick={() => advancePathCycle(activePath.id, "concluido")}
                className="sketch-btn-sm px-3 py-1.5 bg-[#FACC15] text-zinc-950 text-xs"
              >
                <Award className="w-3.5 h-3.5" />
                Concluir Mostra Pública
              </button>
            )}
          </div>
        </div>
      )}

      {/* SUB-ABA: CRIAR NOVO PERCURSO DINÂMICO */}
      {subTab === "new" && (
        <form
          onSubmit={handleCreatePath}
          className="sketch-card p-5 bg-white space-y-4 max-w-3xl"
        >
          <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
            <h3 className="font-hand text-3xl leading-none text-zinc-900">
              Criar Novo Percurso Dinâmico
            </h3>
            {activePath && (
              <button
                type="button"
                onClick={() => setSubTab("steps")}
                className="text-xs font-extrabold underline text-zinc-600"
              >
                Voltar ao percurso ativo
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Título do Percurso
              </label>
              <input
                type="text"
                required
                value={pTitle}
                onChange={(e) => setPTitle(e.target.value)}
                placeholder="Ex: Energia Limpa & Consumo Consciente na Escola"
                className="sketch-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Pergunta Norteadora
              </label>
              <textarea
                rows={2}
                value={pQuestion}
                onChange={(e) => setPQuestion(e.target.value)}
                placeholder="Que desafio real os estudantes vão investigar no Ciclo 1 e responder na Mostra Pública?"
                className="sketch-input resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Recorte Curricular & Códigos BNCC
              </label>
              <input
                type="text"
                value={pBncc}
                onChange={(e) => setPBncc(e.target.value)}
                placeholder="Ex: EF08CI06 · Competências Gerais 1, 2 e 7"
                className="sketch-input"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Título Disciplinar Desbloqueável
              </label>
              <select
                value={pDiscTitle}
                onChange={(e) => setPDiscTitle(e.target.value)}
                className="sketch-input font-semibold"
              >
                {DISCIPLINARY_TITLES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Vínculo com o Sistema de Notas (Opt-In)
              </label>
              <select
                value={pMode}
                onChange={(e) => setPMode(e.target.value as PathGradingMode)}
                className="sketch-input font-semibold"
              >
                <option value="formativo">
                  Formativo (0% na média · padrão seguro)
                </option>
                <option value="ponderado">
                  Composição Ponderada (lançamento manual no Diário)
                </option>
                <option value="bonus">
                  Bônus / Recuperação Contínua (teto 10.0)
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                {pMode === "ponderado"
                  ? "Peso na Média (%)"
                  : pMode === "bonus"
                  ? "Bônus Máximo (décimos: 10 = +1.0)"
                  : "Data Prevista da Mostra Pública"}
              </label>
              {pMode === "formativo" ? (
                <input
                  type="text"
                  value={pDate}
                  onChange={(e) => setPDate(e.target.value)}
                  className="sketch-input"
                />
              ) : (
                <input
                  type="number"
                  min={5}
                  max={pMode === "ponderado" ? 50 : 20}
                  value={pWeight}
                  onChange={(e) => setPWeight(Number(e.target.value))}
                  className="sketch-input font-bold"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="sketch-btn px-5 py-2.5 bg-[#10B981] text-zinc-950 text-sm"
          >
            <Plus className="w-4 h-4" />
            Publicar Percurso Dinâmico para a Turma
          </button>
        </form>
      )}

      {/* SUB-ABA: ETAPAS (12 FORMATOS) & REVISÃO DE EVIDÊNCIAS */}
      {activePath && subTab === "steps" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Construtor de Etapas */}
          <form
            onSubmit={handleAddStep}
            className="lg:col-span-5 sketch-card p-5 bg-[#FFFDF7] space-y-3.5 h-fit"
          >
            <h3 className="font-hand text-2xl leading-none text-zinc-900 border-b-2 border-zinc-900 pb-2.5">
              Adicionar Etapa (12 Formatos)
            </h3>

            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Formato do Percurso Dinâmico
              </label>
              <select
                value={sFormat}
                onChange={(e) =>
                  handleFormatChange(e.target.value as PathStepFormat)
                }
                className="sketch-input bg-white font-bold"
              >
                {PATH_STEP_FORMAT_KEYS.map((fmt) => {
                  const m = PATH_STEP_FORMAT_META[fmt];
                  return (
                    <option key={fmt} value={fmt}>
                      {m.label} ({m.defaultCycle === "ciclo1" ? "Ciclo 1" : "Ciclo 2"})
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-zinc-600 mt-1">
                {PATH_STEP_FORMAT_META[sFormat].description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Ciclo
                </label>
                <select
                  value={sCycle}
                  onChange={(e) => setSCycle(e.target.value as PathCycle)}
                  className="sketch-input bg-white text-xs font-bold"
                >
                  <option value="ciclo1">Ciclo 1 · Exploração</option>
                  <option value="ciclo2">Ciclo 2 · Criação</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Escopo
                </label>
                <select
                  value={sScope}
                  onChange={(e) => setSScope(e.target.value as PathStepScope)}
                  className="sketch-input bg-white text-xs font-bold"
                >
                  <option value="individual">Individual</option>
                  <option value="equipe">Equipe</option>
                  <option value="turma">Turma</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Título da Etapa
              </label>
              <input
                type="text"
                required
                value={sTitle}
                onChange={(e) => setSTitle(e.target.value)}
                placeholder="Ex: Registro de Bordo: Análise dos Dados Coletados"
                className="sketch-input bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Orientações / Critério
              </label>
              <textarea
                rows={2}
                value={sDesc}
                onChange={(e) => setSDesc(e.target.value)}
                placeholder="Explique o que a turma ou cada estudante precisa observar, discutir ou produzir..."
                className="sketch-input bg-white resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Atributo BNCC Principal
                </label>
                <select
                  value={sBnccAttr}
                  onChange={(e) =>
                    setSBnccAttr(e.target.value as BnccAttributeKey)
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
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Prazo
                </label>
                <input
                  type="text"
                  value={sDue}
                  onChange={(e) => setSDue(e.target.value)}
                  className="sketch-input bg-white text-xs"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-bold text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={sRequiresEv}
                onChange={(e) => setSRequiresEv(e.target.checked)}
                className="w-4 h-4 accent-[#8B5CF6]"
              />
              Exigir registro de evidência do aluno nesta etapa
            </label>

            <button
              type="submit"
              className="sketch-btn w-full py-2.5 bg-[#10B981] text-zinc-950 text-sm"
            >
              <Plus className="w-4 h-4" />
              Incluir na Trilha
            </button>
          </form>

          {/* Lista de Etapas & Entregas para Revisão */}
          <div className="lg:col-span-7 space-y-3.5">
            {steps.map((step) => {
              const meta = PATH_STEP_FORMAT_META[step.stepFormat];
              const stepSubs = submissions.filter((s) => s.stepId === step.id);

              return (
                <div key={step.id} className="sketch-card p-4 bg-white space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-extrabold bg-zinc-900 text-white rounded">
                        {step.cycle === "ciclo1" ? "CICLO 1" : "CICLO 2"}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-extrabold border-2 border-zinc-900 rounded-lg ${meta.bgClass} ${meta.textClass}`}
                      >
                        {meta.label}
                      </span>
                      <PillarBadge bnccAttr={step.bnccAttr} compact />
                    </div>
                    <span className="text-xs font-bold text-zinc-500">
                      {stepSubs.length} entrega(s) · {step.dueDate}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-hand text-2xl leading-tight text-zinc-900">
                      {step.title}
                    </h4>
                    <p className="text-xs text-zinc-600 mt-0.5">
                      {step.description}
                    </p>
                  </div>

                  {stepSubs.length > 0 && (
                    <div className="space-y-2 pt-2 border-t-2 border-dashed border-zinc-200">
                      {stepSubs.map((sub) => {
                        const stu = state.students.find(
                          (s) => s.id === sub.studentId
                        );
                        return (
                          <div
                            key={sub.id}
                            className="p-3 rounded-xl bg-[#FAF8F5] border border-zinc-900 space-y-2 text-xs"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-extrabold text-zinc-900">
                                {stu?.name || "Estudante"} ·{" "}
                                <span className="text-zinc-500 font-semibold">
                                  {sub.timestamp}
                                </span>
                              </span>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-extrabold rounded border border-zinc-900 ${
                                  sub.status === "validado"
                                    ? "bg-emerald-200 text-emerald-950"
                                    : sub.status === "revisao"
                                    ? "bg-amber-200 text-amber-950"
                                    : "bg-blue-100 text-blue-950"
                                }`}
                              >
                                {sub.status}
                              </span>
                            </div>
                            <p className="text-zinc-800">{sub.content}</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                              <input
                                type="text"
                                value={
                                  feedbackDrafts[sub.id] ??
                                  sub.teacherFeedback ??
                                  ""
                                }
                                onChange={(e) =>
                                  setFeedbackDrafts((prev) => ({
                                    ...prev,
                                    [sub.id]: e.target.value,
                                  }))
                                }
                                placeholder="Devolutiva formativa curta..."
                                className="sketch-input bg-white text-xs py-1"
                              />
                              <div className="flex gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    reviewPathSubmission(
                                      sub.id,
                                      "validado",
                                      feedbackDrafts[sub.id] ??
                                        sub.teacherFeedback ??
                                        "Evidência validada com bom rigor!"
                                    )
                                  }
                                  className="sketch-btn-sm px-2.5 py-1 bg-[#10B981] text-zinc-950 text-[11px]"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Validar
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    reviewPathSubmission(
                                      sub.id,
                                      "revisao",
                                      feedbackDrafts[sub.id] ??
                                        sub.teacherFeedback ??
                                        "Revise a evidência e conecte com os dados do Ciclo 1."
                                    )
                                  }
                                  className="sketch-btn-sm px-2.5 py-1 bg-[#FACC15] text-zinc-950 text-[11px]"
                                >
                                  Pedir Revisão
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-ABA: MONTAGEM DE EQUIPES (EQUILIBRADA POR BNCC + MESAS) */}
      {activePath && subTab === "teams" && (
        <div className="space-y-4">
          <div className="sketch-card p-4 bg-[#FFFDF7] flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-0.5">
              <h3 className="font-hand text-2xl leading-none text-zinc-900">
                Montagem Equilibrada de Equipes
              </h3>
              <p className="text-xs text-zinc-600">
                Distribui os estudantes combinando pontos fortes da Ficha BNCC e atribuindo papéis claros.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <label className="text-xs font-extrabold text-zinc-700 flex items-center gap-1.5">
                Equipes:
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, classStudents.length)}
                  value={teamCount}
                  onChange={(e) => setTeamCount(Number(e.target.value))}
                  className="sketch-input bg-white w-16 py-1 text-center font-bold"
                />
              </label>
              <label className="text-xs font-bold text-zinc-700 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={openRooms}
                  onChange={(e) => setOpenRooms(e.target.checked)}
                  className="accent-[#8B5CF6]"
                />
                Abrir Mesas no Espaço Híbrido
              </label>
              <button
                type="button"
                onClick={handleBalancedTeams}
                className="sketch-btn-sm px-3.5 py-2 bg-[#10B981] text-zinc-950 text-xs"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Sortear Equipes Equilibradas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teams.map((team) => (
              <div
                key={team.id}
                className="sketch-card p-4 bg-white space-y-3"
              >
                <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-2">
                  <h4 className="font-hand text-2xl leading-none text-zinc-900">
                    {team.name}
                  </h4>
                  <span className="px-2 py-0.5 text-[11px] font-extrabold bg-[#FAF8F5] border border-zinc-900 rounded-md">
                    {team.memberIds.length} integrantes
                  </span>
                </div>
                <div className="space-y-2">
                  {team.memberIds.map((mid) => {
                    const stu = state.students.find((s) => s.id === mid);
                    if (!stu) return null;
                    return (
                      <div
                        key={mid}
                        className="p-2.5 rounded-xl bg-[#FAF8F5] border border-zinc-900 flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <SketchAvatar
                            seed={stu.avatarSeed}
                            bgColor={stu.avatarColor}
                            config={stu.avatarConfig}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-zinc-900 truncate">
                              {stu.name}
                            </p>
                            <p className="text-[11px] font-semibold text-[#8B5CF6] truncate">
                              {team.roles[mid] || "Integrante"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          {(stu.topSpecialties || []).slice(0, 2).map((sp) => (
                            <span
                              key={sp}
                              className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded border border-zinc-900 ${BNCC_ATTRIBUTE_META[sp].bgClass}`}
                            >
                              {BNCC_ATTRIBUTE_META[sp].code}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-ABA: RUBRICA 4D & PONTE DE NOTA OPT-IN */}
      {activePath && subTab === "rubric" && selectedEvalStudent && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Lista de Alunos da Turma */}
          <div className="lg:col-span-4 sketch-card p-4 bg-[#FAF8F5] space-y-2">
            <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-600 mb-2">
              Avaliação Individual (nunca diluída no grupo)
            </p>
            {classStudents.map((stu) => {
              const ev = state.pathEvaluations.find(
                (e) => e.pathId === activePath.id && e.studentId === stu.id
              );
              const isSelected = stu.id === selectedEvalStudent.id;
              return (
                <button
                  key={stu.id}
                  type="button"
                  onClick={() => loadStudentEvaluation(stu.id)}
                  className={`w-full text-left p-2.5 rounded-xl border-2 flex items-center justify-between gap-2 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-white border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]"
                      : "bg-white/70 border-zinc-300 hover:border-zinc-900"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <SketchAvatar
                      seed={stu.avatarSeed}
                      bgColor={stu.avatarColor}
                      config={stu.avatarConfig}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate">
                        {stu.name}
                      </p>
                      <p className="text-[10px] text-zinc-500">
                        Média atual: {stu.bimesterAverage.toFixed(1)}
                      </p>
                    </div>
                  </div>
                  {ev ? (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded border border-zinc-900 ${
                        ev.publishedToGradebook
                          ? "bg-emerald-200 text-emerald-950"
                          : "bg-violet-100 text-violet-950"
                      }`}
                    >
                      {ev.suggestedScore.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-zinc-400">
                      Pendente
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Grade de Rubrica 4 Níveis */}
          <div className="lg:col-span-8 sketch-card p-5 bg-white space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-900 pb-3">
              <div>
                <h3 className="font-hand text-3xl leading-none text-zinc-900">
                  Rubrica 4D · {selectedEvalStudent.name}
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Atualiza os 6 Atributos BNCC na ficha RPG (crescimento não-punitivo). A média oficial só muda se você clicar em lançar.
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-violet-100 border-2 border-zinc-900 text-center">
                <p className="text-[10px] font-extrabold uppercase text-violet-900">
                  Conceito Sugerido
                </p>
                <p className="font-hand text-3xl leading-none font-bold text-zinc-900">
                  {liveScore.toFixed(1)}
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {RUBRIC_CRITERIA.map((crit) => {
                const current =
                  crit.field === "rigorLevel"
                    ? rigor
                    : crit.field === "evidenceLevel"
                    ? evidence
                    : crit.field === "authorshipLevel"
                    ? authorship
                    : collab;
                const setVal = (v: RubricLevel) => {
                  if (crit.field === "rigorLevel") setRigor(v);
                  else if (crit.field === "evidenceLevel") setEvidence(v);
                  else if (crit.field === "authorshipLevel") setAuthorship(v);
                  else setCollab(v);
                };

                return (
                  <div
                    key={crit.field}
                    className="p-3.5 rounded-xl bg-[#FAF8F5] border-2 border-zinc-900 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-extrabold text-zinc-900">
                        {crit.label} ({Math.round(crit.weight * 100)}%)
                      </span>
                      <div className="flex gap-1">
                        {crit.linkedBncc.map((k) => (
                          <span
                            key={k}
                            className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded border border-zinc-900 ${BNCC_ATTRIBUTE_META[k].bgClass}`}
                          >
                            {BNCC_ATTRIBUTE_META[k].code}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-zinc-600">{crit.hint}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      {([1, 2, 3, 4] as RubricLevel[]).map((lvl) => {
                        const meta = RUBRIC_LEVELS[lvl];
                        const active = current === lvl;
                        return (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setVal(lvl)}
                            className={`py-2 px-2 rounded-xl text-xs font-extrabold border-2 transition-all cursor-pointer ${
                              active
                                ? `${meta.bgClass} border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]`
                                : "bg-white border-zinc-300 text-zinc-600 hover:border-zinc-900"
                            }`}
                          >
                            Nv.{lvl} · {meta.short}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                Devolutiva Qualitativa Privada para o Estudante
              </label>
              <textarea
                rows={2}
                value={qualNote}
                onChange={(e) => setQualNote(e.target.value)}
                placeholder="Destaque pontos fortes das evidências e 1 próximo passo concreto..."
                className="sketch-input resize-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() =>
                  evaluateStudentPath({
                    pathId: activePath.id,
                    studentId: selectedEvalStudent.id,
                    rigorLevel: rigor,
                    evidenceLevel: evidence,
                    authorshipLevel: authorship,
                    collaborationLevel: collab,
                    qualitativeNote: qualNote,
                    publishToGradebook: false,
                  })
                }
                className="sketch-btn px-4 py-2.5 bg-[#3B82F6] text-white text-xs sm:text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Salvar Rubrica (Média Oficial Intacta)
              </button>

              {activePath.gradingMode !== "formativo" && (
                <button
                  type="button"
                  onClick={() =>
                    evaluateStudentPath({
                      pathId: activePath.id,
                      studentId: selectedEvalStudent.id,
                      rigorLevel: rigor,
                      evidenceLevel: evidence,
                      authorshipLevel: authorship,
                      collaborationLevel: collab,
                      qualitativeNote: qualNote,
                      publishToGradebook: true,
                    })
                  }
                  className="sketch-btn px-4 py-2.5 bg-[#10B981] text-zinc-950 text-xs sm:text-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Validar e Lançar no Diário (
                  {activePath.gradingMode === "ponderado"
                    ? `${activePath.gradeWeight}%`
                    : `Bônus`}
                  )
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

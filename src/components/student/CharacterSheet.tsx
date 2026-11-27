"use client";

import React, { useState } from "react";
import {
  Award,
  BookOpen,
  Coins,
  Cpu,
  Flame,
  Heart,
  HeartHandshake,
  History,
  Info,
  Lightbulb,
  Lock,
  MessageCircle,
  Palette,
  Scale,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import {
  BADGE_CATALOG,
  BNCC_ATTRIBUTE_KEYS,
  BNCC_ATTRIBUTE_META,
  BNCC_GENERAL_COMPETENCIES,
  DISCIPLINARY_TITLES,
  defaultAvatarConfig,
  getBnccTier,
} from "@/data/bnccAndPaths";
import { useLoloverse } from "@/context/LoloverseContext";
import { AvatarConfig, BnccAttributeKey, BnccAttributes, Student } from "@/types";
import {
  AVATAR_BG_COLORS,
  AVATAR_HAIR_COLORS,
  AVATAR_SKIN_TONES,
  SketchAvatar,
} from "@/components/shared/SketchAvatar";

interface CharacterSheetProps {
  student: Student;
  classNameTitle: string;
}

const ATTR_ICONS: Record<BnccAttributeKey, React.ReactNode> = {
  con: <BookOpen className="w-3.5 h-3.5" />,
  inv: <Lightbulb className="w-3.5 h-3.5" />,
  exp: <MessageCircle className="w-3.5 h-3.5" />,
  dig: <Cpu className="w-3.5 h-3.5" />,
  arg: <Scale className="w-3.5 h-3.5" />,
  elo: <HeartHandshake className="w-3.5 h-3.5" />,
};

function BnccHexRadar({ attrs }: { attrs: BnccAttributes }) {
  const cx = 110;
  const cy = 104;
  const maxR = 66;

  // 6 eixos distribuídos a partir do topo (-90 deg) em passos de 60 deg
  const vertex = (index: number, radius: number) => {
    const angle = ((-90 + index * 60) * Math.PI) / 180;
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
    };
  };

  const ringPoints = (ratio: number) =>
    BNCC_ATTRIBUTE_KEYS.map((_, idx) => {
      const p = vertex(idx, maxR * ratio);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");

  const statCoords = BNCC_ATTRIBUTE_KEYS.map((key, idx) => {
    const val = attrs[key]?.value ?? 0;
    const ratio = val <= 0 ? 0.08 : Math.min(1, val / 20);
    return { key, val, ...vertex(idx, maxR * ratio) };
  });

  const statPolygon = statCoords
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 220 210"
        className="w-52 h-48 overflow-visible"
        aria-label="Radar Hexagonal de Atributos BNCC do Estudante"
      >
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <polygon
            key={ratio}
            points={ringPoints(ratio)}
            fill={ratio === 1 ? "#FAF8F5" : "none"}
            stroke="#18181B"
            strokeWidth={ratio === 1 ? "1.8" : "1"}
            strokeDasharray={ratio === 1 ? undefined : "3 3"}
            strokeOpacity={ratio === 1 ? "0.75" : "0.28"}
          />
        ))}

        {BNCC_ATTRIBUTE_KEYS.map((key, idx) => {
          const end = vertex(idx, maxR);
          return (
            <line
              key={key}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="#18181B"
              strokeOpacity="0.22"
              strokeWidth="1.2"
            />
          );
        })}

        <polygon
          points={statPolygon}
          fill="#8B5CF6"
          fillOpacity="0.30"
          stroke="#18181B"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />

        {statCoords.map((p) => {
          const meta = BNCC_ATTRIBUTE_META[p.key];
          return (
            <circle
              key={p.key}
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill={p.val > 0 ? meta.color : "#D4D4D8"}
              stroke="#18181B"
              strokeWidth="2"
            />
          );
        })}

        {BNCC_ATTRIBUTE_KEYS.map((key, idx) => {
          const meta = BNCC_ATTRIBUTE_META[key];
          const val = attrs[key]?.value ?? 0;
          const pos = vertex(idx, maxR + 19);
          const anchor =
            idx === 0 || idx === 3
              ? "middle"
              : idx === 1 || idx === 2
              ? "start"
              : "end";
          return (
            <text
              key={key}
              x={pos.x}
              y={pos.y + 4}
              textAnchor={anchor}
              className="fill-zinc-900 text-[10px] font-extrabold"
            >
              {meta.code} {val > 0 ? val : "—"}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export function CharacterSheet({
  student,
  classNameTitle,
}: CharacterSheetProps) {
  const { state, updateAvatarProfile } = useLoloverse();
  const [selectedAttr, setSelectedAttr] = useState<BnccAttributeKey | null>(
    null
  );
  const [showWorkshop, setShowWorkshop] = useState(false);
  const [showFeed, setShowFeed] = useState(false);

  const initialConfig =
    student.avatarConfig ||
    defaultAvatarConfig(student.avatarSeed, student.avatarColor);

  const [draftConfig, setDraftConfig] = useState<AvatarConfig>(initialConfig);
  const [draftTitle, setDraftTitle] = useState<string>(student.roleTitle);

  const hpPercent = Math.round((student.hp / student.maxHp) * 100);
  const xpPercent = Math.min(
    100,
    Math.round((student.xp / student.xpToNext) * 100)
  );

  const myFeed = state.studentFeed
    .filter((f) => f.studentId === student.id)
    .slice(0, 6);

  const unlockedTitleOptions = Array.from(
    new Set([
      student.roleTitle,
      ...(student.unlockedTitles || []),
      ...DISCIPLINARY_TITLES.slice(0, 4),
    ])
  );

  const openWorkshop = () => {
    setDraftConfig(
      student.avatarConfig ||
        defaultAvatarConfig(student.avatarSeed, student.avatarColor)
    );
    setDraftTitle(student.roleTitle);
    setShowWorkshop(true);
  };

  const handleSaveWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    updateAvatarProfile(student.id, draftConfig, draftTitle);
    setShowWorkshop(false);
  };

  const activeAttrMeta = selectedAttr ? BNCC_ATTRIBUTE_META[selectedAttr] : null;
  const activeAttrEntry = selectedAttr
    ? student.bnccAttributes[selectedAttr]
    : null;

  return (
    <>
      <aside className="sketch-card p-5 bg-white space-y-5 relative overflow-hidden">
        {/* Decorative notebook tape */}
        <div className="absolute -top-2 right-8 w-16 h-5 bg-[#FACC15]/80 border-2 border-zinc-900 rotate-3" />

        {/* Identity Header */}
        <div className="flex items-start gap-3.5">
          <div className="flex flex-col items-center gap-1.5">
            <SketchAvatar
              seed={student.avatarSeed}
              bgColor={student.avatarColor}
              config={student.avatarConfig}
              size="xl"
              statusDot={student.onlineStatus}
            />
            <button
              type="button"
              onClick={openWorkshop}
              className="sketch-btn-sm px-2 py-1 bg-[#FAF8F5] hover:bg-[#FACC15] text-[10px] font-extrabold text-zinc-900"
              title="Personalizar avatar e título do personagem"
            >
              <Palette className="w-3 h-3" />
              Oficina
            </button>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className="font-hand text-lg px-2 py-0.5 bg-[#FACC15] border-2 border-zinc-900 rounded-lg font-bold shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
                Nível {student.level}
              </span>
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-extrabold bg-orange-100 text-orange-900 border-2 border-zinc-900 rounded-lg"
                title="Dias letivos com atividade registrada"
              >
                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                {student.streakDays}d
              </span>
            </div>
            <h2 className="font-hand text-3xl leading-none text-zinc-900 truncate">
              {student.name}
            </h2>
            <p className="text-xs font-extrabold text-[#8B5CF6] mt-0.5">
              {student.roleTitle}
            </p>
            <p className="text-[11px] font-semibold text-zinc-500 truncate mt-0.5">
              {classNameTitle}
            </p>
          </div>
        </div>

        {/* Boletim Oficial (separado da camada RPG) + Ouro */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
            <span>Economia & Boletim Oficial</span>
            <span className="inline-flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="w-3 h-3" /> Privado
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-amber-100 border-2 border-zinc-900 text-center shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
              <div className="flex items-center justify-center gap-1 text-[10px] font-extrabold text-amber-900">
                <Coins className="w-3.5 h-3.5" /> OURO
              </div>
              <p className="font-hand text-2xl leading-tight text-zinc-900">
                {student.gold}
              </p>
            </div>
            <div
              className="p-2.5 rounded-xl bg-blue-100 border-2 border-zinc-900 text-center shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
              title="Média Bimestral oficial lançada pelo professor (nunca alterada por XP/Ouro)"
            >
              <div className="text-[10px] font-extrabold text-blue-900">
                MÉDIA
              </div>
              <p className="font-hand text-2xl leading-tight text-zinc-900">
                {student.bimesterAverage.toFixed(1)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-100 border-2 border-zinc-900 text-center shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
              <div className="text-[10px] font-extrabold text-emerald-900">
                FREQ.
              </div>
              <p className="font-hand text-2xl leading-tight text-zinc-900">
                {student.attendanceRate}%
              </p>
            </div>
          </div>
        </div>

        {/* HP & XP Vital Bars */}
        <div className="space-y-3 p-3.5 rounded-xl bg-[#FAF8F5] border-2 border-zinc-900">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-extrabold">
              <span className="inline-flex items-center gap-1.5 text-zinc-900">
                <Heart className="w-4 h-4 text-[#F43F5E] fill-[#F43F5E]" />
                HP · Rotina Acadêmica
              </span>
              <span
                className={hpPercent <= 55 ? "text-[#F43F5E]" : "text-zinc-900"}
              >
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
                Recupere HP enviando entregas no Percurso Dinâmico, concluindo missões ou participando do Espaço Híbrido!
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

        {/* 6 ATRIBUTOS DE AVALIAÇÃO RPG (BNCC 1–20, CRESCIMENTO NÃO-PUNITIVO) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-hand text-2xl leading-none text-zinc-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#8B5CF6]" />
              Atributos BNCC
            </h3>
            <span
              className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 bg-violet-100 border border-zinc-900 rounded-md"
              title="Escala RPG de crescimento (1–20) cobrindo as 10 Competências Gerais da BNCC. Nunca cai por punição."
            >
              Ficha RPG · 1–20
            </span>
          </div>

          <BnccHexRadar attrs={student.bnccAttributes} />

          {/* Grade 2x3 de Atributos estilo Ficha RPG */}
          <div className="grid grid-cols-2 gap-2">
            {BNCC_ATTRIBUTE_KEYS.map((key) => {
              const meta = BNCC_ATTRIBUTE_META[key];
              const entry = student.bnccAttributes[key] || {
                value: 0,
                evidenceCount: 0,
              };
              const tier = getBnccTier(entry.value);
              const isSelected = selectedAttr === key;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() =>
                    setSelectedAttr((prev) => (prev === key ? null : key))
                  }
                  className={`text-left p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                    tier.isUnexplored
                      ? "bg-[#FAF8F5] border-dashed border-zinc-400 hover:border-zinc-900"
                      : isSelected
                      ? "bg-violet-50 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]"
                      : "bg-white border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] hover:-translate-y-0.5"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-extrabold rounded border border-zinc-900 ${meta.bgClass} ${meta.textClass}`}
                    >
                      {ATTR_ICONS[key]}
                      {meta.code}
                    </span>
                    <span
                      className={`font-hand text-2xl leading-none font-bold ${
                        tier.isUnexplored ? "text-zinc-400" : "text-zinc-900"
                      }`}
                    >
                      {entry.value > 0 ? entry.value : "—"}
                    </span>
                  </div>

                  <p className="text-[11px] font-bold text-zinc-800 truncate mt-1">
                    {meta.shortLabel}
                  </p>

                  <div className="mt-1.5 flex items-center justify-between gap-1">
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded border ${tier.badgeClass}`}
                    >
                      {tier.shortLabel}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500">
                      BNCC {meta.bnccCodes.join(",")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detalhe expansível do atributo clicado */}
          {activeAttrMeta && activeAttrEntry && (
            <div className="p-3 rounded-xl bg-[#FFFDF7] border-2 border-zinc-900 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-zinc-900 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  {activeAttrMeta.code} · {activeAttrMeta.label}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAttr(null)}
                  className="text-zinc-500 hover:text-zinc-900"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-zinc-600 leading-snug">
                {activeAttrMeta.description}
              </p>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {activeAttrMeta.bnccCodes.map((code) => (
                  <span
                    key={code}
                    className="px-1.5 py-0.5 text-[10px] font-bold bg-white border border-zinc-900 rounded-md"
                  >
                    BNCC {code}: {BNCC_GENERAL_COMPETENCIES[code]}
                  </span>
                ))}
              </div>
              <p className="text-[10px] font-bold text-zinc-500 pt-0.5">
                {activeAttrEntry.evidenceCount}{" "}
                {activeAttrEntry.evidenceCount === 1
                  ? "evidência registrada"
                  : "evidências registradas"}{" "}
                · Escala de crescimento (nunca diminui por punição).
              </p>
            </div>
          )}
        </div>

        {/* Álbum de Selos (Desbloqueados + Próximos) */}
        <div className="pt-3 border-t-2 border-dashed border-zinc-200 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-zinc-700" />
              Álbum de Selos ({student.badges.length})
            </p>
            <button
              type="button"
              onClick={() => setShowFeed((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#3B82F6] hover:underline"
            >
              <History className="w-3 h-3" />
              {showFeed ? "Ocultar Diário" : "Diário de Conquistas"}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {student.badges.map((badge) => (
              <span
                key={badge}
                className="px-2 py-0.5 text-xs font-bold bg-[#FEF9C3] border-2 border-zinc-900 rounded-lg"
              >
                ★ {badge}
              </span>
            ))}
            {BADGE_CATALOG.filter((b) => !student.badges.includes(b.label))
              .slice(0, 3)
              .map((locked) => (
                <span
                  key={locked.id}
                  title={`Como desbloquear: ${locked.hint}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold bg-zinc-100 text-zinc-500 border border-dashed border-zinc-400 rounded-lg"
                >
                  <Lock className="w-2.5 h-2.5" />
                  {locked.label}
                </span>
              ))}
          </div>
        </div>

        {/* Diário Pessoal de Conquistas */}
        {showFeed && (
          <div className="pt-3 border-t-2 border-dashed border-zinc-200 space-y-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
              Últimos Registros na sua Ficha
            </p>
            {myFeed.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">
                Conclua etapas do Percurso Dinâmico ou participe do Espaço Híbrido para ver seu histórico aqui.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {myFeed.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2 rounded-lg bg-[#FAF8F5] border border-zinc-900 text-[11px]"
                  >
                    <div className="flex items-center justify-between gap-1 font-bold text-zinc-900">
                      <span className="truncate">{entry.title}</span>
                      <span className="text-[10px] text-zinc-500 shrink-0">
                        {entry.timestamp}
                      </span>
                    </div>
                    <p className="text-zinc-600 mt-0.5 leading-snug">
                      {entry.detail}
                    </p>
                    {entry.deltaSummary && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-extrabold bg-white border border-zinc-900 rounded">
                        {entry.deltaSummary}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </aside>

      {/* MODAL: Oficina do Personagem */}
      {showWorkshop && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setShowWorkshop(false)}
        >
          <form
            onSubmit={handleSaveWorkshop}
            onClick={(e) => e.stopPropagation()}
            className="animate-pop-in sketch-card w-full max-w-md bg-[#FAF8F5] p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
              <div>
                <h3 className="font-hand text-3xl leading-none text-zinc-900">
                  Oficina do Personagem
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Personalize seu avatar do Caderno Vivo e seu título disciplinar.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWorkshop(false)}
                className="sketch-btn-sm p-1.5 bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4 p-3.5 rounded-xl bg-white border-2 border-zinc-900">
              <SketchAvatar
                seed={student.avatarSeed}
                bgColor={draftConfig.bgColor}
                config={draftConfig}
                size="xl"
              />
              <div className="min-w-0 flex-1">
                <p className="font-hand text-2xl leading-none text-zinc-900 truncate">
                  {student.name}
                </p>
                <p className="text-xs font-extrabold text-[#8B5CF6] mt-1">
                  {draftTitle}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Nível {student.level} · Ficha BNCC
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Título Disciplinar Equipado
                </label>
                <select
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  className="sketch-input bg-white font-bold"
                >
                  {unlockedTitleOptions.map((title) => (
                    <option key={title} value={title}>
                      {title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Cor do Cartão
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_BG_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() =>
                        setDraftConfig((prev) => ({ ...prev, bgColor: hex }))
                      }
                      className={`w-7 h-7 rounded-full border-2 border-zinc-900 transition-transform ${
                        draftConfig.bgColor === hex
                          ? "scale-125 ring-2 ring-zinc-900"
                          : ""
                      }`}
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                    Tom de Pele
                  </label>
                  <div className="flex gap-1.5">
                    {AVATAR_SKIN_TONES.map((tone, idx) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() =>
                          setDraftConfig((prev) => ({ ...prev, skinIndex: idx }))
                        }
                        className={`w-6 h-6 rounded-full border-2 border-zinc-900 ${
                          draftConfig.skinIndex === idx
                            ? "scale-110 ring-2 ring-zinc-900"
                            : ""
                        }`}
                        style={{ backgroundColor: tone }}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                    Cor do Cabelo
                  </label>
                  <div className="flex gap-1.5">
                    {AVATAR_HAIR_COLORS.map((hair, idx) => (
                      <button
                        key={hair}
                        type="button"
                        onClick={() =>
                          setDraftConfig((prev) => ({
                            ...prev,
                            hairColorIndex: idx,
                          }))
                        }
                        className={`w-6 h-6 rounded-full border-2 border-zinc-900 ${
                          draftConfig.hairColorIndex === idx
                            ? "scale-110 ring-2 ring-zinc-900"
                            : ""
                        }`}
                        style={{ backgroundColor: hair }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Estilo de Cabelo
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {["Curto", "Longo", "Repic.", "Coques", "Cacheado"].map(
                    (label, idx) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() =>
                          setDraftConfig((prev) => ({ ...prev, hairStyle: idx }))
                        }
                        className={`py-1.5 rounded-lg text-[11px] font-bold border-2 ${
                          draftConfig.hairStyle === idx
                            ? "bg-[#FACC15] border-zinc-900"
                            : "bg-white border-zinc-300"
                        }`}
                      >
                        {label}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="flex items-center gap-1.5 p-2 rounded-xl bg-white border-2 border-zinc-900 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftConfig.hasGlasses}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        hasGlasses: e.target.checked,
                      }))
                    }
                    className="accent-[#8B5CF6]"
                  />
                  Óculos
                </label>
                <label className="flex items-center gap-1.5 p-2 rounded-xl bg-white border-2 border-zinc-900 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftConfig.hasHeadband}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        hasHeadband: e.target.checked,
                      }))
                    }
                    className="accent-[#8B5CF6]"
                  />
                  Faixa
                </label>
                <label className="flex items-center gap-1.5 p-2 rounded-xl bg-white border-2 border-zinc-900 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={draftConfig.bigSmile}
                    onChange={(e) =>
                      setDraftConfig((prev) => ({
                        ...prev,
                        bigSmile: e.target.checked,
                      }))
                    }
                    className="accent-[#8B5CF6]"
                  />
                  Sorrisão
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="sketch-btn w-full py-2.5 bg-[#10B981] text-zinc-950 text-sm"
            >
              Salvar Personagem
            </button>
          </form>
        </div>
      )}
    </>
  );
}

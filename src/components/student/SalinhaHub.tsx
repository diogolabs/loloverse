"use client";

import React, { useState } from "react";
import {
  Hash,
  Pin,
  Send,
  Sparkles,
  Users,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { Student } from "@/types";
import { SketchAvatar } from "@/components/shared/SketchAvatar";

const QUICK_EMOJIS = ["🔥", "💡", "🙌", "🚀"];

const STATUS_LABEL: Record<
  Student["onlineStatus"],
  { text: string; badgeClass: string }
> = {
  estudando: { text: "Estudando", badgeClass: "bg-amber-200 text-amber-950" },
  "em-grupo": { text: "Em grupo", badgeClass: "bg-violet-200 text-violet-950" },
  online: { text: "Online", badgeClass: "bg-emerald-200 text-emerald-950" },
  offline: { text: "Offline", badgeClass: "bg-zinc-200 text-zinc-600" },
};

export function SalinhaHub({ student }: { student: Student }) {
  const { state, sendChatMessage, toggleReaction } = useLoloverse();
  const [activeChannelId, setActiveChannelId] = useState(
    state.channels[0]?.id || "ch-avisos"
  );
  const [draft, setDraft] = useState("");

  const activeChannel =
    state.channels.find((c) => c.id === activeChannelId) || state.channels[0];
  const channelMessages = state.messages.filter(
    (m) => m.channelId === activeChannel.id
  );
  const classmates = state.students.filter(
    (s) => s.classId === student.classId
  );
  const onlineClassmates = classmates.filter(
    (s) => s.onlineStatus !== "offline"
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendChatMessage(activeChannel.id, draft, "student");
    setDraft("");
  };

  return (
    <div className="sketch-card overflow-hidden bg-white grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
      {/* Left Sidebar: Channels */}
      <div className="lg:col-span-3 bg-[#FAF8F5] border-b-2 lg:border-b-0 lg:border-r-2 border-zinc-900 p-3.5 flex flex-col justify-between gap-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-hand text-2xl leading-none text-zinc-900">
              Salinha Híbrida
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-extrabold bg-[#10B981] text-zinc-950 border border-zinc-900 rounded-md">
              AO VIVO
            </span>
          </div>

          <div className="flex lg:flex-col gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {state.channels.map((ch) => {
              const isSelected = ch.id === activeChannel.id;
              const msgCount = state.messages.filter(
                (m) => m.channelId === ch.id
              ).length;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => setActiveChannelId(ch.id)}
                  className={`shrink-0 lg:w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all text-left ${
                    isSelected
                      ? "bg-[#FACC15] text-zinc-950 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                      : "bg-white/70 text-zinc-700 border-transparent hover:border-zinc-900 hover:bg-white"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <Hash className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{ch.label}</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/80 border border-zinc-900">
                    {msgCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hidden lg:block p-3 rounded-xl bg-violet-100 border-2 border-zinc-900 text-xs">
          <p className="font-hand text-base font-bold text-violet-950 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Dica Octalysis Social
          </p>
          <p className="text-violet-900/90 mt-0.5 leading-snug">
            Ajudar colegas no <strong>#duvidas-matematica</strong> conta para a missão de Mentoria Relâmpago!
          </p>
        </div>
      </div>

      {/* Center: Chat Stream */}
      <div className="lg:col-span-6 flex flex-col border-b-2 lg:border-b-0 lg:border-r-2 border-zinc-900 bg-white">
        {/* Channel Header */}
        <div className="px-4 py-3 border-b-2 border-zinc-900 bg-[#FFFDF7]">
          <div className="flex items-center gap-1.5">
            <Hash className="w-4 h-4 text-[#3B82F6]" />
            <h4 className="font-hand text-2xl leading-none text-zinc-900">
              {activeChannel.label}
            </h4>
          </div>
          <p className="text-xs text-zinc-600 mt-0.5">
            {activeChannel.description}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[390px]">
          {channelMessages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-xl border-2 border-zinc-900 ${
                msg.pinned
                  ? "bg-amber-50 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                  : msg.authorId === student.id
                  ? "bg-blue-50/70"
                  : "bg-[#FAF8F5]"
              }`}
            >
              <div className="flex items-start gap-2.5">
                <SketchAvatar
                  seed={msg.avatarSeed}
                  bgColor={msg.avatarColor}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-xs text-zinc-900">
                      {msg.authorName}
                    </span>
                    {msg.authorRole === "professor" && (
                      <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-[#3B82F6] text-white border border-zinc-900 rounded-md">
                        PROFESSOR
                      </span>
                    )}
                    {msg.pinned && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-extrabold bg-[#FACC15] border border-zinc-900 rounded-md">
                        <Pin className="w-2.5 h-2.5" /> Fixado
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-zinc-500 ml-auto">
                      {msg.timestamp}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-zinc-800 mt-1 leading-relaxed break-words">
                    {msg.content}
                  </p>

                  {/* Reactions */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    {msg.reactions.map((react) => (
                      <button
                        key={react.emoji}
                        type="button"
                        onClick={() => toggleReaction(msg.id, react.emoji)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border transition-all ${
                          react.userReacted
                            ? "bg-[#FACC15] border-zinc-900"
                            : "bg-white border-zinc-300 hover:border-zinc-900"
                        }`}
                      >
                        <span>{react.emoji}</span>
                        <span>{react.count}</span>
                      </button>
                    ))}
                    <div className="inline-flex items-center gap-1 ml-1">
                      {QUICK_EMOJIS.filter(
                        (e) => !msg.reactions.some((r) => r.emoji === e)
                      )
                        .slice(0, 2)
                        .map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => toggleReaction(msg.id, emoji)}
                            className="px-1.5 py-0.5 text-[11px] rounded-md bg-white/70 hover:bg-white border border-dashed border-zinc-300 hover:border-zinc-900 transition-colors"
                            title={`Reagir com ${emoji}`}
                          >
                            +{emoji}
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <form
          onSubmit={handleSend}
          className="p-3 border-t-2 border-zinc-900 bg-[#FAF8F5] flex items-center gap-2"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`Enviar mensagem em ${activeChannel.slug} como ${student.name.split(" ")[0]}...`}
            className="sketch-input bg-white"
          />
          <button
            type="submit"
            className="sketch-btn-sm px-3.5 py-2 bg-[#10B981] text-zinc-950 shrink-0"
            aria-label="Enviar mensagem"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Right Sidebar: Online Classmates */}
      <div className="lg:col-span-3 bg-[#FAF8F5] p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-hand text-xl text-zinc-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#10B981]" />
            Colegas ({onlineClassmates.length} online)
          </h4>
        </div>

        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-0.5">
          {classmates.map((mate) => {
            const st = STATUS_LABEL[mate.onlineStatus];
            return (
              <div
                key={mate.id}
                className={`p-2.5 rounded-xl border-2 border-zinc-900 bg-white flex items-start gap-2.5 ${
                  mate.onlineStatus === "offline" ? "opacity-60" : ""
                }`}
              >
                <SketchAvatar
                  seed={mate.avatarSeed}
                  bgColor={mate.avatarColor}
                  size="sm"
                  statusDot={mate.onlineStatus}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-xs text-zinc-900 truncate">
                      {mate.name.split(" ")[0]}
                      {mate.id === student.id ? " (Você)" : ""}
                    </p>
                    <span
                      className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded border border-zinc-900 ${st.badgeClass}`}
                    >
                      {st.text}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600 truncate mt-0.5">
                    {mate.studyActivity || "Offline no momento"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

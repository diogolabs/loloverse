"use client";

import React, { useState } from "react";
import {
  Hash,
  Headphones,
  LogOut,
  Pin,
  Plus,
  Send,
  Sparkles,
  Users,
  Volume2,
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

export function SalinhaHub({ classId }: { classId?: string }) {
  const {
    state,
    currentAccount,
    sendChatMessage,
    toggleReaction,
    togglePinMessage,
    createChannel,
    joinStudyRoom,
    leaveStudyRoom,
    updateMyStudyStatus,
  } = useLoloverse();

  const [activeChannelId, setActiveChannelId] = useState(
    state.channels[0]?.id || "ch-avisos"
  );
  const [draft, setDraft] = useState("");
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");

  const myStudent = currentAccount?.studentId
    ? state.students.find((s) => s.id === currentAccount.studentId)
    : undefined;

  const [statusInput, setStatusInput] = useState(
    myStudent?.studyActivity || "Revisando projetos da semana"
  );
  const [statusMode, setStatusMode] = useState<Student["onlineStatus"]>(
    myStudent?.onlineStatus || "estudando"
  );

  if (!currentAccount) return null;

  const isStaff =
    currentAccount.role === "teacher" || currentAccount.role === "coordinator";
  const targetClassId =
    classId || currentAccount.classId || state.selectedClassId;

  const activeChannel =
    state.channels.find((c) => c.id === activeChannelId) || state.channels[0];
  const channelMessages = state.messages.filter(
    (m) => m.channelId === activeChannel.id
  );
  const classmates = state.students.filter((s) => s.classId === targetClassId);
  const onlineClassmates = classmates.filter(
    (s) => s.onlineStatus !== "offline"
  );

  const myCurrentRoom = state.studyRooms.find((r) =>
    r.participantIds.includes(currentAccount.id)
  );

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    sendChatMessage(activeChannel.id, draft);
    setDraft("");
  };

  const handleCreateChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    createChannel(newChannelName, newChannelDesc);
    setNewChannelName("");
    setNewChannelDesc("");
    setShowNewChannel(false);
  };

  return (
    <div className="space-y-4">
      {/* Live Study Rooms Strip (Salinha / Discord Voice-Focus Tables) */}
      <div className="sketch-card p-4 bg-[#FFFDF7] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#8B5CF6] text-white border-2 border-zinc-900">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-hand text-2xl leading-none text-zinc-900">
                Mesas de Estudo ao Vivo (Estilo Salinha / Discord)
              </h3>
              <p className="text-xs text-zinc-600">
                Sente em uma mesa temática para estudar em grupo, tirar dúvidas ou acompanhar colegas
              </p>
            </div>
          </div>

          {myCurrentRoom && (
            <button
              type="button"
              onClick={leaveStudyRoom}
              className="sketch-btn-sm px-3 py-1.5 bg-[#F43F5E] text-white text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sair de &ldquo;{myCurrentRoom.name}&rdquo;
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {state.studyRooms.map((room) => {
            const isInside = room.participantIds.includes(currentAccount.id);
            const seatedAccounts = room.participantIds
              .map((id) => state.accounts.find((a) => a.id === id))
              .filter(Boolean);

            return (
              <div
                key={room.id}
                className={`p-3.5 rounded-xl border-2 border-zinc-900 flex flex-col justify-between gap-3 transition-all ${
                  isInside
                    ? "bg-violet-100 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]"
                    : "bg-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-bold text-xs text-zinc-900">
                      <Volume2 className="w-4 h-4 text-[#8B5CF6]" />
                      {room.name}
                    </span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-[#FAF8F5] border border-zinc-900 rounded">
                      {seatedAccounts.length}/{room.maxSeats}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-600">{room.topic}</p>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-zinc-300">
                  <div className="flex -space-x-2">
                    {seatedAccounts.length === 0 ? (
                      <span className="text-[11px] text-zinc-400 font-semibold">
                        Mesa livre
                      </span>
                    ) : (
                      seatedAccounts.map((acc) =>
                        acc ? (
                          <div
                            key={acc.id}
                            title={acc.displayName}
                            className="transition-transform hover:scale-110"
                          >
                            <SketchAvatar
                              seed={acc.avatarSeed}
                              bgColor={acc.avatarColor}
                              size="sm"
                            />
                          </div>
                        ) : null
                      )
                    )}
                  </div>

                  {isInside ? (
                    <span className="px-2 py-1 text-[11px] font-extrabold bg-[#10B981] text-zinc-950 border-2 border-zinc-900 rounded-lg">
                      Conectado
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => joinStudyRoom(room.id)}
                      className="sketch-btn-sm px-2.5 py-1 bg-[#FACC15] text-zinc-950 text-[11px]"
                    >
                      Entrar na Mesa
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Discord-style Text Channels + Stream + Classmates */}
      <div className="sketch-card overflow-hidden bg-white grid grid-cols-1 lg:grid-cols-12 min-h-[540px]">
        {/* Left Sidebar: Channels */}
        <div className="lg:col-span-3 bg-[#FAF8F5] border-b-2 lg:border-b-0 lg:border-r-2 border-zinc-900 p-3.5 flex flex-col justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-hand text-2xl leading-none text-zinc-900">
                Canais de Texto
              </h3>
              {isStaff && (
                <button
                  type="button"
                  onClick={() => setShowNewChannel((v) => !v)}
                  className="sketch-btn-sm p-1 bg-[#FACC15] text-zinc-950"
                  title="Criar novo canal"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {showNewChannel && isStaff && (
              <form
                onSubmit={handleCreateChannel}
                className="p-2.5 rounded-xl bg-white border-2 border-zinc-900 space-y-2"
              >
                <input
                  type="text"
                  required
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="ex: feira-ciencias"
                  className="sketch-input text-xs py-1.5"
                />
                <input
                  type="text"
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="Descrição breve"
                  className="sketch-input text-xs py-1.5"
                />
                <button
                  type="submit"
                  className="sketch-btn-sm w-full py-1.5 bg-[#10B981] text-zinc-950 text-xs"
                >
                  Criar Canal
                </button>
              </form>
            )}

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
              <Sparkles className="w-3.5 h-3.5" /> Sincronização Ao Vivo
            </p>
            <p className="text-violet-900/90 mt-0.5 leading-snug">
              Mensagens e mesas sincronizam instantaneamente entre abas logadas com contas diferentes!
            </p>
          </div>
        </div>

        {/* Center: Chat Stream */}
        <div className="lg:col-span-6 flex flex-col border-b-2 lg:border-b-0 lg:border-r-2 border-zinc-900 bg-white">
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

          <div className="flex-1 p-4 space-y-3.5 overflow-y-auto max-h-[410px]">
            {channelMessages.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 text-sm font-medium">
                Nenhuma mensagem neste canal ainda. Envie a primeira!
              </div>
            ) : (
              channelMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl border-2 border-zinc-900 ${
                    msg.pinned
                      ? "bg-amber-50 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                      : msg.authorId === currentAccount.id
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
                        {msg.authorRole === "coordenador" && (
                          <span className="px-1.5 py-0.5 text-[10px] font-extrabold bg-[#8B5CF6] text-white border border-zinc-900 rounded-md">
                            COORDENAÇÃO
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
                        {isStaff && (
                          <button
                            type="button"
                            onClick={() => togglePinMessage(msg.id)}
                            className="p-0.5 rounded hover:bg-zinc-200 text-zinc-600"
                            title={msg.pinned ? "Desafixar" : "Fixar no mural"}
                          >
                            <Pin className="w-3 h-3" />
                          </button>
                        )}
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
              ))
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="p-3 border-t-2 border-zinc-900 bg-[#FAF8F5] flex items-center gap-2"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Mensagem em ${activeChannel.slug} como ${currentAccount.displayName}...`}
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

        {/* Right Sidebar: Online Classmates & My Study Status */}
        <div className="lg:col-span-3 bg-[#FAF8F5] p-3.5 space-y-3">
          {myStudent && (
            <div className="p-2.5 rounded-xl bg-white border-2 border-zinc-900 space-y-2">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-zinc-500">
                Meu Status de Estudo
              </p>
              <select
                value={statusMode}
                onChange={(e) =>
                  setStatusMode(e.target.value as Student["onlineStatus"])
                }
                className="sketch-input text-xs py-1 font-bold"
              >
                <option value="estudando">Estudando</option>
                <option value="em-grupo">Em grupo</option>
                <option value="online">Online</option>
              </select>
              <input
                type="text"
                value={statusInput}
                onChange={(e) => setStatusInput(e.target.value)}
                placeholder="O que você está estudando?"
                className="sketch-input text-xs py-1"
              />
              <button
                type="button"
                onClick={() => updateMyStudyStatus(statusMode, statusInput)}
                className="sketch-btn-sm w-full py-1 bg-[#FACC15] text-zinc-950 text-[11px]"
              >
                Atualizar Status
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <h4 className="font-hand text-xl text-zinc-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#10B981]" />
              Turma ({onlineClassmates.length} online)
            </h4>
          </div>

          <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
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
                        {mate.id === myStudent?.id ? " (Você)" : ""}
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
    </div>
  );
}

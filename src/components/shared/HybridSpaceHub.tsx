"use client";

import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Hash,
  Headphones,
  LogOut,
  MessageSquarePlus,
  Pencil,
  Pin,
  Plus,
  Send,
  Sparkles,
  Trash2,
  Users,
  Volume2,
  X,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { PILLAR_META } from "@/data/mockData";
import { EngagementPillar, Student, StudyRoom } from "@/types";
import { SketchAvatar } from "@/components/shared/SketchAvatar";
import { PillarBadge } from "@/components/shared/PillarBadge";

const QUICK_EMOJIS = ["🔥", "💡", "🙌", "🚀"];

const ACCENT_OPTIONS = [
  { label: "Amarelo", value: "#FACC15" },
  { label: "Azul", value: "#3B82F6" },
  { label: "Verde", value: "#10B981" },
  { label: "Roxo", value: "#8B5CF6" },
  { label: "Coral", value: "#F43F5E" },
  { label: "Laranja", value: "#FB923C" },
];

const STATUS_LABEL: Record<
  Student["onlineStatus"],
  { text: string; badgeClass: string }
> = {
  estudando: { text: "Estudando", badgeClass: "bg-amber-200 text-amber-950" },
  "em-grupo": { text: "Em grupo", badgeClass: "bg-violet-200 text-violet-950" },
  online: { text: "Online", badgeClass: "bg-emerald-200 text-emerald-950" },
  offline: { text: "Offline", badgeClass: "bg-zinc-200 text-zinc-600" },
};

export function HybridSpaceHub({ classId }: { classId?: string }) {
  const {
    state,
    currentAccount,
    createCategory,
    createChannel,
    updateChannel,
    createTopic,
    updateTopic,
    sendChatMessage,
    toggleReaction,
    togglePinMessage,
    createStudyRoom,
    updateStudyRoom,
    deleteStudyRoom,
    joinStudyRoom,
    leaveStudyRoom,
    updateMyStudyStatus,
  } = useLoloverse();

  const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});
  const [activeChannelId, setActiveChannelId] = useState(
    state.channels[0]?.id || "ch-avisos"
  );
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  // Modals for clean UX (Zero clutter on main screen!)
  const [editingRoom, setEditingRoom] = useState<StudyRoom | "new" | null>(null);
  const [roomName, setRoomName] = useState("");
  const [roomTopic, setRoomTopic] = useState("");
  const [roomSeats, setRoomSeats] = useState(6);
  const [roomColor, setRoomColor] = useState("#FACC15");

  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [catName, setCatName] = useState("");
  const [catColor, setCatColor] = useState("#3B82F6");

  const [showChannelModal, setShowChannelModal] = useState<
    "new" | "edit" | null
  >(null);
  const [chCategoryId, setChCategoryId] = useState(
    state.categories[0]?.id || "cat-avisos"
  );
  const [chTitle, setChTitle] = useState("");
  const [chDesc, setChDesc] = useState("");
  const [chStaffOnly, setChStaffOnly] = useState(false);

  const [showTopicModal, setShowTopicModal] = useState(false);
  const [topTitle, setTopTitle] = useState("");
  const [topSummary, setTopSummary] = useState("");
  const [topPillar, setTopPillar] = useState<EngagementPillar>("maestria");

  const myStudent = currentAccount?.studentId
    ? state.students.find((s) => s.id === currentAccount.studentId)
    : undefined;

  const [statusInput, setStatusInput] = useState(
    myStudent?.studyActivity || "Revisando projetos da semana"
  );
  const [statusMode, setStatusMode] = useState<Student["onlineStatus"]>(
    myStudent?.onlineStatus || "estudando"
  );

  const activeChannel =
    state.channels.find((c) => c.id === activeChannelId) || state.channels[0];

  const channelTopics = useMemo(() => {
    const list = state.topics.filter((t) => t.channelId === activeChannel?.id);
    return [...list].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)));
  }, [state.topics, activeChannel?.id]);

  const activeTopic =
    channelTopics.find((t) => t.id === selectedTopicId) || channelTopics[0] || null;

  if (!currentAccount || !activeChannel) return null;

  const isStaff =
    currentAccount.role === "teacher" || currentAccount.role === "coordinator";
  const targetClassId =
    classId || currentAccount.classId || state.selectedClassId;

  const topicMessages = activeTopic
    ? state.messages.filter((m) => m.topicId === activeTopic.id)
    : [];

  const classmates = state.students.filter((s) => s.classId === targetClassId);
  const onlineClassmates = classmates.filter(
    (s) => s.onlineStatus !== "offline"
  );
  const myCurrentRoom = state.studyRooms.find((r) =>
    r.participantIds.includes(currentAccount.id)
  );

  const canCreateTopicHere = isStaff || !activeChannel.staffOnlyTopics;

  // Handlers
  const openEditRoom = (room: StudyRoom) => {
    setEditingRoom(room);
    setRoomName(room.name);
    setRoomTopic(room.topic);
    setRoomSeats(room.maxSeats);
    setRoomColor(room.accentColor);
  };

  const openNewRoom = () => {
    setEditingRoom("new");
    setRoomName("");
    setRoomTopic("");
    setRoomSeats(6);
    setRoomColor("#8B5CF6");
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    if (editingRoom === "new") {
      createStudyRoom({
        name: roomName,
        topic: roomTopic,
        maxSeats: roomSeats,
        accentColor: roomColor,
      });
    } else if (editingRoom) {
      updateStudyRoom(editingRoom.id, {
        name: roomName,
        topic: roomTopic,
        maxSeats: roomSeats,
        accentColor: roomColor,
      });
    }
    setEditingRoom(null);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    createCategory(catName, catColor);
    setCatName("");
    setShowCategoryModal(false);
  };

  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chTitle.trim()) return;
    if (showChannelModal === "edit") {
      updateChannel(activeChannel.id, chTitle, chDesc);
    } else {
      const createdId = createChannel(
        chCategoryId,
        chTitle,
        chDesc,
        chStaffOnly
      );
      if (createdId) {
        setActiveChannelId(createdId);
        setSelectedTopicId(null);
      }
    }
    setChTitle("");
    setChDesc("");
    setShowChannelModal(null);
  };

  const handleSaveTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topTitle.trim()) return;
    const newId = createTopic(
      activeChannel.id,
      topTitle,
      topSummary,
      topPillar
    );
    if (newId) setSelectedTopicId(newId);
    setTopTitle("");
    setTopSummary("");
    setShowTopicModal(false);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !activeTopic) return;
    sendChatMessage(activeChannel.id, activeTopic.id, draft);
    setDraft("");
  };

  return (
    <div className="space-y-5">
      {/* 1. MESAS DE ESTUDO AO VIVO (Editáveis por Professor & Coordenador) */}
      <section className="sketch-card p-4 sm:p-5 bg-[#FFFDF7] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#8B5CF6] text-white border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-hand text-2xl sm:text-3xl leading-none text-zinc-900">
                Mesas de Estudo ao Vivo
              </h2>
              <p className="text-xs text-zinc-600 mt-0.5">
                {isStaff
                  ? "Você pode editar o tema de qualquer mesa ou abrir novas mesas guiadas para a turma."
                  : "Escolha uma mesa temática para estudar acompanhado ou tirar dúvidas em grupo."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
            {isStaff && (
              <button
                type="button"
                onClick={openNewRoom}
                className="sketch-btn-sm px-3 py-1.5 bg-[#FACC15] text-zinc-950 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Mesa
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
          {state.studyRooms.map((room) => {
            const isInside = room.participantIds.includes(currentAccount.id);
            const seatedAccounts = room.participantIds
              .map((id) => state.accounts.find((a) => a.id === id))
              .filter(Boolean);

            return (
              <div
                key={room.id}
                className={`rounded-xl border-2 border-zinc-900 overflow-hidden flex flex-col justify-between transition-all bg-white ${
                  isInside
                    ? "shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] ring-2 ring-[#8B5CF6]"
                    : "shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]"
                }`}
              >
                {/* Notebook colored header strip */}
                <div
                  className="px-3.5 py-2 border-b-2 border-zinc-900 flex items-center justify-between gap-2"
                  style={{ backgroundColor: `${room.accentColor}40` }}
                >
                  <span className="inline-flex items-center gap-1.5 font-bold text-xs text-zinc-900 truncate">
                    <Volume2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">{room.name}</span>
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-white border border-zinc-900 rounded">
                      {seatedAccounts.length}/{room.maxSeats}
                    </span>
                    {isStaff && (
                      <button
                        type="button"
                        onClick={() => openEditRoom(room)}
                        className="p-1 rounded-md bg-white hover:bg-[#FACC15] border border-zinc-900 transition-colors"
                        title="Editar tema e configurações desta mesa"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between">
                  <p className="text-xs font-medium text-zinc-700 leading-snug">
                    {room.topic}
                  </p>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-dashed border-zinc-200">
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
                      <span className="px-2.5 py-1 text-[11px] font-extrabold bg-[#10B981] text-zinc-950 border-2 border-zinc-900 rounded-lg">
                        Conectado
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => joinStudyRoom(room.id)}
                        className="sketch-btn-sm px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#FACC15] text-zinc-900 text-[11px]"
                      >
                        Entrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. ESPAÇO HÍBRIDO ORGANIZADO (Categorias -> Canais -> Tópicos Guiados) */}
      <section className="sketch-card overflow-hidden bg-white grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
        {/* Coluna 1: Categorias & Canais (Limpo, sem poluição visual) */}
        <aside className="lg:col-span-3 bg-[#FAF8F5] border-b-2 lg:border-b-0 lg:border-r-2 border-zinc-900 p-4 flex flex-col justify-between gap-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-hand text-2xl leading-none text-zinc-900">
                Espaço Híbrido
              </h3>
              {isStaff && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowCategoryModal(true)}
                    className="sketch-btn-sm p-1.5 bg-white hover:bg-[#FACC15]"
                    title="Criar nova categoria"
                  >
                    <FolderPlus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setChCategoryId(state.categories[0]?.id || "cat-avisos");
                      setChTitle("");
                      setChDesc("");
                      setChStaffOnly(false);
                      setShowChannelModal("new");
                    }}
                    className="sketch-btn-sm p-1.5 bg-[#FACC15] text-zinc-950"
                    title="Criar novo canal"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Categories Tree */}
            <div className="space-y-3">
              {state.categories.map((cat) => {
                const isCollapsed = Boolean(collapsedCats[cat.id]);
                const catChannels = state.channels.filter(
                  (c) => c.categoryId === cat.id
                );

                return (
                  <div key={cat.id} className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setCollapsedCats((prev) => ({
                          ...prev,
                          [cat.id]: !prev[cat.id],
                        }))
                      }
                      className="w-full flex items-center justify-between gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-zinc-600 hover:text-zinc-900 px-1"
                    >
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-zinc-900 shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="truncate">{cat.name}</span>
                      </span>
                      {isCollapsed ? (
                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                      )}
                    </button>

                    {!isCollapsed && (
                      <div className="space-y-1 pl-1">
                        {catChannels.length === 0 ? (
                          <p className="text-[11px] text-zinc-400 italic px-2 py-1">
                            Sem canais ainda
                          </p>
                        ) : (
                          catChannels.map((ch) => {
                            const isSelected = ch.id === activeChannel.id;
                            const topicsCount = state.topics.filter(
                              (t) => t.channelId === ch.id
                            ).length;

                            return (
                              <button
                                key={ch.id}
                                type="button"
                                onClick={() => {
                                  setActiveChannelId(ch.id);
                                  setSelectedTopicId(null);
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all text-left ${
                                  isSelected
                                    ? "bg-white text-zinc-950 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                                    : "bg-transparent text-zinc-700 border-transparent hover:bg-white/80 hover:border-zinc-300"
                                }`}
                              >
                                <span className="inline-flex items-center gap-1.5 truncate">
                                  <Hash
                                    className="w-3.5 h-3.5 shrink-0"
                                    style={{ color: cat.color }}
                                  />
                                  <span className="truncate">{ch.title}</span>
                                </span>
                                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-[#FAF8F5] border border-zinc-300 text-zinc-600">
                                  {topicsCount}
                                </span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compact Student Status Box */}
          {myStudent ? (
            <div className="p-3 rounded-xl bg-white border-2 border-zinc-900 space-y-2">
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
                placeholder="No que você está focado?"
                className="sketch-input text-xs py-1"
              />
              <button
                type="button"
                onClick={() => updateMyStudyStatus(statusMode, statusInput)}
                className="sketch-btn-sm w-full py-1.5 bg-[#FACC15] text-zinc-950 text-[11px]"
              >
                Atualizar Status
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-violet-100 border-2 border-zinc-900 text-xs">
              <p className="font-hand text-base font-bold text-violet-950 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Modo Curadoria
              </p>
              <p className="text-violet-900/90 mt-0.5 leading-snug">
                Crie categorias, canais e tópicos limpos para guiar o aprendizado sem bagunça de chat infinito.
              </p>
            </div>
          )}
        </aside>

        {/* Coluna 2: Tópicos Guiados do Canal */}
        <div className="lg:col-span-4 border-b-2 lg:border-b-0 lg:border-r-2 border-zinc-900 bg-[#FFFDF7] flex flex-col">
          <div className="p-4 border-b-2 border-zinc-900 bg-white space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="font-hand text-2xl leading-none text-zinc-900 truncate">
                    {activeChannel.title}
                  </h4>
                  {isStaff && (
                    <button
                      type="button"
                      onClick={() => {
                        setChTitle(activeChannel.title);
                        setChDesc(activeChannel.description);
                        setShowChannelModal("edit");
                      }}
                      className="p-1 rounded hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                      title="Editar nome e descrição do canal"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-600 mt-1 leading-snug">
                  {activeChannel.description}
                </p>
              </div>
            </div>

            {canCreateTopicHere && (
              <button
                type="button"
                onClick={() => setShowTopicModal(true)}
                className="sketch-btn-sm w-full py-2 bg-[#10B981] text-zinc-950 text-xs"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Abrir Novo Tópico neste Canal
              </button>
            )}
          </div>

          <div className="p-3 space-y-2.5 overflow-y-auto flex-1 max-h-[460px]">
            {channelTopics.length === 0 ? (
              <div className="p-6 text-center text-xs text-zinc-500">
                Nenhum tópico criado ainda neste canal.
              </div>
            ) : (
              channelTopics.map((topic) => {
                const isSelected = activeTopic?.id === topic.id;
                const count = state.messages.filter(
                  (m) => m.topicId === topic.id
                ).length;

                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all space-y-1.5 ${
                      isSelected
                        ? "bg-white border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)]"
                        : "bg-white/70 border-zinc-200 hover:border-zinc-900 hover:bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-1.5">
                      {topic.pinned && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-extrabold bg-[#FACC15] border border-zinc-900 rounded">
                          <Pin className="w-2.5 h-2.5" /> Fixado
                        </span>
                      )}
                      {topic.resolved && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-extrabold bg-emerald-200 text-emerald-950 border border-zinc-900 rounded">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Resolvido
                        </span>
                      )}
                      {topic.pillar && (
                        <PillarBadge pillar={topic.pillar} compact />
                      )}
                    </div>

                    <h5 className="font-bold text-sm text-zinc-900 leading-snug">
                      {topic.title}
                    </h5>
                    <p className="text-xs text-zinc-600 line-clamp-2">
                      {topic.summary}
                    </p>

                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 pt-1">
                      <span>Por {topic.createdBy}</span>
                      <span>
                        {count} {count === 1 ? "resposta" : "respostas"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna 3: Conversa Focada do Tópico Selecionado */}
        <div className="lg:col-span-5 flex flex-col bg-white">
          {activeTopic ? (
            <>
              {/* Topic Header */}
              <div className="p-4 border-b-2 border-zinc-900 bg-[#FAF8F5] space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <ArrowLeft className="w-3 h-3 lg:hidden" />
                        {activeChannel.title}
                      </span>
                      <span>·</span>
                      <span>{activeTopic.createdAt}</span>
                    </div>
                    <h4 className="font-hand text-2xl leading-tight text-zinc-900">
                      {activeTopic.title}
                    </h4>
                    <p className="text-xs text-zinc-600">{activeTopic.summary}</p>
                  </div>
                </div>

                {isStaff && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() =>
                        updateTopic(activeTopic.id, {
                          resolved: !activeTopic.resolved,
                        })
                      }
                      className={`sketch-btn-sm px-2.5 py-1 text-[11px] ${
                        activeTopic.resolved
                          ? "bg-[#10B981] text-zinc-950"
                          : "bg-white hover:bg-emerald-50"
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {activeTopic.resolved ? "Resolvido" : "Marcar Resolvido"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateTopic(activeTopic.id, {
                          pinned: !activeTopic.pinned,
                        })
                      }
                      className={`sketch-btn-sm px-2.5 py-1 text-[11px] ${
                        activeTopic.pinned
                          ? "bg-[#FACC15] text-zinc-950"
                          : "bg-white hover:bg-amber-50"
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                      {activeTopic.pinned ? "Fixado" : "Fixar Tópico"}
                    </button>
                  </div>
                )}
              </div>

              {/* Focused Topic Messages */}
              <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[380px]">
                {topicMessages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-zinc-500 font-medium">
                    Tópico aberto! Escreva a primeira mensagem abaixo para iniciar a conversa.
                  </div>
                ) : (
                  topicMessages.map((msg) => (
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
                            <span className="text-[10px] font-semibold text-zinc-500 ml-auto">
                              {msg.timestamp}
                            </span>
                            {isStaff && (
                              <button
                                type="button"
                                onClick={() => togglePinMessage(msg.id)}
                                className="p-0.5 rounded hover:bg-zinc-200 text-zinc-600"
                                title={
                                  msg.pinned
                                    ? "Remover destaque"
                                    : "Destacar resposta"
                                }
                              >
                                <Pin className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <p className="text-xs sm:text-sm text-zinc-800 mt-1 leading-relaxed break-words">
                            {msg.content}
                          </p>

                          <div className="flex flex-wrap items-center gap-1.5 mt-2">
                            {msg.reactions.map((react) => (
                              <button
                                key={react.emoji}
                                type="button"
                                onClick={() =>
                                  toggleReaction(msg.id, react.emoji)
                                }
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
                                >
                                  +{emoji}
                                </button>
                              ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Input */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t-2 border-zinc-900 bg-[#FAF8F5] flex items-center gap-2"
              >
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Responder em "${activeTopic.title}"...`}
                  className="sketch-input bg-white"
                />
                <button
                  type="submit"
                  className="sketch-btn-sm px-3.5 py-2 bg-[#10B981] text-zinc-950 shrink-0"
                  aria-label="Enviar resposta"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8 text-center text-sm text-zinc-500">
              Selecione ou crie um tópico para conversar com a turma.
            </div>
          )}
        </div>
      </section>

      {/* 3. PRESENÇA DA TURMA (Horizontal, leve e acolhedor) */}
      <section className="sketch-card p-4 bg-[#FAF8F5] space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-hand text-xl text-zinc-900 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-[#10B981]" />
            Colegas na Turma ({onlineClassmates.length} ativos agora)
          </h4>
          <span className="text-[11px] font-semibold text-zinc-500">
            Presença sincronizada ao vivo entre abas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {classmates.map((mate) => {
            const st = STATUS_LABEL[mate.onlineStatus];
            return (
              <div
                key={mate.id}
                className={`p-2.5 rounded-xl border-2 border-zinc-900 bg-white flex items-center gap-2.5 ${
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
                    {mate.studyActivity || "Offline"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* MODAL: Editar / Criar Mesa de Estudo (Professor & Coordenador) */}
      {editingRoom && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setEditingRoom(null)}
        >
          <form
            onSubmit={handleSaveRoom}
            onClick={(e) => e.stopPropagation()}
            className="animate-pop-in sketch-card w-full max-w-md bg-[#FAF8F5] p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
              <h3 className="font-hand text-2xl leading-none">
                {editingRoom === "new"
                  ? "Criar Nova Mesa de Estudo"
                  : "Editar Tema da Mesa"}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRoom(null)}
                className="sketch-btn-sm p-1 bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Nome da Mesa
                </label>
                <input
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Ex: Oficina de Redação ENEM"
                  className="sketch-input bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Tema / Pauta Atual
                </label>
                <input
                  type="text"
                  required
                  value={roomTopic}
                  onChange={(e) => setRoomTopic(e.target.value)}
                  placeholder="Ex: Revisão de argumentos e repertório sociocultural"
                  className="sketch-input bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                    Vagas (Lugares)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={20}
                    value={roomSeats}
                    onChange={(e) => setRoomSeats(Number(e.target.value))}
                    className="sketch-input bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                    Cor do Marcador
                  </label>
                  <div className="flex items-center gap-1.5 pt-1.5">
                    {ACCENT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRoomColor(opt.value)}
                        className={`w-6 h-6 rounded-full border-2 border-zinc-900 transition-transform ${
                          roomColor === opt.value ? "scale-125 ring-2 ring-zinc-900" : ""
                        }`}
                        style={{ backgroundColor: opt.value }}
                        title={opt.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              {editingRoom !== "new" ? (
                <button
                  type="button"
                  onClick={() => {
                    deleteStudyRoom(editingRoom.id);
                    setEditingRoom(null);
                  }}
                  className="sketch-btn-sm px-3 py-2 bg-rose-100 hover:bg-[#F43F5E] hover:text-white text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remover
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                className="sketch-btn-sm px-4 py-2 bg-[#10B981] text-zinc-950 text-xs"
              >
                Salvar Mesa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Nova Categoria */}
      {showCategoryModal && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setShowCategoryModal(false)}
        >
          <form
            onSubmit={handleSaveCategory}
            onClick={(e) => e.stopPropagation()}
            className="animate-pop-in sketch-card w-full max-w-sm bg-[#FAF8F5] p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
              <h3 className="font-hand text-2xl leading-none">
                Nova Categoria de Canais
              </h3>
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="sketch-btn-sm p-1 bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Nome da Categoria
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ex: Olimpíadas & Clubes"
                  className="sketch-input bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Cor do Marcador
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {ACCENT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setCatColor(opt.value)}
                      className={`w-7 h-7 rounded-full border-2 border-zinc-900 transition-transform ${
                        catColor === opt.value ? "scale-125 ring-2 ring-zinc-900" : ""
                      }`}
                      style={{ backgroundColor: opt.value }}
                      title={opt.label}
                    />
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="sketch-btn w-full py-2.5 bg-[#FACC15] text-zinc-950 text-sm"
            >
              Criar Categoria
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Criar / Editar Canal */}
      {showChannelModal && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setShowChannelModal(null)}
        >
          <form
            onSubmit={handleSaveChannel}
            onClick={(e) => e.stopPropagation()}
            className="animate-pop-in sketch-card w-full max-w-md bg-[#FAF8F5] p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
              <h3 className="font-hand text-2xl leading-none">
                {showChannelModal === "edit"
                  ? "Editar Canal"
                  : "Criar Novo Canal"}
              </h3>
              <button
                type="button"
                onClick={() => setShowChannelModal(null)}
                className="sketch-btn-sm p-1 bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {showChannelModal === "new" && (
                <div>
                  <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={chCategoryId}
                    onChange={(e) => setChCategoryId(e.target.value)}
                    className="sketch-input bg-white font-semibold"
                  >
                    {state.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Nome Amigável do Canal
                </label>
                <input
                  type="text"
                  required
                  value={chTitle}
                  onChange={(e) => setChTitle(e.target.value)}
                  placeholder="Ex: Feira de Ciências 2026"
                  className="sketch-input bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Propósito / Descrição Curta
                </label>
                <textarea
                  rows={2}
                  value={chDesc}
                  onChange={(e) => setChDesc(e.target.value)}
                  placeholder="Explique o que a turma deve compartilhar aqui..."
                  className="sketch-input bg-white resize-none"
                />
              </div>

              {showChannelModal === "new" && (
                <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chStaffOnly}
                    onChange={(e) => setChStaffOnly(e.target.checked)}
                    className="w-4 h-4 accent-[#8B5CF6]"
                  />
                  Apenas Professores/Coordenação podem abrir novos tópicos neste canal
                </label>
              )}
            </div>

            <button
              type="submit"
              className="sketch-btn w-full py-2.5 bg-[#10B981] text-zinc-950 text-sm"
            >
              {showChannelModal === "edit" ? "Salvar Alterações" : "Criar Canal"}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: Abrir Novo Tópico */}
      {showTopicModal && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setShowTopicModal(false)}
        >
          <form
            onSubmit={handleSaveTopic}
            onClick={(e) => e.stopPropagation()}
            className="animate-pop-in sketch-card w-full max-w-md bg-[#FAF8F5] p-5 space-y-4"
          >
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
              <h3 className="font-hand text-2xl leading-none">
                Novo Tópico em {activeChannel.title}
              </h3>
              <button
                type="button"
                onClick={() => setShowTopicModal(false)}
                className="sketch-btn-sm p-1 bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Título do Tópico
                </label>
                <input
                  type="text"
                  required
                  value={topTitle}
                  onChange={(e) => setTopTitle(e.target.value)}
                  placeholder="Ex: Dúvida na montagem do resistor de 220Ω"
                  className="sketch-input bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Resumo / Contexto
                </label>
                <textarea
                  rows={2}
                  value={topSummary}
                  onChange={(e) => setTopSummary(e.target.value)}
                  placeholder="Descreva em 1 frase o foco deste tópico para facilitar a leitura..."
                  className="sketch-input bg-white resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase text-zinc-700 mb-1">
                  Competência Relacionada
                </label>
                <select
                  value={topPillar}
                  onChange={(e) =>
                    setTopPillar(e.target.value as EngagementPillar)
                  }
                  className="sketch-input bg-white font-semibold"
                >
                  {(Object.keys(PILLAR_META) as EngagementPillar[]).map(
                    (p) => (
                      <option key={p} value={p}>
                        {PILLAR_META[p].label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="sketch-btn w-full py-2.5 bg-[#10B981] text-zinc-950 text-sm"
            >
              Publicar Tópico
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

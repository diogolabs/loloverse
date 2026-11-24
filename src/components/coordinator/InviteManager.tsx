"use client";

import React, { useMemo, useState } from "react";
import {
  Ban,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  KeyRound,
  MailPlus,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { InviteRecord } from "@/types";

interface ParsedCsvRow {
  email: string;
  role: "student" | "teacher" | "coordinator";
  classId: string;
  note: string;
  error?: string;
}

function normalizeRole(raw: string): "student" | "teacher" | "coordinator" | null {
  const v = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (!v || v === "student" || v === "aluno" || v === "aluna" || v === "estudante") {
    return "student";
  }
  if (v === "teacher" || v === "professor" || v === "professora" || v === "docente") {
    return "teacher";
  }
  if (v === "coordinator" || v === "coordenador" || v === "coordenadora" || v === "coord") {
    return "coordinator";
  }
  return null;
}

export function InviteManager() {
  const {
    state,
    invites,
    isBackendConnected,
    generateInvites,
    revokeInvite,
    refreshData,
  } = useLoloverse();

  const [mode, setMode] = useState<"single" | "csv">("single");
  const [busy, setBusy] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form individual
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"student" | "teacher" | "coordinator">("student");
  const [classId, setClassId] = useState(state.classes[0]?.id || "");
  const [expiresInDays, setExpiresInDays] = useState(14);
  const [note, setNote] = useState("");

  // Form CSV em lote
  const [csvText, setCsvText] = useState("");
  const [csvDefaultRole, setCsvDefaultRole] = useState<"student" | "teacher" | "coordinator">("student");
  const [csvDefaultClassId, setCsvDefaultClassId] = useState(state.classes[0]?.id || "");

  // Filtro da lista
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "used">("all");

  const classMap = useMemo(() => {
    const map = new Map<string, string>();
    state.classes.forEach((c) => map.set(c.id, c.name));
    return map;
  }, [state.classes]);

  const parsedCsvRows = useMemo<ParsedCsvRow[]>(() => {
    const lines = csvText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return [];

    const rows: ParsedCsvRow[] = [];
    const seenEmails = new Set<string>();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const sep = line.includes(";") ? ";" : line.includes("\t") ? "\t" : ",";
      const parts = line.split(sep).map((p) => p.trim().replace(/^"|"$/g, ""));

      // Pula linha de cabeçalho automaticamente
      if (i === 0 && parts[0].toLowerCase().includes("email")) continue;

      const rowEmail = (parts[0] || "").toLowerCase();
      const parsedRole = parts[1] ? normalizeRole(parts[1]) : csvDefaultRole;
      const rawClass = parts[2] || "";
      const rowNote = parts[3] || "";

      let resolvedClassId = csvDefaultClassId || state.classes[0]?.id || "";
      if (rawClass) {
        const matched = state.classes.find(
          (c) =>
            c.id === rawClass ||
            c.name.toLowerCase().includes(rawClass.toLowerCase()) ||
            c.grade.toLowerCase().includes(rawClass.toLowerCase())
        );
        if (matched) resolvedClassId = matched.id;
      }

      let error: string | undefined;
      if (!rowEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rowEmail)) {
        error = "E-mail inválido";
      } else if (seenEmails.has(rowEmail)) {
        error = "Duplicado na lista";
      } else if (!parsedRole) {
        error = `Cargo desconhecido: "${parts[1]}"`;
      } else if (parsedRole === "student" && !resolvedClassId) {
        error = "Selecione uma turma padrão";
      }

      seenEmails.add(rowEmail);
      rows.push({
        email: rowEmail,
        role: parsedRole || "student",
        classId: parsedRole === "coordinator" ? "" : resolvedClassId,
        note: rowNote,
        error,
      });
    }

    return rows;
  }, [csvText, csvDefaultRole, csvDefaultClassId, state.classes]);

  const validCsvRows = parsedCsvRows.filter((r) => !r.error);

  const buildInviteLink = (inv: InviteRecord) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://loloverse.diogolabs.dev.br";
    const params = new URLSearchParams({
      convite: inv.code,
      email: inv.email,
    });
    return `${origin}/?${params.toString()}`;
  };

  const handleCopyLink = async (inv: InviteRecord) => {
    const link = buildInviteLink(inv);
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(inv.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback silencioso
    }
  };

  const handleSingleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    const created = await generateInvites([
      {
        email: email.trim().toLowerCase(),
        role,
        classId: role === "coordinator" ? "" : classId || state.classes[0]?.id || "",
        expiresInDays,
        note: note.trim(),
      },
    ]);
    setBusy(false);
    if (created.length > 0) {
      setEmail("");
      setNote("");
    }
  };

  const handleCsvCreate = async () => {
    if (validCsvRows.length === 0) return;
    setBusy(true);
    const created = await generateInvites(
      validCsvRows.map((r) => ({
        email: r.email,
        role: r.role,
        classId: r.classId,
        expiresInDays,
        note: r.note,
      }))
    );
    setBusy(false);
    if (created.length > 0) {
      setCsvText("");
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCsvText(String(reader.result || ""));
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  };

  const handleExportCsv = () => {
    const header = "email;codigo;cargo;turma;status;link_de_cadastro";
    const lines = invites.map((inv) => {
      const status = inv.usedCount > 0 ? "usado" : inv.active ? "ativo" : "revogado";
      const clsName = inv.classId ? classMap.get(inv.classId) || inv.classId : "-";
      return [
        inv.email,
        inv.code,
        inv.role,
        clsName,
        status,
        buildInviteLink(inv),
      ].join(";");
    });
    const blob = new Blob(["\uFEFF" + [header, ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `loloverse-convites-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredInvites = invites.filter((inv) => {
    if (filterStatus === "active") return inv.active && inv.usedCount === 0;
    if (filterStatus === "used") return inv.usedCount > 0;
    return true;
  });

  if (!isBackendConnected) {
    return (
      <div className="sketch-card p-6 bg-amber-50 text-sm font-semibold text-zinc-800">
        Conecte o PocketBase (`NEXT_PUBLIC_POCKETBASE_URL`) para gerar e gerenciar convites reais.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Esquerda: Gerador de Convites (Individual ou CSV) */}
        <section className="lg:col-span-5 sketch-card p-5 bg-white space-y-4">
          <div className="flex items-center justify-between gap-2 border-b-2 border-zinc-900 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-[#FACC15] border-2 border-zinc-900">
                <KeyRound className="w-5 h-5 text-zinc-900" />
              </div>
              <div>
                <h2 className="font-hand text-2xl leading-none text-zinc-900">
                  Gerar Convites Seguros
                </h2>
                <p className="text-xs text-zinc-600">
                  Cada código é único e travado ao e-mail Google convidado.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("single")}
              className={`sketch-btn py-2 text-xs ${
                mode === "single"
                  ? "bg-[#3B82F6] text-white"
                  : "bg-white text-zinc-700 hover:bg-blue-50"
              }`}
            >
              <MailPlus className="w-4 h-4" />
              Individual
            </button>
            <button
              type="button"
              onClick={() => setMode("csv")}
              className={`sketch-btn py-2 text-xs ${
                mode === "csv"
                  ? "bg-[#10B981] text-zinc-950"
                  : "bg-white text-zinc-700 hover:bg-emerald-50"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              Lote CSV / Planilha
            </button>
          </div>

          {mode === "single" ? (
            <form onSubmit={handleSingleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                  E-mail Google do Convidado
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="aluno@gmail.com"
                  className="sketch-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                    Cargo
                  </label>
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(e.target.value as "student" | "teacher" | "coordinator")
                    }
                    className="sketch-input font-semibold"
                  >
                    <option value="student">Aluno</option>
                    <option value="teacher">Professor</option>
                    <option value="coordinator">Coordenador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                    Validade (dias)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(Number(e.target.value) || 14)}
                    className="sketch-input font-mono"
                  />
                </div>
              </div>

              {role !== "coordinator" && (
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                    Turma
                  </label>
                  <select
                    value={classId || state.classes[0]?.id || ""}
                    onChange={(e) => setClassId(e.target.value)}
                    className="sketch-input font-semibold"
                  >
                    {state.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                  Observação (opcional)
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Ex: Matrícula 2026"
                  className="sketch-input"
                />
              </div>

              <button
                type="submit"
                disabled={busy}
                className="sketch-btn w-full py-2.5 bg-[#FACC15] text-zinc-950 text-sm disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                {busy ? "Gerando..." : "Gerar Código de Convite"}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                    Cargo padrão
                  </label>
                  <select
                    value={csvDefaultRole}
                    onChange={(e) =>
                      setCsvDefaultRole(
                        e.target.value as "student" | "teacher" | "coordinator"
                      )
                    }
                    className="sketch-input text-xs font-semibold"
                  >
                    <option value="student">Aluno</option>
                    <option value="teacher">Professor</option>
                    <option value="coordinator">Coordenador</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                    Turma padrão
                  </label>
                  <select
                    value={csvDefaultClassId || state.classes[0]?.id || ""}
                    onChange={(e) => setCsvDefaultClassId(e.target.value)}
                    className="sketch-input text-xs font-semibold"
                  >
                    {state.classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-zinc-700">
                  Cole e-mails ou importe `.csv`
                </label>
                <label className="sketch-btn-sm px-2.5 py-1 bg-white text-xs cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Abrir CSV
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleCsvUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder={"email,cargo,turma,observacao\naluno1@gmail.com,aluno,8º Ano A\nprof@gmail.com,professor,8º Ano A"}
                className="sketch-input font-mono text-xs"
              />

              {parsedCsvRows.length > 0 && (
                <div className="p-2.5 rounded-xl bg-[#FAF8F5] border-2 border-zinc-900 space-y-1.5 max-h-36 overflow-y-auto text-xs">
                  <p className="font-extrabold text-zinc-900">
                    Prévia: {validCsvRows.length} válidos ·{" "}
                    {parsedCsvRows.length - validCsvRows.length} com erro
                  </p>
                  {parsedCsvRows.slice(0, 12).map((row, idx) => (
                    <div
                      key={`${row.email}-${idx}`}
                      className={`flex items-center justify-between gap-2 ${
                        row.error ? "text-rose-700 font-bold" : "text-zinc-700"
                      }`}
                    >
                      <span className="truncate font-mono">{row.email || "(vazio)"}</span>
                      <span className="shrink-0 text-[11px]">
                        {row.error || `${row.role}`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                disabled={busy || validCsvRows.length === 0}
                onClick={handleCsvCreate}
                className="sketch-btn w-full py-2.5 bg-[#10B981] text-zinc-950 text-sm disabled:opacity-50"
              >
                <FileSpreadsheet className="w-4 h-4" />
                {busy
                  ? "Gerando lote..."
                  : `Gerar ${validCsvRows.length} Convite(s)`}
              </button>
            </div>
          )}
        </section>

        {/* Direita: Lista de Convites & Exportação CSV */}
        <section className="lg:col-span-7 sketch-card p-5 bg-[#FFFDF7] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-zinc-900 pb-3">
            <div>
              <h2 className="font-hand text-2xl leading-none text-zinc-900">
                Convites Emitidos ({invites.length})
              </h2>
              <p className="text-xs text-zinc-600">
                Copie o link direto para enviar ou exporte todos os códigos em CSV.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => refreshData()}
                className="sketch-btn-sm px-2.5 py-1.5 bg-white text-xs"
                title="Atualizar lista"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={invites.length === 0}
                onClick={handleExportCsv}
                className="sketch-btn-sm px-3 py-1.5 bg-[#FACC15] text-zinc-950 text-xs disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5" />
                Baixar CSV
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            {(
              [
                ["all", "Todos"],
                ["active", "Ativos"],
                ["used", "Usados"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilterStatus(k)}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold border-2 border-zinc-900 ${
                  filterStatus === k ? "bg-zinc-900 text-white" : "bg-white text-zinc-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
            {filteredInvites.length === 0 ? (
              <div className="p-6 text-center rounded-xl border-2 border-dashed border-zinc-400 text-sm text-zinc-600 font-semibold">
                Nenhum convite neste filtro ainda. Gere o primeiro ao lado!
              </div>
            ) : (
              filteredInvites.map((inv) => {
                const isUsed = inv.usedCount > 0;
                const isActive = inv.active && !isUsed;
                const roleLabel =
                  inv.role === "teacher"
                    ? "Professor"
                    : inv.role === "coordinator"
                    ? "Coordenador"
                    : "Aluno";
                return (
                  <div
                    key={inv.id}
                    className={`p-3 rounded-xl border-2 border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                      isActive ? "bg-white" : "bg-zinc-100 opacity-80"
                    }`}
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <code className="px-2 py-0.5 rounded bg-amber-100 border border-zinc-900 font-mono text-xs font-extrabold text-zinc-900">
                          {inv.code}
                        </code>
                        <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded border border-zinc-900 bg-violet-100 text-violet-950">
                          {roleLabel}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded border border-zinc-900 ${
                            isUsed
                              ? "bg-emerald-200 text-emerald-950"
                              : isActive
                              ? "bg-blue-100 text-blue-950"
                              : "bg-rose-200 text-rose-950"
                          }`}
                        >
                          {isUsed ? "Usado" : isActive ? "Ativo" : "Revogado"}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-zinc-900 truncate">
                        {inv.email}
                      </p>
                      <p className="text-[11px] text-zinc-600">
                        {inv.classId ? classMap.get(inv.classId) || inv.classId : "Todas as turmas"}
                        {inv.note ? ` · ${inv.note}` : ""}
                      </p>
                    </div>

                    {isActive && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(inv)}
                          className="sketch-btn-sm px-2.5 py-1.5 bg-[#10B981] text-zinc-950 text-xs"
                        >
                          {copiedId === inv.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Copiado
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Link
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => revokeInvite(inv.id)}
                          className="sketch-btn-sm px-2 py-1.5 bg-white hover:bg-rose-100 text-rose-700 text-xs"
                          title="Revogar convite"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

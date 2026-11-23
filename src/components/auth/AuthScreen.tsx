"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  Gamepad2,
  GraduationCap,
  KeyRound,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { Account, Persona } from "@/types";
import { SketchAvatar } from "@/components/shared/SketchAvatar";

export function AuthScreen() {
  const { state, login, registerAccount } = useLoloverse();
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login form state
  const [identifier, setIdentifier] = useState("prof.rafael");
  const [password, setPassword] = useState("123");
  const [error, setError] = useState<string | null>(null);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("123");
  const [regRole, setRegRole] = useState<Persona>("student");
  const [regClassId, setRegClassId] = useState(
    state.classes[0]?.id || "class-8a"
  );

  // Featured test accounts for quick demonstration
  const teacherAccounts = state.accounts.filter((a) => a.role === "teacher");
  const coordAccounts = state.accounts.filter((a) => a.role === "coordinator");
  const featuredStudents = state.accounts
    .filter((a) => a.role === "student")
    .slice(0, 6);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = login(identifier, password);
    if (!res.ok && res.error) {
      setError(res.error);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = registerAccount({
      displayName: regName,
      username: regUsername,
      password: regPassword,
      role: regRole,
      classId: regClassId,
    });
    if (!res.ok && res.error) {
      setError(res.error);
    }
  };

  const fillAccount = (acc: Account, autoLogin = false) => {
    setMode("login");
    setError(null);
    setIdentifier(acc.username);
    setPassword(acc.password);
    if (autoLogin) {
      login(acc.username, acc.password);
    }
  };

  const roleBadge = (role: Persona) => {
    if (role === "teacher")
      return {
        label: "Professor",
        cls: "bg-[#FACC15] text-zinc-950",
        icon: <GraduationCap className="w-3 h-3" />,
      };
    if (role === "coordinator")
      return {
        label: "Coordenador",
        cls: "bg-[#8B5CF6] text-white",
        icon: <ShieldCheck className="w-3 h-3" />,
      };
    return {
      label: "Aluno",
      cls: "bg-[#10B981] text-zinc-950",
      icon: <Gamepad2 className="w-3 h-3" />,
    };
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 px-4 sm:px-6">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        {/* Top Brand Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FACC15] border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center">
              <svg
                viewBox="0 0 36 36"
                className="w-8 h-8"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M7 9C7 7.8 8 7 9.2 7H15.5C18.5 7 20 9 20 11.5V27C18 25.5 15.5 25 12 25H8.5C7.7 25 7 24.3 7 23.5V9Z"
                  fill="#FFFFFF"
                  stroke="#18181B"
                  strokeWidth="2.3"
                  strokeLinejoin="round"
                />
                <path
                  d="M29 9C29 7.8 28 7 26.8 7H20.5C18 7 16.5 9 16.5 11.5V27C18.5 25.5 21 25 24.5 25H27.5C28.3 25 29 24.3 29 23.5V9Z"
                  fill="#3B82F6"
                  fillOpacity="0.22"
                  stroke="#18181B"
                  strokeWidth="2.3"
                  strokeLinejoin="round"
                />
                <path
                  d="M18 11L19.6 14.8L23.7 15.2L20.5 17.9L21.5 22L18 19.8L14.5 22L15.5 17.9L12.3 15.2L16.4 14.8L18 11Z"
                  fill="#F43F5E"
                  stroke="#18181B"
                  strokeWidth="1.7"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-hand text-4xl leading-none text-zinc-900">
                  Loloverse
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-zinc-900 text-[#FACC15] rounded-md">
                  <Sparkles className="w-3 h-3" /> Contas Reais de Teste
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-600">
                Gestão Escolar + Pulso da Turma + Missões RPG + Espaço Híbrido
              </p>
            </div>
          </div>

          <div className="sketch-card-sm px-3.5 py-2 bg-violet-100 text-xs font-semibold text-violet-950 max-w-md">
            <strong>Dica Multi-Aba:</strong> Abra 2 abas do navegador (ex: uma logada como{" "}
            <code className="font-mono font-bold">prof.rafael</code> e outra como{" "}
            <code className="font-mono font-bold">sofia</code>) para testar pontos, quests e o Espaço Híbrido em tempo real!
          </div>
        </div>

        {/* Main Grid: Login/Register + Test Accounts Directory */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Auth Card */}
          <div className="lg:col-span-5 sketch-card p-6 bg-white space-y-5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError(null);
                }}
                className={`sketch-btn py-2.5 text-sm ${
                  mode === "login"
                    ? "bg-[#FACC15] text-zinc-950"
                    : "bg-white text-zinc-700 hover:bg-amber-50"
                }`}
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setError(null);
                }}
                className={`sketch-btn py-2.5 text-sm ${
                  mode === "register"
                    ? "bg-[#10B981] text-zinc-950"
                    : "bg-white text-zinc-700 hover:bg-emerald-50"
                }`}
              >
                <UserPlus className="w-4 h-4" />
                Criar Conta
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-100 border-2 border-zinc-900 text-xs font-bold text-rose-950">
                {error}
              </div>
            )}

            {mode === "login" ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <h2 className="font-hand text-3xl leading-none text-zinc-900">
                    Acesse sua Conta
                  </h2>
                  <p className="text-xs text-zinc-600 mt-1">
                    Use seu usuário ou e-mail escolar com senha simples.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="login-id"
                      className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1"
                    >
                      Usuário ou E-mail
                    </label>
                    <input
                      id="login-id"
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Ex: prof.rafael, sofia ou coord.helena"
                      className="sketch-input font-semibold"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="login-pass"
                      className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1"
                    >
                      Senha
                    </label>
                    <input
                      id="login-pass"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Senha padrão de teste: 123"
                      className="sketch-input font-semibold"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="sketch-btn w-full py-3 bg-[#3B82F6] text-white text-sm"
                >
                  Entrar no Loloverse
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div>
                  <h2 className="font-hand text-3xl leading-none text-zinc-900">
                    Criar Nova Conta de Teste
                  </h2>
                  <p className="text-xs text-zinc-600 mt-1">
                    Se criar uma conta de <strong>Aluno</strong>, ela já nasce com Ficha RPG Nv.1 e aparece na turma!
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                      Perfil de Acesso
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(["student", "teacher", "coordinator"] as Persona[]).map(
                        (role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => setRegRole(role)}
                            className={`py-2 px-2 rounded-xl text-xs font-bold border-2 transition-all ${
                              regRole === role
                                ? "bg-[#FACC15] border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                                : "bg-white border-zinc-300 hover:border-zinc-900"
                            }`}
                          >
                            {role === "student"
                              ? "Aluno"
                              : role === "teacher"
                              ? "Professor"
                              : "Coord."}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Ex: Diogo Ferreira"
                      className="sketch-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                        Usuário (Login)
                      </label>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="ex: diogo"
                        className="sketch-input font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                        Senha Simples
                      </label>
                      <input
                        type="text"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="ex: 123"
                        className="sketch-input font-mono text-xs"
                      />
                    </div>
                  </div>

                  {regRole !== "coordinator" && (
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                        Turma
                      </label>
                      <select
                        value={regClassId}
                        onChange={(e) => setRegClassId(e.target.value)}
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
                </div>

                <button
                  type="submit"
                  className="sketch-btn w-full py-3 bg-[#10B981] text-zinc-950 text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Criar Conta & Entrar Agora
                </button>
              </form>
            )}
          </div>

          {/* Right: Ready-to-Test Accounts Directory */}
          <div className="lg:col-span-7 sketch-card p-5 bg-[#FFFDF7] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-zinc-900 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#8B5CF6] text-white border-2 border-zinc-900">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-hand text-2xl leading-none text-zinc-900">
                    Contas Prontas para Teste (Senha: <span className="highlighter-mark px-1">123</span>)
                  </h2>
                  <p className="text-xs text-zinc-600">
                    Clique em <strong>Preencher</strong> ou <strong>Entrar</strong> em qualquer conta abaixo para testar todas as funções
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 bg-white border-2 border-zinc-900 rounded-lg">
                <Users className="w-3.5 h-3.5" />
                {state.accounts.length} contas
              </span>
            </div>

            {/* Staff Accounts */}
            <div className="space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                Equipe Pedagógica (Docentes & Coordenação)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[...teacherAccounts, ...coordAccounts].map((acc) => {
                  const badge = roleBadge(acc.role);
                  return (
                    <div
                      key={acc.id}
                      className="p-3 rounded-xl bg-white border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SketchAvatar
                          seed={acc.avatarSeed}
                          bgColor={acc.avatarColor}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-zinc-900 truncate">
                            {acc.displayName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-extrabold rounded border border-zinc-900 ${badge.cls}`}
                            >
                              {badge.icon}
                              {badge.label}
                            </span>
                            <code className="text-[11px] font-mono font-bold text-zinc-700">
                              {acc.username} / {acc.password}
                            </code>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => fillAccount(acc, true)}
                        className="sketch-btn-sm px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#FACC15] text-[11px] shrink-0"
                      >
                        Entrar
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Student Accounts */}
            <div className="space-y-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                Contas de Estudantes (8º Ano A · Destaque e Atenção)
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {featuredStudents.map((acc) => {
                  const stu = state.students.find((s) => s.id === acc.studentId);
                  const isAlert = stu && stu.hp <= 55;
                  return (
                    <div
                      key={acc.id}
                      className={`p-3 rounded-xl border-2 border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex items-center justify-between gap-2 ${
                        isAlert ? "bg-rose-50" : "bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <SketchAvatar
                          seed={acc.avatarSeed}
                          bgColor={acc.avatarColor}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-zinc-900 truncate">
                            {acc.displayName}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                            <code className="text-[11px] font-mono font-bold text-zinc-700">
                              {acc.username} / {acc.password}
                            </code>
                            {stu && (
                              <span
                                className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border border-zinc-900 ${
                                  isAlert
                                    ? "bg-[#F43F5E] text-white"
                                    : "bg-emerald-100 text-emerald-950"
                                }`}
                              >
                                Nv.{stu.level} · HP {stu.hp}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => fillAccount(acc, true)}
                        className="sketch-btn-sm px-2.5 py-1.5 bg-[#10B981] text-zinc-950 text-[11px] shrink-0"
                      >
                        Entrar
                      </button>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-zinc-500 font-medium">
                Todos os demais alunos cadastrados (ex:{" "}
                <code className="font-mono">enzo</code>,{" "}
                <code className="font-mono">lara</code>,{" "}
                <code className="font-mono">cauane</code>,{" "}
                <code className="font-mono">davi</code>,{" "}
                <code className="font-mono">isabela</code>) também funcionam com o primeiro nome + senha{" "}
                <code className="font-mono font-bold">123</code>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

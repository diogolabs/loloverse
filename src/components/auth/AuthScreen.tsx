"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Gamepad2,
  GraduationCap,
  KeyRound,
  Lock,
  LogIn,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { Account, Persona } from "@/types";
import { SketchAvatar } from "@/components/shared/SketchAvatar";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.2 0-5.9-2.1-6.8-5H1.2v3.1C3.2 21.4 7.3 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.2 14.3c-.2-.7-.4-1.5-.4-2.3s.1-1.6.4-2.3V6.6H1.2C.4 8.2 0 10 0 12s.4 3.8 1.2 5.4l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C18 1.2 15.2 0 12 0 7.3 0 3.2 2.6 1.2 6.6l4 3.1c.9-2.9 3.6-4.9 6.8-4.9z"
      />
    </svg>
  );
}

export function AuthScreen() {
  const {
    state,
    isBackendConnected,
    login,
    loginWithGoogle,
    verifyInvite,
    acceptInviteWithPassword,
    registerAccount,
  } = useLoloverse();

  // Produção (PocketBase): 2 abas simples e limpas (Entrar | Primeiro Acesso)
  const [pbTab, setPbTab] = useState<"login" | "invite">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Primeiro acesso por convite (link ou código)
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteVerified, setInviteVerified] = useState<{
    role: string;
    className?: string;
  } | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [inviteNewPassword, setInviteNewPassword] = useState("");
  const [inviteConfirmPassword, setInviteConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Modo demonstração local (apenas quando NEXT_PUBLIC_POCKETBASE_URL não está definido)
  const [demoMode, setDemoMode] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState("prof.rafael");
  const [password, setPassword] = useState("123");
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("123");
  const [regRole, setRegRole] = useState<Persona>("student");
  const [regClassId, setRegClassId] = useState(
    state.classes[0]?.id || "class-8a"
  );

  const [error, setError] = useState<string | null>(null);

  // Lê link direto de convite (?convite=LOLO-...&email=... ou ?aba=convite) e já pré-valida!
  useEffect(() => {
    if (!isBackendConnected || typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const qCode = (params.get("convite") || params.get("code") || "")
      .trim()
      .toUpperCase();
    const qEmail = (params.get("email") || "").trim().toLowerCase();
    const qAba = params.get("aba");

    if (qCode) {
      setInviteCode(qCode);
      setPbTab("invite");
    } else if (qAba === "convite") {
      setPbTab("invite");
    }
    if (qEmail) {
      setInviteEmail(qEmail);
    }

    if (qCode && qEmail) {
      verifyInvite(qEmail, qCode).then((res) => {
        if (res.valid) {
          setInviteVerified({
            role: res.role || "student",
            className: res.className,
          });
        } else if (res.error) {
          setError(res.error);
        }
      });
    }
  }, [isBackendConnected, verifyInvite]);

  // --- Handlers Produção (PocketBase) ---
  const handleGoogleLogin = async () => {
    setError(null);
    setBusy(true);
    const res = await loginWithGoogle();
    setBusy(false);
    if (!res.ok && res.error) setError(res.error);
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const res = await login(loginEmail, loginPassword);
    setBusy(false);
    if (!res.ok && res.error) setError(res.error);
  };

  const handleVerifyInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInviteVerified(null);
    setBusy(true);
    const res = await verifyInvite(inviteEmail, inviteCode);
    setBusy(false);
    if (!res.valid) {
      setError(res.error || "Código de convite inválido.");
      return;
    }
    setInviteVerified({ role: res.role || "student", className: res.className });
  };

  const handleAcceptWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (inviteName.trim().length < 2) {
      setError("Informe seu nome completo.");
      return;
    }
    if (inviteNewPassword.length < 8) {
      setError("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (inviteNewPassword !== inviteConfirmPassword) {
      setError("As duas senhas não conferem.");
      return;
    }
    setBusy(true);
    const res = await acceptInviteWithPassword({
      email: inviteEmail,
      code: inviteCode,
      displayName: inviteName,
      password: inviteNewPassword,
    });
    setBusy(false);
    if (!res.ok && res.error) setError(res.error);
  };

  const handleGoogleWithInvite = async () => {
    setError(null);
    setBusy(true);
    const res = await loginWithGoogle(inviteCode.trim().toUpperCase());
    setBusy(false);
    if (!res.ok && res.error) setError(res.error);
  };

  // --- Handlers Demo Local ---
  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await login(identifier, password);
    if (!res.ok && res.error) setError(res.error);
  };

  const handleDemoRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = registerAccount({
      displayName: regName,
      username: regUsername,
      password: regPassword,
      role: regRole,
      classId: regClassId,
    });
    if (!res.ok && res.error) setError(res.error);
  };

  const fillAccount = async (acc: Account, autoLogin = false) => {
    setDemoMode("login");
    setError(null);
    setIdentifier(acc.username);
    setPassword(acc.password);
    if (autoLogin) {
      await login(acc.username, acc.password);
    }
  };

  const roleBadge = (role: Persona) => {
    if (role === "teacher")
      return {
        label: "Professor",
        cls: "bg-[#FACC15] text-zinc-950",
        icon: <GraduationCap className="w-3 h-3" />,
      };
    if (role === "coordinator" || role === "admin")
      return {
        label: role === "admin" ? "Admin" : "Coordenador",
        cls: "bg-[#8B5CF6] text-white",
        icon: <ShieldCheck className="w-3 h-3" />,
      };
    return {
      label: "Aluno",
      cls: "bg-[#10B981] text-zinc-950",
      icon: <Gamepad2 className="w-3 h-3" />,
    };
  };

  // ===========================================================================
  // TELA DE PRODUÇÃO (PocketBase: E-mail/Senha + Google + Primeiro Acesso Convite)
  // ===========================================================================
  if (isBackendConnected) {
    const rolePt = (r: string) =>
      r === "teacher" ? "Professor(a)" : r === "coordinator" ? "Coordenador(a)" : "Estudante";

    return (
      <div className="min-h-screen flex flex-col justify-center items-center py-8 px-4 sm:px-6">
        <div className="w-full max-w-lg space-y-5">
          {/* Logo Caderno Vivo */}
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-[#FACC15] border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center">
              <svg
                viewBox="0 0 36 36"
                className="w-9 h-9"
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
              <h1 className="font-hand text-5xl leading-none text-zinc-900">
                Loloverse
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-zinc-600 mt-1">
                Acesso Escolar Seguro · Gestão, Missões & Espaço Híbrido
              </p>
            </div>
          </div>

          {/* Card de Autenticação */}
          <div className="sketch-card p-6 bg-white space-y-5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPbTab("login");
                  setError(null);
                }}
                className={`sketch-btn py-2.5 text-xs sm:text-sm ${
                  pbTab === "login"
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
                  setPbTab("invite");
                  setError(null);
                }}
                className={`sketch-btn py-2.5 text-xs sm:text-sm ${
                  pbTab === "invite"
                    ? "bg-[#10B981] text-zinc-950"
                    : "bg-white text-zinc-700 hover:bg-emerald-50"
                }`}
              >
                <KeyRound className="w-4 h-4" />
                Primeiro Acesso
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-100 border-2 border-zinc-900 text-xs font-bold text-rose-950">
                {error}
              </div>
            )}

            {pbTab === "login" ? (
              <div className="space-y-4">
                <form onSubmit={handlePasswordLogin} className="space-y-3">
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                      E-mail ou Usuário
                    </label>
                    <input
                      type="text"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className="sketch-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                      Senha
                    </label>
                    <input
                      type="password"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Sua senha"
                      className="sketch-input"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={busy}
                    className="sketch-btn w-full py-3 bg-[#3B82F6] text-white text-sm disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    {busy ? "Entrando..." : "Entrar com E-mail e Senha"}
                  </button>
                </form>

                <div className="relative flex items-center py-1">
                  <div className="flex-grow border-t-2 border-dashed border-zinc-300" />
                  <span className="mx-3 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                    ou
                  </span>
                  <div className="flex-grow border-t-2 border-dashed border-zinc-300" />
                </div>

                <button
                  type="button"
                  disabled={busy}
                  onClick={handleGoogleLogin}
                  className="sketch-btn w-full py-3 bg-white hover:bg-amber-50 text-zinc-950 text-sm disabled:opacity-50"
                >
                  <GoogleIcon />
                  {busy ? "Conectando..." : "Continuar com Google"}
                </button>

                <p className="text-[11px] text-center text-zinc-500 font-medium">
                  Recebeu um convite da escola? Clique em{" "}
                  <button
                    type="button"
                    onClick={() => setPbTab("invite")}
                    className="font-extrabold text-zinc-900 underline"
                  >
                    Primeiro Acesso
                  </button>
                  .
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <h2 className="font-hand text-3xl leading-none text-zinc-900">
                    Ativar Conta com Convite
                  </h2>
                  <p className="text-xs text-zinc-600 mt-1">
                    Informe seu e-mail e a chave recebida — depois escolha criar uma senha ou entrar com o Google.
                  </p>
                </div>

                {!inviteVerified ? (
                  <form onSubmit={handleVerifyInvite} className="space-y-3">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                        Seu E-mail Convidado
                      </label>
                      <input
                        type="email"
                        required
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="nome@email.com"
                        className="sketch-input"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                        Chave de Acesso (Convite)
                      </label>
                      <input
                        type="text"
                        required
                        value={inviteCode}
                        onChange={(e) =>
                          setInviteCode(e.target.value.toUpperCase())
                        }
                        placeholder="Ex: PROF-7K3M-9P2Q"
                        className="sketch-input font-mono uppercase tracking-wider font-bold"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={busy}
                      className="sketch-btn w-full py-3 bg-[#3B82F6] text-white text-sm disabled:opacity-50"
                    >
                      {busy ? "Verificando..." : "Validar Convite"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-3 rounded-xl bg-emerald-100 border-2 border-zinc-900 text-xs font-bold text-emerald-950 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          Convite validado para <strong>{inviteEmail}</strong>!
                          <br />
                          Cargo: <strong>{rolePt(inviteVerified.role)}</strong>
                          {inviteVerified.className
                            ? ` · Turma: ${inviteVerified.className}`
                            : ""}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setInviteVerified(null)}
                        className="text-[11px] underline shrink-0"
                      >
                        Trocar
                      </button>
                    </div>

                    {/* Opção 1: Criar senha própria com o link/chave */}
                    <form onSubmit={handleAcceptWithPassword} className="space-y-3">
                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                          Seu Nome Completo
                        </label>
                        <input
                          type="text"
                          required
                          value={inviteName}
                          onChange={(e) => setInviteName(e.target.value)}
                          placeholder="Ex: Prof. Rafael Andrade"
                          className="sketch-input"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                            Criar Senha (mín. 8)
                          </label>
                          <input
                            type="password"
                            required
                            minLength={8}
                            value={inviteNewPassword}
                            onChange={(e) => setInviteNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="sketch-input"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-700 mb-1">
                            Confirmar Senha
                          </label>
                          <input
                            type="password"
                            required
                            minLength={8}
                            value={inviteConfirmPassword}
                            onChange={(e) =>
                              setInviteConfirmPassword(e.target.value)
                            }
                            placeholder="••••••••"
                            className="sketch-input"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={busy}
                        className="sketch-btn w-full py-3 bg-[#10B981] text-zinc-950 text-sm disabled:opacity-50"
                      >
                        <UserPlus className="w-4 h-4" />
                        {busy ? "Ativando conta..." : "Criar Senha & Entrar Agora"}
                      </button>
                    </form>

                    <div className="relative flex items-center py-0.5">
                      <div className="flex-grow border-t-2 border-dashed border-zinc-300" />
                      <span className="mx-3 text-[11px] font-extrabold uppercase tracking-wider text-zinc-500">
                        ou ative com Google
                      </span>
                      <div className="flex-grow border-t-2 border-dashed border-zinc-300" />
                    </div>

                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleGoogleWithInvite}
                      className="sketch-btn w-full py-2.5 bg-white hover:bg-amber-50 text-zinc-950 text-sm disabled:opacity-50"
                    >
                      <GoogleIcon />
                      {busy ? "Redirecionando..." : "Ativar com Conta Google"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ===========================================================================
  // MODO DEMONSTRAÇÃO LOCAL (fallback apenas sem NEXT_PUBLIC_POCKETBASE_URL)
  // ===========================================================================
  const teacherAccounts = state.accounts.filter((a) => a.role === "teacher");
  const coordAccounts = state.accounts.filter((a) => a.role === "coordinator");
  const featuredStudents = state.accounts
    .filter((a) => a.role === "student")
    .slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col justify-center py-8 px-4 sm:px-6">
      <div className="max-w-6xl w-full mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#FACC15] border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-zinc-900" />
            </div>
            <div>
              <h1 className="font-hand text-4xl leading-none text-zinc-900">
                Loloverse (Demo Local)
              </h1>
              <p className="text-xs sm:text-sm font-semibold text-zinc-600">
                Gestão Escolar + Pulso da Turma + Missões RPG + Espaço Híbrido
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 sketch-card p-6 bg-white space-y-5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setDemoMode("login");
                  setError(null);
                }}
                className={`sketch-btn py-2.5 text-sm ${
                  demoMode === "login"
                    ? "bg-[#FACC15] text-zinc-950"
                    : "bg-white text-zinc-700"
                }`}
              >
                <LogIn className="w-4 h-4" />
                Entrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setDemoMode("register");
                  setError(null);
                }}
                className={`sketch-btn py-2.5 text-sm ${
                  demoMode === "register"
                    ? "bg-[#10B981] text-zinc-950"
                    : "bg-white text-zinc-700"
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

            {demoMode === "login" ? (
              <form onSubmit={handleDemoLogin} className="space-y-4">
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="sketch-input font-semibold"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="sketch-input font-semibold"
                />
                <button
                  type="submit"
                  className="sketch-btn w-full py-3 bg-[#3B82F6] text-white text-sm"
                >
                  Entrar <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleDemoRegister} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {(["student", "teacher", "coordinator"] as Persona[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRegRole(r)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border-2 ${
                        regRole === r
                          ? "bg-[#FACC15] border-zinc-900"
                          : "bg-white border-zinc-300"
                      }`}
                    >
                      {r === "student" ? "Aluno" : r === "teacher" ? "Professor" : "Coord."}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Nome Completo"
                  className="sketch-input"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="usuário"
                    className="sketch-input font-mono text-xs"
                  />
                  <input
                    type="text"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="senha"
                    className="sketch-input font-mono text-xs"
                  />
                </div>
                {regRole !== "coordinator" && (
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
                )}
                <button
                  type="submit"
                  className="sketch-btn w-full py-3 bg-[#10B981] text-zinc-950 text-sm"
                >
                  Criar Conta & Entrar
                </button>
              </form>
            )}
          </div>

          <div className="lg:col-span-7 sketch-card p-5 bg-[#FFFDF7] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-zinc-900 pb-3">
              <h2 className="font-hand text-2xl text-zinc-900">
                Contas Demo (Senha: 123)
              </h2>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 bg-white border-2 border-zinc-900 rounded-lg">
                <Users className="w-3.5 h-3.5" />
                {state.accounts.length} contas
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[...teacherAccounts, ...coordAccounts, ...featuredStudents].map((acc) => {
                const badge = roleBadge(acc.role);
                return (
                  <div
                    key={acc.id}
                    className="p-3 rounded-xl bg-white border-2 border-zinc-900 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <SketchAvatar
                        seed={acc.avatarSeed}
                        bgColor={acc.avatarColor}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-zinc-900 truncate">
                          {acc.displayName}
                        </p>
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-extrabold rounded border border-zinc-900 ${badge.cls}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fillAccount(acc, true)}
                      className="sketch-btn-sm px-2.5 py-1.5 bg-[#FAF8F5] text-[11px]"
                    >
                      Entrar
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

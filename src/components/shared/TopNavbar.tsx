"use client";

import React, { useState } from "react";
import {
  ArrowLeftRight,
  Gamepad2,
  GraduationCap,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";
import { Persona } from "@/types";
import { SketchAvatar } from "@/components/shared/SketchAvatar";

export function TopNavbar() {
  const {
    state,
    currentAccount,
    isBackendConnected,
    login,
    logout,
    resetDemoData,
  } = useLoloverse();
  const [confirmReset, setConfirmReset] = useState(false);
  const [showSwitcher, setShowSwitcher] = useState(false);

  if (!currentAccount) return null;

  const roleMeta: Record<
    Persona,
    { label: string; bg: string; icon: React.ReactNode }
  > = {
    teacher: {
      label: "Professor",
      bg: "bg-[#FACC15] text-zinc-950",
      icon: <GraduationCap className="w-3.5 h-3.5" />,
    },
    student: {
      label: "Aluno",
      bg: "bg-[#10B981] text-zinc-950",
      icon: <Gamepad2 className="w-3.5 h-3.5" />,
    },
    coordinator: {
      label: "Coordenador",
      bg: "bg-[#8B5CF6] text-white",
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
    admin: {
      label: "Admin",
      bg: "bg-zinc-900 text-[#FACC15]",
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
    },
  };

  const activeMeta = roleMeta[currentAccount.role];

  const handleReset = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    resetDemoData();
    setConfirmReset(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/95 backdrop-blur-sm border-b-2 border-zinc-900">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Hand-drawn Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-xl bg-[#FACC15] border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center">
              <svg
                viewBox="0 0 36 36"
                className="w-7 h-7"
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
              <div className="flex items-center gap-1.5">
                <span className="font-hand text-2xl sm:text-3xl leading-none tracking-wide text-zinc-900">
                  Loloverse
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-zinc-900 text-[#FACC15] rounded-md">
                  <Sparkles className="w-2.5 h-2.5" />
                  Escola Viva
                </span>
              </div>
              <p className="text-[11px] font-medium text-zinc-600 leading-tight hidden sm:block">
                Colégio Horizonte Maker · Sessão Autenticada
              </p>
            </div>
          </div>

          {/* Authenticated Account Info & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <div className="flex items-center gap-2.5 px-3 py-1.5 bg-white border-2 border-zinc-900 rounded-xl shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]">
              <SketchAvatar
                seed={currentAccount.avatarSeed}
                bgColor={currentAccount.avatarColor}
                size="sm"
              />
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs sm:text-sm text-zinc-900">
                    {currentAccount.displayName}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-extrabold border border-zinc-900 rounded-md ${activeMeta.bg}`}
                  >
                    {activeMeta.icon}
                    {activeMeta.label}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-zinc-500">
                  @{currentAccount.username}
                </p>
              </div>
            </div>

            {!isBackendConnected && (
              <button
                type="button"
                onClick={() => setShowSwitcher(true)}
                className="sketch-btn-sm px-3 py-2 bg-[#FACC15] text-zinc-950 text-xs"
                title="Trocar rapidamente para outra conta de teste"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Trocar Conta</span>
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="sketch-btn-sm px-3 py-2 bg-white hover:bg-rose-50 text-zinc-800 text-xs"
              title="Sair e voltar para a tela de login"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>

            {!isBackendConnected && (
              <button
                type="button"
                onClick={handleReset}
                className={`inline-flex items-center gap-1 px-2.5 py-2 text-xs font-bold rounded-lg border-2 transition-all active:translate-x-[1px] active:translate-y-[1px] ${
                  confirmReset
                    ? "bg-[#F43F5E] text-white border-zinc-900 shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]"
                    : "bg-white/80 text-zinc-500 border-zinc-300 hover:border-zinc-900 hover:text-zinc-900"
                }`}
                title="Restaurar todos os dados iniciais da demonstração"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">
                  {confirmReset ? "Confirmar Reset?" : "Resetar Demo"}
                </span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Quick Account Switcher Modal */}
      {showSwitcher && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/50 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={() => setShowSwitcher(false)}
        >
          <div
            className="animate-pop-in sketch-card w-full max-w-2xl bg-[#FAF8F5] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-white border-b-2 border-zinc-900 flex items-center justify-between">
              <div>
                <h3 className="font-hand text-2xl leading-none text-zinc-900">
                  Trocar de Conta (Sessão desta Aba)
                </h3>
                <p className="text-xs text-zinc-600 mt-0.5">
                  Todas as alterações feitas até agora ficam salvas para todas as contas.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSwitcher(false)}
                className="sketch-btn-sm p-1.5 bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[65vh] overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {state.accounts.map((acc) => {
                const isCurrent = acc.id === currentAccount.id;
                const meta = roleMeta[acc.role];
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      if (!isCurrent) {
                        login(acc.username, acc.password);
                      }
                      setShowSwitcher(false);
                    }}
                    className={`text-left p-3 rounded-xl border-2 border-zinc-900 flex items-center gap-3 transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-amber-100 shadow-none"
                        : "bg-white shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] hover:bg-blue-50 active:translate-x-[1px] active:translate-y-[1px]"
                    }`}
                  >
                    <SketchAvatar
                      seed={acc.avatarSeed}
                      bgColor={acc.avatarColor}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-zinc-900 truncate">
                        {acc.displayName} {isCurrent ? "(Atual)" : ""}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-extrabold border border-zinc-900 rounded ${meta.bg}`}
                        >
                          {meta.label}
                        </span>
                        <code className="text-[11px] font-mono text-zinc-600">
                          @{acc.username} · senha: {acc.password}
                        </code>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="p-3 bg-white border-t-2 border-zinc-900 flex items-center justify-between">
              <span className="text-xs text-zinc-600">
                Quer criar um novo usuário do zero?
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowSwitcher(false);
                  logout();
                }}
                className="sketch-btn-sm px-3 py-1.5 bg-[#10B981] text-zinc-950 text-xs"
              >
                Ir para Tela de Login / Cadastro
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

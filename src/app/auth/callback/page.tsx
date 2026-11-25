"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Loader2,
  LogIn,
} from "lucide-react";
import { useLoloverse } from "@/context/LoloverseContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { completeGoogleCallback } = useLoloverse();
  const processedRef = useRef(false);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Confirmando sua conta Google com segurança...");
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const oauthError = params.get("error");
    const code = params.get("code");
    const stateParam = params.get("state");

    if (oauthError) {
      setStatus("error");
      setMessage(
        oauthError === "access_denied"
          ? "Login cancelado na janela do Google."
          : `O Google retornou um erro: ${oauthError}`
      );
      return;
    }

    if (!code || !stateParam) {
      setStatus("error");
      setMessage("Parâmetros de autenticação ausentes. Tente entrar novamente.");
      return;
    }

    completeGoogleCallback(code, stateParam).then((res) => {
      if (res.ok) {
        setStatus("success");
        setDisplayName(res.displayName || "");
        setMessage("Conta Google confirmada! Entrando no seu painel...");
        setTimeout(() => {
          router.replace("/");
        }, 1200);
      } else {
        setStatus("error");
        setMessage(
          res.error ||
            "Não foi possível concluir o acesso. Verifique se você possui um convite válido."
        );
      }
    });
  }, [completeGoogleCallback, router]);

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-8 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-5">
        {/* Marca Loloverse */}
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
          <h1 className="font-hand text-4xl leading-none text-zinc-900">
            Loloverse
          </h1>
        </div>

        {/* Card Caderno Vivo de Retorno */}
        <div className="sketch-card p-6 bg-white text-center space-y-4">
          {status === "loading" && (
            <>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-100 border-2 border-zinc-900 flex items-center justify-center">
                <Loader2 className="w-7 h-7 text-zinc-900 animate-spin" />
              </div>
              <h2 className="font-hand text-3xl leading-none text-zinc-900">
                Validando acesso...
              </h2>
              <p className="text-sm font-semibold text-zinc-600">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[#10B981] border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-zinc-950" />
              </div>
              <h2 className="font-hand text-3xl leading-none text-zinc-900">
                {displayName ? `Olá, ${displayName}!` : "Acesso confirmado!"}
              </h2>
              <p className="text-sm font-semibold text-zinc-600">{message}</p>
              <button
                type="button"
                onClick={() => router.replace("/")}
                className="sketch-btn w-full py-3 bg-[#FACC15] text-zinc-950 text-sm"
              >
                Ir para o Painel agora
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-14 h-14 rounded-2xl bg-[#F43F5E] border-2 border-zinc-900 shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-white" />
              </div>
              <h2 className="font-hand text-3xl leading-none text-zinc-900">
                Não foi possível entrar
              </h2>
              <div className="p-3 rounded-xl bg-rose-50 border-2 border-zinc-900 text-xs font-bold text-rose-950">
                {message}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => router.replace("/?aba=convite")}
                  className="sketch-btn py-2.5 bg-[#10B981] text-zinc-950 text-xs"
                >
                  <KeyRound className="w-4 h-4" />
                  Usar Código de Convite
                </button>
                <button
                  type="button"
                  onClick={() => router.replace("/")}
                  className="sketch-btn py-2.5 bg-white text-zinc-900 text-xs"
                >
                  <LogIn className="w-4 h-4" />
                  Voltar ao Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

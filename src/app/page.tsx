"use client";

import React from "react";
import { useLoloverse } from "@/context/LoloverseContext";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { TopNavbar } from "@/components/shared/TopNavbar";
import { ToastContainer } from "@/components/shared/ToastContainer";
import { TeacherView } from "@/components/teacher/TeacherView";
import { StudentView } from "@/components/student/StudentView";
import { CoordinatorView } from "@/components/coordinator/CoordinatorView";
import { AdminView } from "@/components/admin/AdminView";

export default function HomePage() {
  const { currentAccount, hydrated, isBackendConnected } = useLoloverse();

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="sketch-card px-6 py-4 bg-white font-hand text-2xl">
          Carregando Loloverse...
        </div>
      </div>
    );
  }

  if (!currentAccount) {
    return (
      <>
        <AuthScreen />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopNavbar />

      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-6">
        {currentAccount.role === "teacher" && <TeacherView />}
        {currentAccount.role === "student" && <StudentView />}
        {currentAccount.role === "coordinator" && <CoordinatorView />}
        {currentAccount.role === "admin" && <AdminView />}
      </main>

      <footer className="mt-8 border-t-2 border-zinc-900 bg-white/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-semibold text-zinc-600">
          <p>
            <span className="font-hand text-base text-zinc-900">Loloverse</span>{" "}
            · Gestão Escolar + Pulso da Turma + Missões RPG + Espaço Híbrido
          </p>
          <p className="text-[11px]">
            {isBackendConnected
              ? "Conectado em tempo real · Banco Seguro"
              : "Modo demonstração local"}
          </p>
        </div>
      </footer>

      <ToastContainer />
    </div>
  );
}

import type { Metadata } from "next";
import { Patrick_Hand, Plus_Jakarta_Sans } from "next/font/google";
import { LoloverseProvider } from "@/context/LoloverseContext";
import "./globals.css";

const patrickHand = Patrick_Hand({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hand",
  display: "swap",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Loloverse · Gestão Escolar, Gamificação Octalysis & Salinha Híbrida",
  description:
    "Plataforma EdTech que une diário escolar inteligente, feedback comportamental em sala, RPG de missões (Octalysis) e salinha híbrida colaborativa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${patrickHand.variable} ${plusJakarta.variable}`}
    >
      <body className="font-sans antialiased min-h-screen text-zinc-900 selection:bg-[#FACC15] selection:text-zinc-900">
        <LoloverseProvider>{children}</LoloverseProvider>
      </body>
    </html>
  );
}

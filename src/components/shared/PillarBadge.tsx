"use client";

import React from "react";
import { Compass, Lightbulb, Trophy, Users } from "lucide-react";
import { PILLAR_META } from "@/data/mockData";
import { EngagementPillar } from "@/types";

interface PillarBadgeProps {
  pillar: EngagementPillar;
  compact?: boolean;
}

const ICONS: Record<EngagementPillar, React.ReactNode> = {
  proposito: <Compass className="w-3.5 h-3.5" />,
  maestria: <Trophy className="w-3.5 h-3.5" />,
  criatividade: <Lightbulb className="w-3.5 h-3.5" />,
  social: <Users className="w-3.5 h-3.5" />,
};

export function PillarBadge({ pillar, compact = false }: PillarBadgeProps) {
  const meta = PILLAR_META[pillar];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold border-2 border-zinc-900 rounded-lg ${meta.bgClass} ${meta.textClass}`}
      title={`${meta.tagline} — ${meta.description}`}
    >
      {ICONS[pillar]}
      <span>{compact ? meta.shortLabel : meta.label}</span>
    </span>
  );
}

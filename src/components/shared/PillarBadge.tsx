"use client";

import React from "react";
import {
  BookOpen,
  Cpu,
  HeartHandshake,
  Lightbulb,
  MessageCircle,
  Scale,
} from "lucide-react";
import { BNCC_ATTRIBUTE_META, legacyPillarToBncc } from "@/data/bnccAndPaths";
import { BnccAttributeKey, EngagementPillar } from "@/types";

interface PillarBadgeProps {
  pillar?: EngagementPillar;
  bnccAttr?: BnccAttributeKey;
  compact?: boolean;
}

const BNCC_ICONS: Record<BnccAttributeKey, React.ReactNode> = {
  con: <BookOpen className="w-3.5 h-3.5" />,
  inv: <Lightbulb className="w-3.5 h-3.5" />,
  exp: <MessageCircle className="w-3.5 h-3.5" />,
  dig: <Cpu className="w-3.5 h-3.5" />,
  arg: <Scale className="w-3.5 h-3.5" />,
  elo: <HeartHandshake className="w-3.5 h-3.5" />,
};

export function PillarBadge({
  pillar,
  bnccAttr,
  compact = false,
}: PillarBadgeProps) {
  const key: BnccAttributeKey = bnccAttr || legacyPillarToBncc(pillar);
  const meta = BNCC_ATTRIBUTE_META[key];

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold border-2 border-zinc-900 rounded-lg ${meta.bgClass} ${meta.textClass}`}
      title={`${meta.code} · ${meta.label} (BNCC ${meta.bnccCodes.join(", ")}) — ${meta.description}`}
    >
      {BNCC_ICONS[key]}
      <span>{compact ? meta.code : `${meta.code} · ${meta.shortLabel}`}</span>
    </span>
  );
}

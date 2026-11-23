"use client";

import React from "react";

interface SketchAvatarProps {
  seed: number;
  bgColor?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  statusDot?: "online" | "estudando" | "em-grupo" | "offline";
}

const SKIN_TONES = ["#FDE2C8", "#F5C6A5", "#D99B78", "#A96E4F", "#7D4E38"];
const HAIR_COLORS = ["#18181B", "#451A03", "#78350F", "#1E293B", "#581C87"];

const SIZE_MAP = {
  sm: "w-9 h-9",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const STATUS_DOT_COLOR: Record<string, string> = {
  online: "bg-[#10B981]",
  estudando: "bg-[#FACC15]",
  "em-grupo": "bg-[#8B5CF6]",
  offline: "bg-zinc-400",
};

export function SketchAvatar({
  seed,
  bgColor = "#FACC15",
  size = "md",
  className = "",
  statusDot,
}: SketchAvatarProps) {
  const skin = SKIN_TONES[seed % SKIN_TONES.length];
  const hair = HAIR_COLORS[(seed * 3) % HAIR_COLORS.length];
  const hairStyle = seed % 5;
  const hasGlasses = seed % 3 === 0;
  const isSmileBig = seed % 2 === 0;
  const hasHeadband = seed % 4 === 1;

  return (
    <div className={`relative inline-flex shrink-0 ${SIZE_MAP[size]} ${className}`}>
      <div
        className="w-full h-full rounded-xl border-2 border-zinc-900 overflow-hidden shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] flex items-center justify-center"
        style={{ backgroundColor: bgColor }}
      >
        <svg
          viewBox="0 0 64 64"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Subtle notebook lines behind avatar */}
          <path d="M0 16H64M0 32H64M0 48H64" stroke="#18181B" strokeOpacity="0.08" strokeWidth="1" />

          {/* Shoulders / Shirt */}
          <path
            d="M12 64C12 52 21 47 32 47C43 47 52 52 52 64"
            fill="#FFFFFF"
            stroke="#18181B"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M25 48L32 54L39 48"
            stroke="#18181B"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hair Back for long styles */}
          {hairStyle === 1 && (
            <path
              d="M14 26C14 14 22 10 32 10C42 10 50 14 50 26L52 46C46 44 18 44 12 46L14 26Z"
              fill={hair}
              stroke="#18181B"
              strokeWidth="2.5"
            />
          )}
          {hairStyle === 3 && (
            <>
              <circle cx="15" cy="24" r="7" fill={hair} stroke="#18181B" strokeWidth="2.5" />
              <circle cx="49" cy="24" r="7" fill={hair} stroke="#18181B" strokeWidth="2.5" />
            </>
          )}

          {/* Neck */}
          <rect
            x="27"
            y="41"
            width="10"
            height="9"
            rx="4"
            fill={skin}
            stroke="#18181B"
            strokeWidth="2.2"
          />

          {/* Ears */}
          <circle cx="17" cy="31" r="4" fill={skin} stroke="#18181B" strokeWidth="2.2" />
          <circle cx="47" cy="31" r="4" fill={skin} stroke="#18181B" strokeWidth="2.2" />

          {/* Face */}
          <rect
            x="18"
            y="16"
            width="28"
            height="29"
            rx="13"
            fill={skin}
            stroke="#18181B"
            strokeWidth="2.5"
          />

          {/* Cheeks */}
          <circle cx="23" cy="34" r="2.2" fill="#F43F5E" fillOpacity="0.32" />
          <circle cx="41" cy="34" r="2.2" fill="#F43F5E" fillOpacity="0.32" />

          {/* Hair Front */}
          {hairStyle === 0 && (
            <path
              d="M17 24C18 14 26 11 33 11C41 11 47 15 47 24C43 20 36 19 30 21C25 22 20 22 17 24Z"
              fill={hair}
              stroke="#18181B"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
          )}
          {hairStyle === 1 && (
            <path
              d="M17 25C18 15 24 12 32 12C40 12 46 15 47 25C41 19 25 19 17 25Z"
              fill={hair}
              stroke="#18181B"
              strokeWidth="2.4"
            />
          )}
          {hairStyle === 2 && (
            <path
              d="M17 23C16 14 24 9 32 10C40 9 48 14 47 23C43 18 37 16 32 18C27 16 21 18 17 23Z"
              fill={hair}
              stroke="#18181B"
              strokeWidth="2.4"
            />
          )}
          {hairStyle === 3 && (
            <path
              d="M17 24C19 15 25 12 32 12C39 12 45 15 47 24C42 20 36 19 32 20C28 19 22 20 17 24Z"
              fill={hair}
              stroke="#18181B"
              strokeWidth="2.4"
            />
          )}
          {hairStyle === 4 && (
            <path
              d="M16 24C15 17 20 10 27 12C31 8 38 9 41 13C47 13 49 19 47 24C43 20 21 20 16 24Z"
              fill={hair}
              stroke="#18181B"
              strokeWidth="2.4"
            />
          )}

          {/* Optional Headband */}
          {hasHeadband && (
            <path
              d="M18 20C24 16 40 16 46 20"
              stroke="#F43F5E"
              strokeWidth="3"
              strokeLinecap="round"
            />
          )}

          {/* Eyes */}
          <circle cx="26.5" cy="30" r="2.2" fill="#18181B" />
          <circle cx="37.5" cy="30" r="2.2" fill="#18181B" />
          <circle cx="27.2" cy="29.3" r="0.7" fill="#FFFFFF" />
          <circle cx="38.2" cy="29.3" r="0.7" fill="#FFFFFF" />

          {/* Optional Glasses */}
          {hasGlasses && (
            <g stroke="#18181B" strokeWidth="2">
              <rect x="21.5" y="26.5" width="9.5" height="7" rx="2.5" fill="#FFFFFF" fillOpacity="0.35" />
              <rect x="33" y="26.5" width="9.5" height="7" rx="2.5" fill="#FFFFFF" fillOpacity="0.35" />
              <line x1="31" y1="30" x2="33" y2="30" />
            </g>
          )}

          {/* Mouth */}
          {isSmileBig ? (
            <path
              d="M27 36.5C29 39.5 35 39.5 37 36.5"
              stroke="#18181B"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
          ) : (
            <path
              d="M28.5 37C30.5 38.8 33.5 38.8 35.5 37"
              stroke="#18181B"
              strokeWidth="2.3"
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>

      {statusDot && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-zinc-900 ${STATUS_DOT_COLOR[statusDot]}`}
          title={statusDot}
        />
      )}
    </div>
  );
}

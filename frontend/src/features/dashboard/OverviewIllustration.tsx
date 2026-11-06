import { useId } from "react";
export function OverviewIllustration() {
  const id = useId();
  return (
    <svg
      viewBox="0 0 440 270"
      role="img"
      aria-label="Illustration of a training journal, a gym bag, a trophy and dumbbells"
    >
      <defs>
        <linearGradient id={`${id}-bag`} x1="0" x2="1">
          <stop stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--art-trousers)" />
        </linearGradient>
      </defs>
      <circle
        cx="235"
        cy="129"
        r="111"
        fill="var(--story-label-bg)"
        opacity=".7"
      />
      <ellipse
        cx="240"
        cy="235"
        rx="155"
        ry="17"
        fill="var(--story-line)"
        opacity=".2"
      />
      <g transform="rotate(-9 169 123)">
        <rect
          x="103"
          y="43"
          width="118"
          height="147"
          rx="13"
          fill="var(--surface)"
          stroke="var(--story-line)"
          strokeWidth="2"
        />
        <path d="M104 70h116" stroke="var(--primary)" strokeWidth="15" />
        <path
          d="M127 35v19m69-19v19"
          stroke="var(--art-outline)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M126 99h20m18 0h28m-66 18h20m18 0h28m-66 18h20m18 0h28"
          stroke="var(--story-line)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="175" cy="162" r="16" fill="var(--ready-bg)" />
        <path
          d="m168 162 5 5 11-12"
          stroke="var(--ready-text)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <g>
        <path
          d="M205 157v-22c0-29 65-29 65 0v22"
          fill="none"
          stroke="var(--art-outline)"
          strokeWidth="9"
        />
        <path
          d="M188 145h100c17 0 29 18 33 57l-7 22H166l-7-22c4-39 13-57 29-57"
          fill={`url(#${id}-bag)`}
        />
        <path
          d="M187 151c-10 18-14 44-12 68m110-68c14 19 20 43 18 68"
          stroke="var(--art-line)"
          strokeWidth="3"
          fill="none"
        />
        <rect
          x="203"
          y="173"
          width="67"
          height="38"
          rx="9"
          fill="var(--art-outline)"
        />
        <path
          d="M210 180h51"
          stroke="var(--art-plate-line)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="m232 185-6 10h9l-2 10 13-16h-10l3-4z"
          fill="var(--art-shirt)"
        />
        <path d="m283 153 22 6-7 32-26-7z" fill="var(--surface)" />
        <path
          d="m282 161 19 6m-21 1 19 6m-21 1 19 6"
          stroke="var(--story-line)"
          strokeWidth="2"
        />
      </g>
      <g transform="translate(330 58)">
        <path
          d="M-10 7h60v30c0 21-15 30-30 30S-10 58-10 37z"
          fill="var(--art-shirt)"
        />
        <path
          d="M-10 14h-15v14c0 14 7 21 20 21M50 14h15v14c0 14-7 21-20 21"
          fill="none"
          stroke="var(--chart-secondary)"
          strokeWidth="5"
        />
        <path
          d="M20 68v19m-19 4h38"
          stroke="var(--art-outline)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <path
          d="m20 23 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z"
          fill="var(--story-label-bg)"
        />
      </g>
      <g transform="translate(94 212) rotate(-16)">
        <rect x="0" y="0" width="71" height="9" rx="4" fill="var(--art-bar)" />
        <rect
          x="0"
          y="-12"
          width="14"
          height="33"
          rx="4"
          fill="var(--art-outline)"
        />
        <rect
          x="11"
          y="-16"
          width="13"
          height="41"
          rx="4"
          fill="var(--art-plate)"
        />
        <rect
          x="48"
          y="-16"
          width="13"
          height="41"
          rx="4"
          fill="var(--art-plate)"
        />
        <rect
          x="59"
          y="-12"
          width="14"
          height="33"
          rx="4"
          fill="var(--art-outline)"
        />
        <path
          d="M16-11v31m36-31v31"
          stroke="var(--art-plate-line)"
          strokeWidth="2"
        />
      </g>
      <g stroke="var(--story-accent)" strokeWidth="3" strokeLinecap="round">
        <path d="M81 101v13m-6-6h12m278 71v13m-6-6h12M247 44v12m-6-6h12" />
      </g>
      <circle cx="302" cy="32" r="4" fill="var(--chart-secondary)" />
    </svg>
  );
}

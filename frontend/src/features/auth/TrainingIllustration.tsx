import { useId } from "react";
/** A purpose-built gym still life, separate from the dashboard artwork. */
export function TrainingIllustration() {
  const id = useId();
  return (
    <svg
      className="training-illustration"
      viewBox="0 0 520 370"
      role="img"
      aria-label="Illustrated sunny training corner with a bench, dumbbells, kettlebell, water bottle and a growing plant"
    >
      <defs>
        <linearGradient id={`${id}-arch`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="var(--story-label-bg)" />
          <stop offset="1" stopColor="var(--peach)" />
        </linearGradient>
        <linearGradient id={`${id}-bell`} x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="var(--primary)" />
          <stop offset="1" stopColor="var(--story-text)" />
        </linearGradient>
      </defs>
      <ellipse
        cx="266"
        cy="318"
        rx="207"
        ry="24"
        fill="var(--story-line)"
        opacity=".17"
      />
      <path
        d="M133 263V137a126 126 0 0 1 252 0v126z"
        fill={`url(#${id}-arch)`}
      />
      <circle cx="311" cy="91" r="39" fill="var(--art-shirt)" opacity=".8" />
      <path
        d="M157 138h62m-52 16h74M312 173h49m-38 14h48"
        stroke="var(--story-line)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".4"
      />
      <path
        d="m75 292 242-48 142 46-244 54z"
        fill="var(--accent-soft-text)"
        opacity=".16"
      />
      <path
        d="m96 283 220-42 126 39-223 47z"
        fill="var(--accent-soft)"
        stroke="var(--story-line)"
        strokeWidth="1.5"
      />
      <path
        d="m120 290 206-39m-175 48 201-39m-170 48 197-39"
        stroke="var(--story-line)"
        strokeWidth="1"
        opacity=".3"
      />
      <g className="illustration-bench">
        <path
          d="m213 231-22 70 15 4 28-72m103-26 25 75 15-3-17-77"
          fill="var(--art-outline)"
        />
        <path d="m190 218 158-28 40 18-161 32z" fill="var(--art-trousers)" />
        <path
          d="M190 218v14l37 19 161-31v-12l-161 32z"
          fill="var(--art-outline)"
        />
        <path d="m199 216 149-26 31 15-151 28z" fill="var(--primary)" />
        <path
          d="m213 219 118-22"
          stroke="var(--art-line)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="m294 214 29-5 23 12v26l-26 5v-26z"
          fill="var(--story-label-bg)"
        />
        <path
          d="m319 226 24-5m-20 11 19-4m-19 10 19-4m-19 10 19-4"
          stroke="var(--story-line)"
          strokeWidth="1.5"
          opacity=".6"
        />
      </g>
      <g
        className="illustration-dumbbell"
        transform="translate(238 176) rotate(-11)"
      >
        <rect x="0" y="8" width="64" height="10" rx="4" fill="var(--art-bar)" />
        <path
          d="M23 10h18m-18 3h18m-18 3h18"
          stroke="var(--art-plate-line)"
          strokeWidth="1"
        />
        <rect
          x="0"
          y="-3"
          width="14"
          height="32"
          rx="5"
          fill="var(--art-outline)"
        />
        <rect
          x="11"
          y="-8"
          width="13"
          height="42"
          rx="5"
          fill="var(--art-plate)"
        />
        <rect
          x="43"
          y="-8"
          width="13"
          height="42"
          rx="5"
          fill="var(--art-plate)"
        />
        <rect
          x="54"
          y="-3"
          width="14"
          height="32"
          rx="5"
          fill="var(--art-outline)"
        />
        <path
          d="M15-3v29m33-29v29"
          stroke="var(--art-plate-line)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
      <g transform="translate(111 206)">
        <path
          d="M13 38V19C13-5 52-5 52 19v19"
          fill="none"
          stroke="var(--art-outline)"
          strokeWidth="11"
        />
        <path
          d="M20 36V20c0-13 25-13 25 0v16"
          fill="none"
          stroke="var(--art-line)"
          strokeWidth="3"
        />
        <path
          d="M9 39c-18 25-17 53 6 58h36c23-5 24-33 6-58-9-15-39-15-48 0"
          fill={`url(#${id}-bell)`}
        />
        <path
          d="M12 47c-9 17-11 29-5 36"
          fill="none"
          stroke="var(--art-line)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="m29 51-7 15h11l-4 17 16-23H34l6-9z" fill="var(--art-shirt)" />
      </g>
      <g transform="translate(358 249) rotate(12)">
        <ellipse cx="29" cy="25" rx="28" ry="35" fill="var(--peach-text)" />
        <ellipse
          cx="25"
          cy="23"
          rx="25"
          ry="34"
          fill="var(--chart-secondary)"
        />
        <ellipse
          cx="25"
          cy="23"
          rx="17"
          ry="25"
          fill="none"
          stroke="var(--art-shirt)"
          strokeWidth="2"
        />
        <ellipse cx="25" cy="23" rx="5" ry="7" fill="var(--art-outline)" />
        <path
          d="M14 8v-3m22 3v-3M13 41v3m23-3v3"
          stroke="var(--art-shirt)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </g>
      <g className="illustration-bottle" transform="translate(399 187)">
        <path
          d="M0 11h25v12l7 10v57a6 6 0 0 1-6 6H-1a6 6 0 0 1-6-6V33l7-10z"
          fill="var(--art-shirt)"
        />
        <rect
          x="-1"
          y="4"
          width="27"
          height="10"
          rx="3"
          fill="var(--art-outline)"
        />
        <path
          d="M5 3V0c0-7 14-7 14 0v3"
          fill="none"
          stroke="var(--art-outline)"
          strokeWidth="3"
        />
        <rect
          x="-7"
          y="45"
          width="39"
          height="29"
          fill="var(--story-label-bg)"
          opacity=".8"
        />
        <path d="m8 52-3 9h7l-1 8 10-13h-8l2-4z" fill="var(--primary)" />
        <path
          d="M0 32v51"
          stroke="var(--story-label-bg)"
          strokeWidth="3"
          strokeLinecap="round"
          opacity=".6"
        />
      </g>
      <g className="illustration-plant">
        <path d="m70 246 7 50h37l8-50z" fill="var(--peach-text)" />
        <path
          d="m78 249 7 43m9-43 2 43m14-43-6 43"
          stroke="var(--art-shirt)"
          strokeWidth="2"
          opacity=".6"
        />
        <ellipse cx="96" cy="246" rx="26" ry="6" fill="var(--art-outline)" />
        <path
          d="M95 247v-54m0 37-19-18m20 0 20-25"
          stroke="var(--mint-text)"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M95 213c-32 2-41-18-33-26 21-6 34 9 33 26m1 12c30-2 43-26 33-33-20-3-34 16-33 33m-1-25c-18-14-17-35-4-40 14 9 16 29 4 40"
          fill="var(--mint-text)"
        />
        <path
          d="m79 197 13 12m20-4-13 15m-8-50 3 23"
          stroke="var(--ready-text)"
          strokeWidth="2"
          opacity=".5"
        />
      </g>
      <g
        fill="none"
        stroke="var(--story-accent)"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M405 119v14m-7-7h14M91 123v11m-5-5h10" />
        <path d="m189 62 3 5 5 3-5 3-3 5-3-5-5-3 5-3z" />
      </g>
      <circle cx="363" cy="57" r="3" fill="var(--chart-secondary)" />
      <circle cx="130" cy="167" r="3" fill="var(--art-shirt)" />
    </svg>
  );
}

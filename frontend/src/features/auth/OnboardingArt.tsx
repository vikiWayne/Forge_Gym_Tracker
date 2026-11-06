export function OnboardingArt({ step }: { step: number }) {
  return (
    <svg
      className="onboarding-art"
      viewBox="0 0 240 145"
      role="img"
      aria-label={
        [
          "Illustration of a growing personal milestone",
          "Illustration of a body weight scale",
          "Illustration of different people in a training community",
        ][step]
      }
    >
      <circle cx="120" cy="74" r="62" fill="var(--accent-soft)" />
      <circle
        cx="120"
        cy="74"
        r="50"
        fill="none"
        stroke="var(--story-line)"
        strokeDasharray="4 6"
      />
      {step === 0 ? (
        <g>
          <rect
            x="78"
            y="44"
            width="86"
            height="65"
            rx="12"
            fill="var(--surface)"
            stroke="var(--control-border)"
            strokeWidth="2"
          />
          <path
            d="M78 62h86M99 37v15M143 37v15"
            stroke="var(--primary)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="m105 88 10 10 20-24"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M174 34v16m-8-8h16"
            stroke="var(--chart-secondary)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      ) : step === 1 ? (
        <g>
          <rect
            x="77"
            y="37"
            width="90"
            height="81"
            rx="20"
            fill="var(--surface)"
            stroke="var(--control-border)"
            strokeWidth="2"
          />
          <path
            d="M95 70a27 27 0 0 1 54 0z"
            fill="var(--peach)"
            stroke="var(--peach-text)"
            strokeWidth="2"
          />
          <path
            d="m122 65 12-12"
            stroke="var(--primary)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <ellipse cx="104" cy="92" rx="7" ry="14" fill="var(--accent-soft)" />
          <ellipse cx="140" cy="92" rx="7" ry="14" fill="var(--accent-soft)" />
          <path
            d="M59 62v12m-6-6h12"
            stroke="var(--chart-secondary)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      ) : (
        <g>
          <circle cx="74" cy="62" r="14" fill="var(--art-shirt)" />
          <path
            d="M53 110V95a21 21 0 0 1 42 0v15"
            fill="var(--peach)"
            stroke="var(--peach-text)"
            strokeWidth="2"
          />
          <circle cx="167" cy="62" r="14" fill="var(--art-line)" />
          <path
            d="M146 110V95a21 21 0 0 1 42 0v15"
            fill="var(--accent-soft)"
            stroke="var(--accent-soft-text)"
            strokeWidth="2"
          />
          <circle cx="120" cy="48" r="18" fill="var(--primary)" />
          <path
            d="M94 115V91a26 26 0 0 1 52 0v24"
            fill="var(--surface)"
            stroke="var(--primary)"
            strokeWidth="3"
          />
          <path
            d="m113 92 6 7 12-15"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </g>
      )}
      <path
        d="M62 125h120"
        stroke="var(--story-line)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ProteinIllustration() {
  return (
    <svg
      viewBox="0 0 340 195"
      role="img"
      aria-label="Illustrated protein foods: a bowl, eggs, beans, tofu and a shaker bottle"
    >
      <ellipse
        cx="170"
        cy="173"
        rx="139"
        ry="13"
        fill="var(--story-line)"
        opacity=".17"
      />
      <circle cx="194" cy="86" r="71" fill="var(--peach)" />
      <path
        d="M60 110h134c-5 46-22 61-67 61s-61-15-67-61"
        fill="var(--primary)"
      />
      <ellipse
        cx="127"
        cy="110"
        rx="67"
        ry="17"
        fill="var(--accent-soft)"
        stroke="var(--primary)"
        strokeWidth="3"
      />
      <g fill="var(--mint-text)">
        <ellipse
          cx="91"
          cy="103"
          rx="18"
          ry="10"
          transform="rotate(-22 91 103)"
        />
        <ellipse
          cx="111"
          cy="100"
          rx="18"
          ry="10"
          transform="rotate(20 111 100)"
        />
      </g>
      <g fill="var(--peach-text)">
        <ellipse cx="145" cy="105" rx="10" ry="6" />
        <ellipse cx="164" cy="110" rx="10" ry="6" />
        <ellipse cx="136" cy="116" rx="10" ry="6" />
      </g>
      <path d="m107 82 23-12 25 13-23 13z" fill="var(--surface)" />
      <path
        d="m107 82 25 14v15l-25-14zm25 14 23-13v15l-23 13z"
        fill="var(--story-label-bg)"
        stroke="var(--story-line)"
        strokeWidth="1"
      />
      <g>
        <path
          d="M231 49h42l10 22v83a9 9 0 0 1-9 9h-44a9 9 0 0 1-9-9V71z"
          fill="var(--art-shirt)"
        />
        <rect
          x="227"
          y="36"
          width="50"
          height="17"
          rx="5"
          fill="var(--art-outline)"
        />
        <path
          d="M240 35v-9h22v9"
          fill="none"
          stroke="var(--art-outline)"
          strokeWidth="5"
        />
        <rect
          x="221"
          y="88"
          width="62"
          height="36"
          fill="var(--surface)"
          opacity=".8"
        />
        <path d="m250 92-10 18h11l-4 12 17-23h-12l3-7z" fill="var(--primary)" />
        <path
          d="M231 72v69"
          stroke="var(--story-label-bg)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity=".7"
        />
      </g>
      <g transform="translate(192 141) rotate(24)">
        <ellipse
          cx="0"
          cy="0"
          rx="22"
          ry="29"
          fill="var(--surface)"
          stroke="var(--story-line)"
          strokeWidth="2"
        />
        <circle cx="0" cy="3" r="12" fill="var(--art-shirt)" />
      </g>
      <g stroke="var(--story-accent)" strokeWidth="2.5" strokeLinecap="round">
        <path d="M57 66v12m-6-6h12m239 46v12m-6-6h12" />
      </g>
      <circle cx="197" cy="40" r="4" fill="var(--chart-secondary)" />
    </svg>
  );
}

export function GymArt() {
  return (
    <svg
      viewBox="0 0 440 230"
      role="img"
      aria-label="Illustration of an athlete lifting a barbell"
    >
      <defs>
        <linearGradient id="halo">
          <stop stopColor="#8dbfa2" stopOpacity=".25" />
          <stop offset="1" stopColor="#8dbfa2" stopOpacity="0" />
        </linearGradient>
      </defs>
      <circle cx="258" cy="118" r="105" fill="url(#halo)" />
      <g stroke="#6c9980" opacity=".2" fill="none">
        <circle cx="258" cy="118" r="94" />
        <circle cx="258" cy="118" r="72" />
        <path d="M90 212h320M318 24v180M100 45h270" />
      </g>
      <path
        d="M225 132l-24 48-41 17 8 16 57-17 32-45M268 142l24 38 54 22-7 16-68-22-32-43"
        fill="#3b6250"
        stroke="#244337"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path d="M229 75q25-14 40 6l14 65q-25 22-64-1z" fill="#8dbfa2" />
      <path
        d="M232 85l-30 31-24-38M266 87l30 26 19-35"
        fill="none"
        stroke="#bd866d"
        strokeWidth="15"
        strokeLinecap="round"
      />
      <path d="M239 70l1-17 22-1-1 25" fill="#bd866d" />
      <circle cx="251" cy="40" r="20" fill="#ce987c" />
      <path d="M231 40q-5-30 24-24 22 0 17 26l-10-15-30 13" fill="#252b26" />
      <path d="M145 74h207" stroke="#708a7d" strokeWidth="7" />
      <g fill="#343d31" stroke="#82916f" strokeWidth="2">
        <rect x="146" y="44" width="13" height="60" rx="4" />
        <rect x="162" y="36" width="18" height="76" rx="5" />
        <rect x="319" y="36" width="18" height="76" rx="5" />
        <rect x="340" y="44" width="13" height="60" rx="4" />
      </g>
      <g fill="#8dbfa2">
        <path d="M110 114h15v3h-15zM116 108h3v15h-3zM358 141h15v3h-15zM364 135h3v15h-3z" />
        <circle cx="185" cy="29" r="3" />
      </g>
    </svg>
  );
}

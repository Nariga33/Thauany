export default function StrawberryMark() {
  return (
    <svg width="42" height="42" viewBox="0 0 48 48" aria-hidden="true">
      <ellipse cx="24" cy="10" rx="11" ry="5" fill="var(--leaf)" />
      <ellipse cx="16" cy="9" rx="6" ry="3.4" fill="var(--leaf)" transform="rotate(-24 16 9)" />
      <ellipse cx="32" cy="9" rx="6" ry="3.4" fill="var(--leaf)" transform="rotate(24 32 9)" />
      <path
        d="M9 16 C9 12 15 10 24 10 C33 10 39 12 39 16 C39 30 32 42 24 42 C16 42 9 30 9 16 Z"
        fill="var(--accent)"
      />
      <g fill="#fff" opacity="0.85">
        <ellipse cx="17" cy="19" rx="1.3" ry="1.9" />
        <ellipse cx="24" cy="16" rx="1.3" ry="1.9" />
        <ellipse cx="31" cy="19" rx="1.3" ry="1.9" />
        <ellipse cx="14" cy="26" rx="1.3" ry="1.9" />
        <ellipse cx="21" cy="24" rx="1.3" ry="1.9" />
        <ellipse cx="28" cy="24" rx="1.3" ry="1.9" />
        <ellipse cx="34" cy="26" rx="1.3" ry="1.9" />
        <ellipse cx="18" cy="32" rx="1.3" ry="1.9" />
        <ellipse cx="25" cy="31" rx="1.3" ry="1.9" />
        <ellipse cx="31" cy="33" rx="1.3" ry="1.9" />
      </g>
    </svg>
  );
}

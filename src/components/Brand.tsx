export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`brand ${compact ? "brand-compact" : ""}`}
      aria-label="OUR home"
    >
      <span className="brand-symbol">
        <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
          <path d="M7 8h18L14.5 25l1.1-12.6L7 8Z" fill="currentColor" />
          <path d="m15.6 12.4 9.4-4.4" stroke="#C9F27B" strokeWidth="1.8" />
        </svg>
      </span>
      {!compact && (
        <span className="brand-word">
          OUR<span>.</span>
        </span>
      )}
    </span>
  );
}

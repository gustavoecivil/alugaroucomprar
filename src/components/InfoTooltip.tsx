interface InfoTooltipProps {
  texto: string
}

export default function InfoTooltip({ texto }: InfoTooltipProps) {
  return (
    <span className="group relative ml-1 inline-block">
      <span
        tabIndex={0}
        role="button"
        aria-label={texto}
        className="inline-block h-4 w-4 select-none rounded-full border border-[var(--accent)]/40 bg-[var(--accent)]/20 text-center text-[10px] leading-4 text-[var(--accent)] cursor-help"
      >
        ?
      </span>

      <span
        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-60 -translate-x-1/2 rounded-lg border border-[var(--primary)]/30 bg-[#1a1a1a] p-3 text-xs text-[var(--foreground)] opacity-0 shadow-lg shadow-black/50 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {texto}
        <span className="absolute top-full left-1/2 -mt-1 h-2 w-2 -translate-x-1/2 rotate-45 border-r border-b border-[var(--primary)]/30 bg-[#1a1a1a]" />
      </span>
    </span>
  )
}

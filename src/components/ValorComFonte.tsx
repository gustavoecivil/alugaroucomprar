import { formatCurrency } from '../lib/formatCurrency'
import InfoTooltip from './InfoTooltip'

export interface ParceiroLink {
  label: string
  url: string
  patrocinado?: boolean
}

export interface ValorComFonteProps {
  label: string
  value: number | null
  onChange: (v: number | null) => void
  autoValue?: number | null
  autoLabel?: string
  autoFonte?: string
  parceiros?: ParceiroLink[]
  placeholder?: string
  sufixo?: string
  suffix?: string
  tooltip?: string
}

function formatAutoValue(value: number, sufixo?: string): string {
  if (sufixo === 'R$') return formatCurrency(value)
  return `${value}${sufixo ? ` ${sufixo}` : ''}`
}

export default function ValorComFonte({
  label,
  value,
  onChange,
  autoValue,
  autoLabel,
  autoFonte,
  parceiros,
  placeholder,
  sufixo,
  suffix,
  tooltip,
}: ValorComFonteProps) {
  const unidade = sufixo ?? suffix
  const autoDisponivel = autoValue != null && autoLabel != null

  return (
    <div className="flex flex-col gap-1 text-sm">
      <label className="flex flex-col gap-1">
        <span className="text-[var(--foreground)]/80">
          {label}
          {tooltip && <InfoTooltip texto={tooltip} />}
        </span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value == null || Number.isNaN(value) ? '' : value}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            placeholder={placeholder}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
          />
          {unidade && <span className="whitespace-nowrap text-xs text-[var(--foreground)]/60">{unidade}</span>}
        </div>
      </label>

      {autoDisponivel && (
        <>
          <button
            type="button"
            onClick={() => onChange(autoValue)}
            className="w-fit text-left text-xs text-[var(--accent)] underline decoration-[var(--accent)]/40 underline-offset-2 hover:text-[var(--foreground)]"
          >
            Usar dado público: {autoLabel} — {formatAutoValue(autoValue, unidade)}
          </button>
          {autoFonte && <span className="text-xs text-[var(--foreground)]/50">Fonte: {autoFonte}</span>}
        </>
      )}

      {parceiros && parceiros.length > 0 && (
        <div className="text-xs text-[var(--foreground)]/60">
          Consultar preço em:{' '}
          {parceiros.map((parceiro, index) => (
            <span key={parceiro.url}>
              {index > 0 && ' · '}
              <a href={parceiro.url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline">
                {parceiro.label}
              </a>
              {parceiro.patrocinado && (
                <span className="ml-1 rounded border border-[var(--primary)]/50 px-1 text-[10px] text-[var(--primary)]">
                  Parceiro
                </span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

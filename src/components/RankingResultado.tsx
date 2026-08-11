import type { CenarioRankeado, TipoCenario } from '../lib/calculator'
import { formatCurrency } from '../lib/formatCurrency'
import { glossario } from '../lib/glossario'
import InfoTooltip from './InfoTooltip'

interface RankingResultadoProps {
  resultados: CenarioRankeado[]
}

const NOME_CENARIO: Record<TipoCenario, string> = {
  comprar: 'Comprar',
  locar: 'Locar',
  assinar: 'Assinar',
}

export default function RankingResultado({ resultados }: RankingResultadoProps) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {resultados.map((resultado, index) => {
        const melhorOpcao = index === 0
        const temFaixa =
          resultado.custoMensalMin !== resultado.custoMensalLiquido ||
          resultado.custoMensalMax !== resultado.custoMensalLiquido

        return (
          <div
            key={resultado.cenario}
            className={`relative rounded-xl border bg-white/5 p-6 ${
              melhorOpcao ? 'border-2 border-[var(--primary)]' : 'border-white/10'
            }`}
          >
            {melhorOpcao && (
              <span className="absolute -top-3 right-4 rounded-full bg-[var(--primary)] px-3 py-1 text-xs font-semibold text-black">
                Melhor opção
              </span>
            )}

            <h3 className="text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
              {NOME_CENARIO[resultado.cenario]}
            </h3>

            <p className="mt-4 text-2xl font-bold" style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
              {temFaixa
                ? `${formatCurrency(resultado.custoMensalMin)} — ${formatCurrency(resultado.custoMensalMax)}`
                : formatCurrency(resultado.custoMensalLiquido)}
            </p>
            <p className="text-xs text-[var(--foreground)]/60">custo mensal</p>

            <p
              className="mt-3 border-t border-dashed border-white/20 pt-3 text-sm"
              style={{ color: 'var(--foreground)' }}
            >
              Custo total: <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(resultado.custoTotal)}</span>
            </p>

            {resultado.saldoDevedor !== undefined && (
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                Saldo devedor: <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(resultado.saldoDevedor)}</span>
                <InfoTooltip texto={glossario.saldoDevedor} />
              </p>
            )}

            {resultado.valorRecuperado !== undefined && (
              <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                Recuperado: <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(resultado.valorRecuperado)}</span>
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

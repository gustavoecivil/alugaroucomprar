import { useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '../lib/formatCurrency'
import InfoTooltip from './InfoTooltip'

interface CombustivelAutofillProps {
  onCustoCalculado: (valor: number) => void
  consumoAutofill?: number | null
}

interface PrecoUf {
  gasolina: number
  etanol: number
  semana_referencia: string
}

type TipoCombustivel = 'gasolina' | 'etanol'

const UFS: { value: string; label: string }[] = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
]

const selectClassName =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:text-[var(--foreground)]/40'

const inputClassName =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)]'

export default function CombustivelAutofill({ onCustoCalculado, consumoAutofill }: CombustivelAutofillProps) {
  const [precos, setPrecos] = useState<Record<string, PrecoUf> | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)

  const [ufSelecionada, setUfSelecionada] = useState('')
  const [combustivelEscolhido, setCombustivelEscolhido] = useState<TipoCombustivel>('gasolina')
  const [kmMes, setKmMes] = useState(0)
  const [consumo, setConsumo] = useState(0)
  const [consumoPreenchidoAuto, setConsumoPreenchidoAuto] = useState(false)
  const [ultimoConsumoAutofill, setUltimoConsumoAutofill] = useState<number | null | undefined>(undefined)

  if (consumoAutofill !== ultimoConsumoAutofill) {
    setUltimoConsumoAutofill(consumoAutofill)
    if (consumoAutofill != null && consumoAutofill > 0) {
      setConsumo(consumoAutofill)
      setConsumoPreenchidoAuto(true)
    }
  }

  useEffect(() => {
    async function carregarPrecos() {
      setCarregando(true)
      setErro(false)
      try {
        const res = await fetch('/dados/precos-combustivel.json')
        if (!res.ok) throw new Error('precos_combustivel_unavailable')
        setPrecos(await res.json())
      } catch {
        setErro(true)
      } finally {
        setCarregando(false)
      }
    }

    carregarPrecos()
  }, [])

  const precoUf = ufSelecionada ? precos?.[ufSelecionada] : undefined
  const precoCombustivel = precoUf?.[combustivelEscolhido]

  const custoMensal = useMemo(() => {
    if (!precoCombustivel || !consumo || consumo <= 0) return 0
    return (kmMes / consumo) * precoCombustivel
  }, [kmMes, consumo, precoCombustivel])

  useEffect(() => {
    onCustoCalculado(custoMensal)
  }, [custoMensal, onCustoCalculado])

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/5 p-4 sm:col-span-2">
      <span className="text-sm text-[var(--foreground)]/80">
        Preço real de combustível por estado (ANP)
      </span>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--foreground)]/80">Estado (UF)</span>
          <select
            value={ufSelecionada}
            onChange={(e) => setUfSelecionada(e.target.value)}
            disabled={carregando}
            className={selectClassName}
          >
            <option value="" className="bg-[var(--background)]">
              {carregando ? 'Carregando...' : 'Selecione'}
            </option>
            {UFS.map((uf) => (
              <option key={uf.value} value={uf.value} className="bg-[var(--background)]">
                {uf.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--foreground)]/80">Combustível</span>
          <select
            value={combustivelEscolhido}
            onChange={(e) => setCombustivelEscolhido(e.target.value as TipoCombustivel)}
            className={selectClassName}
          >
            <option value="gasolina" className="bg-[var(--background)]">
              Gasolina
            </option>
            <option value="etanol" className="bg-[var(--background)]">
              Etanol
            </option>
          </select>
        </label>
      </div>

      {erro && (
        <p className="text-xs text-[var(--foreground)]/70">
          Não foi possível carregar os preços de combustível agora — tente novamente mais tarde.
        </p>
      )}

      {precoUf && (
        <p className="text-xs text-[var(--foreground)]/60">
          Gasolina: R$ {precoUf.gasolina.toFixed(2)}/l · Etanol: R$ {precoUf.etanol.toFixed(2)}/l
          {' '}
          (semana de referência: {precoUf.semana_referencia})
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--foreground)]/80">Km rodados por mês</span>
          <input
            type="number"
            value={Number.isNaN(kmMes) || kmMes === 0 ? '' : kmMes}
            onChange={(e) => setKmMes(e.target.value === '' ? 0 : Number(e.target.value))}
            placeholder="Ex: 1200"
            className={inputClassName}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--foreground)]/80">
            Consumo médio
            {consumoPreenchidoAuto && (
              <InfoTooltip texto="Consumo estimado pelo INMETRO para este veículo" />
            )}
          </span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={Number.isNaN(consumo) || consumo === 0 ? '' : consumo}
              onChange={(e) => {
                setConsumo(e.target.value === '' ? 0 : Number(e.target.value))
                setConsumoPreenchidoAuto(false)
              }}
              placeholder="Ex: 12"
              className={inputClassName}
            />
            <span className="whitespace-nowrap text-xs text-[var(--foreground)]/60">km/l</span>
          </div>
        </label>
      </div>

      {custoMensal > 0 && (
        <p className="text-sm text-[var(--foreground)]">
          Gasto mensal estimado com combustível:{' '}
          <span className="font-semibold" style={{ color: 'var(--accent)' }}>
            {formatCurrency(custoMensal)}
          </span>
        </p>
      )}
    </div>
  )
}

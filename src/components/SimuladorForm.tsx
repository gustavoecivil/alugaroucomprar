import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  compararCenarios,
  type CenarioRankeado,
  type EntradaComum,
  type EntradaComprar,
  type EntradaLocar,
  type EntradaAssinar,
  type NivelRisco,
  type CategoriaVeiculo,
} from '../lib/calculator'
import { glossario } from '../lib/glossario'
import InfoTooltip from './InfoTooltip'
import FipeAutofill from './FipeAutofill'

interface SimuladorFormProps {
  onCompare: (resultados: CenarioRankeado[]) => void
}

interface NumberFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  placeholder?: string
  suffix?: string
  tooltip?: string
}

function NumberField({ label, value, onChange, placeholder, suffix, tooltip }: NumberFieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-[var(--foreground)]/80">
        {label}
        {tooltip && <InfoTooltip texto={tooltip} />}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={Number.isNaN(value) ? '' : value}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          placeholder={placeholder}
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
        />
        {suffix && <span className="whitespace-nowrap text-xs text-[var(--foreground)]/60">{suffix}</span>}
      </div>
    </label>
  )
}

function Card({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/5 p-6">
      <h2 className="mb-4 text-lg font-semibold" style={{ color: 'var(--accent)' }}>
        {titulo}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

const NIVEIS_RISCO: { value: NivelRisco; label: string }[] = [
  { value: 'baixo', label: 'Baixo' },
  { value: 'medio', label: 'Médio' },
  { value: 'alto', label: 'Alto' },
]

const CATEGORIAS_VEICULO: { value: CategoriaVeiculo; label: string }[] = [
  { value: 'popular', label: 'Popular' },
  { value: 'intermediario', label: 'Intermediário ou importado' },
  { value: 'premium', label: 'Premium' },
  { value: 'eletrico', label: 'Elétrico' },
]

const HORIZONTE_OPCOES = [6, 12, 18, 24, 36]

export default function SimuladorForm({ onCompare }: SimuladorFormProps) {
  const [comum, setComum] = useState<EntradaComum>({
    horizonteMeses: 24,
    taxaCustoOportunidadeAnual: 10,
  })

  const [comprarDados, setComprarDados] = useState<Omit<EntradaComprar, 'risco'>>({
    precoVeiculo: 0,
    valorEntrada: 0,
    numeroParcelas: 0,
    taxaJurosMensal: 0,
    ipvaAnual: 0,
    seguroAnual: 0,
    manutencaoMensal: 0,
    valorRevendaEstimado: 0,
  })

  const [modoRisco, setModoRisco] = useState<'manual' | 'automatico'>('manual')
  const [nivelRisco, setNivelRisco] = useState<NivelRisco>('medio')
  const [categoriaRisco, setCategoriaRisco] = useState<CategoriaVeiculo>('intermediario')

  const [locar, setLocar] = useState<EntradaLocar>({
    mensalidade: 0,
    kmMensalIncluso: 0,
    valorMultaKmExcedente: 0,
    multaRescisao: 0,
  })

  const [assinar, setAssinar] = useState<EntradaAssinar>({
    mensalidade: 0,
    kmMensalIncluso: 0,
    prazoMinimoMeses: 0,
  })

  function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const risco: EntradaComprar['risco'] =
      modoRisco === 'manual' ? { modo: 'manual', nivel: nivelRisco } : { modo: 'automatico', categoria: categoriaRisco }

    const resultados = compararCenarios({
      comum,
      comprar: { ...comprarDados, risco },
      locar,
      assinar,
    })

    onCompare(resultados)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card titulo="Horizonte">
        <div className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-sm text-[var(--foreground)]/80">Horizonte (meses)</span>
          <div className="flex flex-wrap gap-2">
            {HORIZONTE_OPCOES.map((meses) => {
              const selecionado = comum.horizonteMeses === meses
              return (
                <button
                  key={meses}
                  type="button"
                  onClick={() => setComum((prev) => ({ ...prev, horizonteMeses: meses }))}
                  className={`cursor-pointer rounded-lg px-4 py-2 text-sm transition-colors duration-150 ${
                    selecionado
                      ? 'border-2 border-[var(--primary)] bg-[var(--primary)]/20 font-semibold text-[var(--primary)]'
                      : 'border border-white/10 bg-white/5 text-[var(--foreground)] hover:bg-white/10'
                  }`}
                >
                  <span className="sm:hidden">{meses}</span>
                  <span className="hidden sm:inline">{meses} meses</span>
                </button>
              )
            })}
          </div>
        </div>
        <NumberField
          label="Custo de oportunidade"
          value={comum.taxaCustoOportunidadeAnual}
          onChange={(v) => setComum((prev) => ({ ...prev, taxaCustoOportunidadeAnual: v }))}
          placeholder="Ex: 10,5"
          suffix="% ao ano"
          tooltip={glossario.taxaCustoOportunidade}
        />
      </Card>

      <Card titulo="Comprar">
        <FipeAutofill onPriceResolved={(preco) => setComprarDados((prev) => ({ ...prev, precoVeiculo: preco }))} />

        <NumberField
          label="Preço do veículo"
          value={comprarDados.precoVeiculo}
          onChange={(v) => setComprarDados((prev) => ({ ...prev, precoVeiculo: v }))}
          placeholder="Ex: 90000"
        />
        <NumberField
          label="Valor de entrada"
          value={comprarDados.valorEntrada}
          onChange={(v) => setComprarDados((prev) => ({ ...prev, valorEntrada: v }))}
          placeholder="Ex: 20000"
          tooltip={glossario.valorEntrada}
        />
        <NumberField
          label="Número de parcelas"
          value={comprarDados.numeroParcelas}
          onChange={(v) => setComprarDados((prev) => ({ ...prev, numeroParcelas: v }))}
          placeholder="Ex: 48"
        />
        <NumberField
          label="Taxa de juros mensal"
          value={comprarDados.taxaJurosMensal}
          onChange={(v) => setComprarDados((prev) => ({ ...prev, taxaJurosMensal: v }))}
          placeholder="Ex: 1,5"
          suffix="% ao mês"
        />
        <NumberField
          label="IPVA anual"
          value={comprarDados.ipvaAnual}
          onChange={(v) => setComprarDados((prev) => ({ ...prev, ipvaAnual: v }))}
          placeholder="Ex: 2500"
          tooltip={glossario.ipva}
        />
        <NumberField
          label="Seguro anual"
          value={comprarDados.seguroAnual}
          onChange={(v) => setComprarDados((prev) => ({ ...prev, seguroAnual: v }))}
          placeholder="Ex: 3200"
        />
        <NumberField
          label="Manutenção mensal"
          value={comprarDados.manutencaoMensal}
          onChange={(v) => setComprarDados((prev) => ({ ...prev, manutencaoMensal: v }))}
          placeholder="Ex: 200"
        />
        <NumberField
          label="Valor de revenda estimado"
          value={comprarDados.valorRevendaEstimado}
          onChange={(v) => setComprarDados((prev) => ({ ...prev, valorRevendaEstimado: v }))}
          placeholder="Ex: 60000"
          tooltip={glossario.valorRevenda}
        />

        <div className="flex flex-col gap-2 sm:col-span-2">
          <span className="text-sm text-[var(--foreground)]/80">
            Risco
            <InfoTooltip texto={glossario.risco} />
          </span>
          <div className="flex w-fit overflow-hidden rounded-lg border border-white/10">
            <button
              type="button"
              onClick={() => setModoRisco('manual')}
              className={`px-3 py-2 text-sm ${
                modoRisco === 'manual' ? 'bg-[var(--primary)] text-black' : 'bg-transparent text-[var(--foreground)]'
              }`}
            >
              Escolher nível
            </button>
            <button
              type="button"
              onClick={() => setModoRisco('automatico')}
              className={`px-3 py-2 text-sm ${
                modoRisco === 'automatico' ? 'bg-[var(--primary)] text-black' : 'bg-transparent text-[var(--foreground)]'
              }`}
            >
              Calcular pela categoria
            </button>
          </div>

          {modoRisco === 'manual' ? (
            <select
              value={nivelRisco}
              onChange={(e) => setNivelRisco(e.target.value as NivelRisco)}
              className="w-full max-w-xs rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            >
              {NIVEIS_RISCO.map((nivel) => (
                <option key={nivel.value} value={nivel.value} className="bg-[var(--background)]">
                  {nivel.label}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={categoriaRisco}
              onChange={(e) => setCategoriaRisco(e.target.value as CategoriaVeiculo)}
              className="w-full max-w-xs rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
            >
              {CATEGORIAS_VEICULO.map((categoria) => (
                <option key={categoria.value} value={categoria.value} className="bg-[var(--background)]">
                  {categoria.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </Card>

      <Card titulo="Locar">
        <NumberField
          label="Mensalidade"
          value={locar.mensalidade}
          onChange={(v) => setLocar((prev) => ({ ...prev, mensalidade: v }))}
          placeholder="Ex: 2500"
        />
        <NumberField
          label="Km mensal incluso"
          value={locar.kmMensalIncluso}
          onChange={(v) => setLocar((prev) => ({ ...prev, kmMensalIncluso: v }))}
          placeholder="Ex: 2000"
          tooltip={glossario.kmIncluso}
        />
        <NumberField
          label="Multa por km excedente"
          value={locar.valorMultaKmExcedente}
          onChange={(v) => setLocar((prev) => ({ ...prev, valorMultaKmExcedente: v }))}
          placeholder="Ex: 1,20"
        />
        <NumberField
          label="Multa de rescisão"
          value={locar.multaRescisao}
          onChange={(v) => setLocar((prev) => ({ ...prev, multaRescisao: v }))}
          placeholder="Ex: 3000"
          tooltip={glossario.multaRescisao}
        />
      </Card>

      <Card titulo="Assinar">
        <NumberField
          label="Mensalidade"
          value={assinar.mensalidade}
          onChange={(v) => setAssinar((prev) => ({ ...prev, mensalidade: v }))}
          placeholder="Ex: 3000"
        />
        <NumberField
          label="Km mensal incluso"
          value={assinar.kmMensalIncluso}
          onChange={(v) => setAssinar((prev) => ({ ...prev, kmMensalIncluso: v }))}
          placeholder="Ex: 3000"
          tooltip={glossario.kmIncluso}
        />
        <NumberField
          label="Prazo mínimo (meses)"
          value={assinar.prazoMinimoMeses}
          onChange={(v) => setAssinar((prev) => ({ ...prev, prazoMinimoMeses: v }))}
          placeholder="Ex: 12"
          tooltip={glossario.prazoMinimo}
        />
      </Card>

      <button
        type="submit"
        className="rounded-lg bg-[var(--primary)] px-6 py-3 font-semibold text-black transition-opacity hover:opacity-90"
      >
        Comparar cenários
      </button>
    </form>
  )
}

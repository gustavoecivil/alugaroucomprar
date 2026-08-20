import { useEffect, useMemo, useState } from 'react'
import { formatCurrency } from '../lib/formatCurrency'
import InfoTooltip from './InfoTooltip'

interface CombustivelAutofillProps {
  onCustoCalculado: (valor: number) => void
  onInputsResolved?: (consumoKmL: number | null, precoCombustivel: number | null) => void
  consumoAutofill?: number | null
  combustivelVeiculo?: string | null
  kmAno?: number
}

interface PrecoUf {
  gasolina: number
  etanol: number
  diesel: number
  semana_referencia: string
}

type TipoCombustivel = 'gasolina' | 'etanol' | 'diesel' | 'eletrico'

const OPCOES_PADRAO: TipoCombustivel[] = ['gasolina', 'etanol', 'eletrico']

const LABEL_COMBUSTIVEL: Record<TipoCombustivel, string> = {
  gasolina: 'Gasolina',
  etanol: 'Etanol',
  diesel: 'Diesel',
  eletrico: 'Elétrico',
}

// Remove acentos e deixa minusculo, pra comparar sem depender de
// maiuscula/acentuacao exata do que a API da FIPE devolver.
const DIACRITICOS_REGEX = new RegExp('[' + String.fromCharCode(0x0300) + '-' + String.fromCharCode(0x036f) + ']', 'g')

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(DIACRITICOS_REGEX, '').toLowerCase().trim()
}

// A API da FIPE tem um bug real de encoding: confirmado numa chamada
// direta (byte a byte) que o campo "fuel" pra veiculos eletricos vem
// como "ElÃ©trico" -- os bytes UTF-8 de "Elétrico" foram
// reinterpretados como Latin-1 e regravados como UTF-8 (mojibake),
// virando uma string diferente de "Elétrico" de verdade. normalizar()
// sozinho nao resolve isso (o "é" quebrado vira dois caracteres, "Ã" +
// "©", nao um "e" com acento). Em vez de tentar consertar o mojibake em
// geral (arriscado, pode corromper string que ja estava certa),
// comparamos contra as duas formas conhecidas: a correta e a
// quebrada -- calculada em runtime a partir da string correta, sem
// precisar escrever o texto corrompido no codigo-fonte.
function paraVarianteMojibake(textoCorreto: string): string {
  const bytes = new TextEncoder().encode(textoCorreto)
  let resultado = ''
  for (const byte of bytes) resultado += String.fromCharCode(byte)
  return resultado
}

const ELETRICO_VARIANTES = new Set([normalizar('Elétrico'), normalizar(paraVarianteMojibake('Elétrico'))])
const ALCOOL_VARIANTES = new Set([normalizar('Álcool'), normalizar(paraVarianteMojibake('Álcool'))])

// O campo "fuel" da API da FIPE (ver FipeAutofill.tsx) — valores reais
// confirmados: "Gasolina", "Flex", "Diesel", "Elétrico" (com o bug de
// encoding acima), "Álcool", "Híbrido". Híbrido não tem regra clara
// (mistura elétrico com combustão) então cai no fallback de 3 opções,
// igual um valor desconhecido ou ausente.
function opcoesParaCombustivelFipe(combustivelFipe: string | null | undefined): TipoCombustivel[] {
  if (!combustivelFipe) return OPCOES_PADRAO

  const normalizado = normalizar(combustivelFipe)

  if (normalizado === 'flex') return ['gasolina', 'etanol']
  if (normalizado === 'gasolina') return ['gasolina']
  if (normalizado === 'diesel') return ['diesel']
  if (ELETRICO_VARIANTES.has(normalizado)) return ['eletrico']
  if (ALCOOL_VARIANTES.has(normalizado)) return ['etanol']
  return OPCOES_PADRAO
}

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

export default function CombustivelAutofill({
  onCustoCalculado,
  onInputsResolved,
  consumoAutofill,
  combustivelVeiculo,
  kmAno,
}: CombustivelAutofillProps) {
  const [precos, setPrecos] = useState<Record<string, PrecoUf> | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState(false)
  const [tarifaEletrica, setTarifaEletrica] = useState<Record<string, number> | null>(null)

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

  const opcoesDisponiveis = useMemo(() => opcoesParaCombustivelFipe(combustivelVeiculo), [combustivelVeiculo])
  const ehFlex = opcoesDisponiveis.includes('gasolina') && opcoesDisponiveis.includes('etanol')

  // Se o carro escolhido no FipeAutofill so aceita um combustivel (ou um
  // subconjunto) diferente do que estava selecionado, troca pra primeira
  // opcao valida em vez de deixar o select num valor que nao existe mais
  // na lista (ex.: tinha "Eletrico" escolhido e o usuario trocou pra um
  // carro a Diesel).
  const [ultimasOpcoes, setUltimasOpcoes] = useState(opcoesDisponiveis)
  if (opcoesDisponiveis !== ultimasOpcoes) {
    setUltimasOpcoes(opcoesDisponiveis)
    if (!opcoesDisponiveis.includes(combustivelEscolhido)) {
      setCombustivelEscolhido(opcoesDisponiveis[0])
    }
  }

  useEffect(() => {
    if (kmAno != null) setKmMes(kmAno / 12)
  }, [kmAno])

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

  useEffect(() => {
    async function carregarTarifaEletrica() {
      try {
        const res = await fetch('/dados/tarifa-eletrica.json')
        if (!res.ok) return
        setTarifaEletrica(await res.json())
      } catch {
        // tarifa eletrica e opcional: sem ela, a opcao "Eletrico" so fica sem autofill de preco
      }
    }

    carregarTarifaEletrica()
  }, [])

  const precoUf = ufSelecionada ? precos?.[ufSelecionada] : undefined
  const tarifaEletricaUf = ufSelecionada ? tarifaEletrica?.[ufSelecionada] : undefined
  const precoCombustivel =
    combustivelEscolhido === 'eletrico' ? tarifaEletricaUf : precoUf?.[combustivelEscolhido]

  const custoMensal = useMemo(() => {
    if (!precoCombustivel || !consumo || consumo <= 0) return 0
    return (kmMes / consumo) * precoCombustivel
  }, [kmMes, consumo, precoCombustivel])

  useEffect(() => {
    onCustoCalculado(custoMensal)
  }, [custoMensal, onCustoCalculado])

  useEffect(() => {
    onInputsResolved?.(consumo > 0 ? consumo : null, precoCombustivel ?? null)
  }, [consumo, onInputsResolved, precoCombustivel])

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-white/10 bg-white/5 p-4 sm:col-span-2">
      <span className="text-sm text-[var(--foreground)]/80">
        {combustivelEscolhido === 'eletrico'
          ? 'Tarifa real de energia elétrica por estado (ANEEL)'
          : 'Preço real de combustível por estado (ANP)'}
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
          <span className="text-[var(--foreground)]/80">
            Combustível
            {opcoesDisponiveis.length < OPCOES_PADRAO.length && (
              <InfoTooltip texto="Opções filtradas pelo combustível real do veículo escolhido na FIPE acima." />
            )}
          </span>
          <select
            value={combustivelEscolhido}
            onChange={(e) => setCombustivelEscolhido(e.target.value as TipoCombustivel)}
            className={selectClassName}
          >
            {opcoesDisponiveis.map((opcao) => (
              <option key={opcao} value={opcao} className="bg-[var(--background)]">
                {LABEL_COMBUSTIVEL[opcao]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {erro && (
        <p className="text-xs text-[var(--foreground)]/70">
          Não foi possível carregar os preços de combustível agora — tente novamente mais tarde.
        </p>
      )}

      {combustivelEscolhido === 'eletrico'
        ? tarifaEletricaUf != null && (
            <p className="text-xs text-[var(--foreground)]/60">
              Tarifa de energia: R$ {tarifaEletricaUf.toFixed(2)}/kWh
            </p>
          )
        : precoUf && (
            <p className="text-xs text-[var(--foreground)]/60">
              {opcoesDisponiveis
                .filter((opcao): opcao is 'gasolina' | 'etanol' | 'diesel' => opcao !== 'eletrico')
                .map((opcao) => `${LABEL_COMBUSTIVEL[opcao]}: R$ ${precoUf[opcao].toFixed(2)}/l`)
                .join(' · ')}
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
              <InfoTooltip
                texto={
                  ehFlex && combustivelEscolhido === 'etanol'
                    ? 'Consumo estimado pelo INMETRO para este veículo — mas o INMETRO não publica um valor separado para etanol dentro do Flex, então este número é o mesmo usado para gasolina. Na prática o consumo com etanol é menor (mais litros por km rodado); trate como aproximação, não medição.'
                    : 'Consumo estimado pelo INMETRO para este veículo'
                }
              />
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
            <span className="whitespace-nowrap text-xs text-[var(--foreground)]/60">
              {combustivelEscolhido === 'eletrico' ? 'km/kWh' : 'km/l'}
            </span>
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

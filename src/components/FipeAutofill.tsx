import { useEffect, useState } from 'react'

export interface FipeAutofillProps {
  onPriceResolved: (price: number, label: string) => void
  onConsumoResolved?: (consumo: number) => void
  onCombustivelResolved?: (combustivel: string) => void
}

interface FipeItem {
  code: string
  name: string
}

interface ConsumoVeiculo {
  consumo_km_l: number
}

function parsePrecoFipe(valor: unknown): number | null {
  if (typeof valor !== 'string') return null
  const numero = Number(valor.replace('R$ ', '').replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(numero) ? numero : null
}

const selectClassName =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:text-[var(--foreground)]/40'

export default function FipeAutofill({
  onPriceResolved,
  onConsumoResolved,
  onCombustivelResolved,
}: FipeAutofillProps) {
  const [marcas, setMarcas] = useState<FipeItem[]>([])
  const [modelos, setModelos] = useState<FipeItem[]>([])
  const [anos, setAnos] = useState<FipeItem[]>([])
  const [consumoPorVeiculo, setConsumoPorVeiculo] = useState<Record<string, ConsumoVeiculo>>({})
  const [marcaSelecionada, setMarcaSelecionada] = useState('')
  const [modeloSelecionado, setModeloSelecionado] = useState('')
  const [anoSelecionado, setAnoSelecionado] = useState('')
  const [carregandoMarcas, setCarregandoMarcas] = useState(true)
  const [carregandoModelos, setCarregandoModelos] = useState(false)
  const [carregandoAnos, setCarregandoAnos] = useState(false)
  const [carregandoPreco, setCarregandoPreco] = useState(false)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    async function carregarMarcas() {
      try {
        const res = await fetch('/.netlify/functions/fipe-marcas')
        if (!res.ok) throw new Error('fipe_unavailable')
        setMarcas(await res.json())
      } catch {
        setErro(true)
      } finally {
        setCarregandoMarcas(false)
      }
    }

    carregarMarcas()
  }, [])

  useEffect(() => {
    async function carregarConsumo() {
      try {
        const res = await fetch('/dados/consumo-veiculos.json')
        if (res.ok) setConsumoPorVeiculo(await res.json())
      } catch {
        // O preenchimento opcional de consumo não impede o uso da FIPE.
      }
    }

    carregarConsumo()
  }, [])

  async function handleMarcaChange(marca: string) {
    setMarcaSelecionada(marca)
    setModeloSelecionado('')
    setAnoSelecionado('')
    setModelos([])
    setAnos([])
    if (!marca) return

    setCarregandoModelos(true)
    setErro(false)
    try {
      const res = await fetch(`/.netlify/functions/fipe-modelos?marca=${encodeURIComponent(marca)}`)
      if (!res.ok) throw new Error('fipe_unavailable')
      setModelos(await res.json())
    } catch {
      setErro(true)
    } finally {
      setCarregandoModelos(false)
    }
  }

  async function handleModeloChange(modelo: string) {
    setModeloSelecionado(modelo)
    setAnoSelecionado('')
    setAnos([])
    if (!modelo) return

    setCarregandoAnos(true)
    setErro(false)
    try {
      const res = await fetch(
        `/.netlify/functions/fipe-anos?marca=${encodeURIComponent(marcaSelecionada)}&modelo=${encodeURIComponent(modelo)}`,
      )
      if (!res.ok) throw new Error('fipe_unavailable')
      const anosRecebidos = (await res.json()) as FipeItem[]
      const anoMinimo = new Date().getFullYear() - 3
      const anosRecentes = anosRecebidos.filter((item) => {
        const sequencia = /\d{4}/.exec(`${item.name} ${item.code}`)?.[0]
        return sequencia ? Number.parseInt(sequencia, 10) >= anoMinimo : false
      })
      setAnos(anosRecentes.length > 0 ? anosRecentes : anosRecebidos)
    } catch {
      setErro(true)
    } finally {
      setCarregandoAnos(false)
    }
  }

  async function handleAnoChange(ano: string) {
    setAnoSelecionado(ano)
    if (!ano) return

    setCarregandoPreco(true)
    setErro(false)
    try {
      const res = await fetch(
        `/.netlify/functions/fipe-preco?marca=${encodeURIComponent(marcaSelecionada)}&modelo=${encodeURIComponent(modeloSelecionado)}&ano=${encodeURIComponent(ano)}`,
      )
      if (!res.ok) throw new Error('fipe_unavailable')
      const data = await res.json()
      const price = parsePrecoFipe(data.price)
      const marca = marcas.find((item) => item.code === marcaSelecionada)?.name ?? marcaSelecionada
      const modelo = modelos.find((item) => item.code === modeloSelecionado)?.name ?? modeloSelecionado
      const anoLabel = anos.find((item) => item.code === ano)?.name ?? ano

      if (price !== null) onPriceResolved(price, `${marca} ${modelo} ${anoLabel}`)

      const consumo = consumoPorVeiculo[`${marcaSelecionada}-${modeloSelecionado}`]
      if (consumo) onConsumoResolved?.(consumo.consumo_km_l)
      if (typeof data.fuel === 'string' && data.fuel) onCombustivelResolved?.(data.fuel)
    } catch {
      setErro(true)
    } finally {
      setCarregandoPreco(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-4 sm:col-span-2">
      <span className="text-sm text-[var(--foreground)]/80">Preencher preço pela tabela FIPE</span>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--foreground)]/80">Marca</span>
          <select value={marcaSelecionada} onChange={(e) => handleMarcaChange(e.target.value)} disabled={carregandoMarcas} className={selectClassName}>
            <option value="" className="bg-[var(--background)]">{carregandoMarcas ? 'Carregando...' : 'Selecione'}</option>
            {marcas.map((marca) => <option key={marca.code} value={marca.code} className="bg-[var(--background)]">{marca.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--foreground)]/80">Modelo</span>
          <select value={modeloSelecionado} onChange={(e) => handleModeloChange(e.target.value)} disabled={!marcaSelecionada || carregandoModelos} className={selectClassName}>
            <option value="" className="bg-[var(--background)]">{carregandoModelos ? 'Carregando...' : 'Selecione'}</option>
            {modelos.map((modelo) => <option key={modelo.code} value={modelo.code} className="bg-[var(--background)]">{modelo.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--foreground)]/80">Ano</span>
          <select value={anoSelecionado} onChange={(e) => handleAnoChange(e.target.value)} disabled={!modeloSelecionado || carregandoAnos} className={selectClassName}>
            <option value="" className="bg-[var(--background)]">{carregandoAnos ? 'Carregando...' : 'Selecione'}</option>
            {anos.map((ano) => <option key={ano.code} value={ano.code} className="bg-[var(--background)]">{ano.name}</option>)}
          </select>
          <span className="text-xs text-[var(--foreground)]/50">
            Catálogo limitado aos últimos 3 anos-modelo — perfil real da frota de locadora (idade média 16,4 meses, ABLA).
          </span>
        </label>
      </div>
      {carregandoPreco && <p className="text-xs text-[var(--foreground)]/60">Buscando preço na FIPE...</p>}
      {erro && <div className="text-xs text-[var(--foreground)]/70">Não foi possível carregar dados da FIPE  preencha o preço manualmente abaixo</div>}
    </div>
  )
}

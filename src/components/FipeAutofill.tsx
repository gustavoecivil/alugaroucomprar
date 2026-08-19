import { useEffect, useState } from 'react'

interface FipeAutofillProps {
  onPriceResolved: (preco: number) => void
  onConsumoResolved?: (consumo: number) => void
  onCombustivelResolved?: (combustivel: string) => void
}

interface FipeItem {
  code: string
  name: string
}

interface ConsumoVeiculo {
  consumo_km_l: number
  confianca_match: string
}

function parsePrecoFipe(valor: string): number | null {
  const limpo = valor.replace(/[^\d,]/g, '').replace(',', '.')
  const numero = Number(limpo)
  return Number.isNaN(numero) ? null : numero
}

const selectClassName =
  'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[var(--foreground)] outline-none focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:text-[var(--foreground)]/40'

export default function FipeAutofill({ onPriceResolved, onConsumoResolved, onCombustivelResolved }: FipeAutofillProps) {
  const [marcas, setMarcas] = useState<FipeItem[]>([])
  const [modelos, setModelos] = useState<FipeItem[]>([])
  const [anos, setAnos] = useState<FipeItem[]>([])
  const [consumoPorVeiculo, setConsumoPorVeiculo] = useState<Record<string, ConsumoVeiculo>>({})

  const [marcaSelecionada, setMarcaSelecionada] = useState('')
  const [modeloSelecionado, setModeloSelecionado] = useState('')
  const [anoSelecionado, setAnoSelecionado] = useState('')

  const [carregandoMarcas, setCarregandoMarcas] = useState(false)
  const [carregandoModelos, setCarregandoModelos] = useState(false)
  const [carregandoAnos, setCarregandoAnos] = useState(false)
  const [carregandoPreco, setCarregandoPreco] = useState(false)

  const [erro, setErro] = useState(false)

  useEffect(() => {
    async function carregarMarcas() {
      setCarregandoMarcas(true)
      setErro(false)
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
        if (!res.ok) return
        setConsumoPorVeiculo(await res.json())
      } catch {
        // snapshot de consumo e opcional: sem ele, o campo de consumo so fica sem autofill
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
      const res = await fetch(`/.netlify/functions/fipe-modelos?marca=${marca}`)
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
      const res = await fetch(`/.netlify/functions/fipe-anos?marca=${marcaSelecionada}&modelo=${modelo}`)
      if (!res.ok) throw new Error('fipe_unavailable')
      setAnos(await res.json())
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
        `/.netlify/functions/fipe-preco?marca=${marcaSelecionada}&modelo=${modeloSelecionado}&ano=${ano}`,
      )
      if (!res.ok) throw new Error('fipe_unavailable')
      const data = await res.json()
      const preco = parsePrecoFipe(data.price)
      if (preco !== null) onPriceResolved(preco)

      const consumo = consumoPorVeiculo[`${marcaSelecionada}-${modeloSelecionado}`]
      if (consumo) onConsumoResolved?.(consumo.consumo_km_l)

      // "fuel" e o campo real da API da FIPE (confirmado por chamada direta:
      // valores como "Gasolina", "Flex", "Diesel", "Eletrico" -- ver
      // CombustivelAutofill.tsx pra como isso filtra as opcoes do select).
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
          <select
            value={marcaSelecionada}
            onChange={(e) => handleMarcaChange(e.target.value)}
            disabled={carregandoMarcas}
            className={selectClassName}
          >
            <option value="" className="bg-[var(--background)]">
              {carregandoMarcas ? 'Carregando...' : 'Selecione'}
            </option>
            {marcas.map((marca) => (
              <option key={marca.code} value={marca.code} className="bg-[var(--background)]">
                {marca.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--foreground)]/80">Modelo</span>
          <select
            value={modeloSelecionado}
            onChange={(e) => handleModeloChange(e.target.value)}
            disabled={!marcaSelecionada || carregandoModelos}
            className={selectClassName}
          >
            <option value="" className="bg-[var(--background)]">
              {carregandoModelos ? 'Carregando...' : 'Selecione'}
            </option>
            {modelos.map((modelo) => (
              <option key={modelo.code} value={modelo.code} className="bg-[var(--background)]">
                {modelo.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--foreground)]/80">Ano</span>
          <select
            value={anoSelecionado}
            onChange={(e) => handleAnoChange(e.target.value)}
            disabled={!modeloSelecionado || carregandoAnos}
            className={selectClassName}
          >
            <option value="" className="bg-[var(--background)]">
              {carregandoAnos ? 'Carregando...' : 'Selecione'}
            </option>
            {anos.map((ano) => (
              <option key={ano.code} value={ano.code} className="bg-[var(--background)]">
                {ano.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {carregandoPreco && <p className="text-xs text-[var(--foreground)]/60">Buscando preço na FIPE...</p>}

      {erro && (
        <p className="text-xs text-[var(--foreground)]/70">
          Não foi possível carregar dados da FIPE agora — preencha o preço manualmente abaixo.
        </p>
      )}
    </div>
  )
}

import type { EntradaComum, EntradaComprar, EntradaLocar, EntradaAssinar, ResultadoCenario } from './types'
import { calcularComprar } from './comprar'
import { calcularLocar } from './locar'
import { calcularAssinar } from './assinar'

export * from './types'
export { getFaixaRisco, getRiscoSinistroRoubo } from './risco'
export { calcularComprar } from './comprar'
export { calcularLocar } from './locar'
export { calcularAssinar } from './assinar'
export { calcularCustoCombustivelMensal } from './combustivel'

export type TipoCenario = 'comprar' | 'locar' | 'assinar'

export interface CenarioRankeado extends ResultadoCenario {
  cenario: TipoCenario
}

export interface EntradasSimulador {
  comum: EntradaComum
  comprar: EntradaComprar
  locar: EntradaLocar
  assinar: EntradaAssinar
}

// Roda os três cálculos e devolve o ranking de cenários, do mais barato
// pro mais caro, comparando pelo custo mensal líquido equivalente.
export function compararCenarios(entradas: EntradasSimulador): CenarioRankeado[] {
  const resultados: CenarioRankeado[] = [
    { cenario: 'comprar', ...calcularComprar(entradas.comprar, entradas.comum) },
    { cenario: 'locar', ...calcularLocar(entradas.locar, entradas.comum) },
    { cenario: 'assinar', ...calcularAssinar(entradas.assinar, entradas.comum) },
  ]

  return resultados.sort((a, b) => a.custoMensalLiquido - b.custoMensalLiquido)
}

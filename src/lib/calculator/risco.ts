// ATENÇÃO: valores heurísticos provisórios (documentados em
// docs/DECISOES.md). Substituir por dado real de depreciação por
// marca/modelo assim que o Índice GSA estiver pronto.

import type { EntradaComprar, NivelRisco, CategoriaVeiculo } from './types'

const MARGEM_POR_NIVEL: Record<NivelRisco, number> = {
  baixo: 0.05,
  medio: 0.1,
  alto: 0.18,
}

const MARGEM_POR_CATEGORIA: Record<CategoriaVeiculo, number> = {
  popular: 0.05,
  intermediario: 0.1,
  premium: 0.18,
  eletrico: 0.15,
}

export function getFaixaRisco(risco: EntradaComprar['risco']): number {
  if (risco.modo === 'manual') {
    return MARGEM_POR_NIVEL[risco.nivel]
  }
  return MARGEM_POR_CATEGORIA[risco.categoria]
}

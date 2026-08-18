// Modo automático (por categoria): dado REAL, não mais estimativa.
// Calculado pelo Índice GSA (projeto indice-gsa-veicular) em 2026-08-18,
// a partir do coeficiente de variação de preço FIPE (desvio padrão sobre
// a média) de 30.314 veículos com histórico real de até 12 meses
// (setembro/2025 a agosto/2026), sobre o catálogo completo de 30.433
// combinações marca/modelo/ano — ver docs/METODOLOGIA_RISCO.md e
// docs/RELATORIO_INDICE_GSA_2026-08.md naquele projeto para o
// detalhamento e as limitações (o horizonte medido é de até 12 meses;
// se a simulação usar um horizonte maior, esse risco não cobre
// depreciação/revenda de longo prazo, só a oscilação de curto prazo já
// observada na própria tabela FIPE).
//
// Modo manual (Baixo/Médio/Alto): continua heurístico. É uma escolha
// subjetiva do usuário sobre o quanto ele julga que o valor de revenda
// pode variar — não há uma "categoria objetiva" pra calcular um valor
// real equivalente, então não dá pra substituir por dado do Índice GSA
// do mesmo jeito que fizemos pro modo automático.

import type { EntradaComprar, NivelRisco, CategoriaVeiculo } from './types'

const MARGEM_POR_NIVEL: Record<NivelRisco, number> = {
  baixo: 0.05,
  medio: 0.1,
  alto: 0.18,
}

const MARGEM_POR_CATEGORIA: Record<CategoriaVeiculo, number> = {
  popular: 0.0183,
  intermediario: 0.0207,
  premium: 0.0259,
  eletrico: 0.0293,
}

export function getFaixaRisco(risco: EntradaComprar['risco']): number {
  if (risco.modo === 'manual') {
    return MARGEM_POR_NIVEL[risco.nivel]
  }
  return MARGEM_POR_CATEGORIA[risco.categoria]
}

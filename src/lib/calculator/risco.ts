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
import riscoSusepData from '../../../public/dados/risco-susep.json'

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

// Risco de sinistro/roubo (SUSEP): métrica DIFERENTE do risco de
// desvalorização acima — reflete sinistralidade/roubo real por
// categoria (índice de Roubo/Furto do IVR, ferramenta oficial da
// SUSEP), não variação de preço da FIPE. As duas não são somadas nem
// combinadas num número só; ficam sempre separadas — ver
// docs/METODOLOGIA_RISCO_SUSEP.md no projeto indice-gsa-veicular pro
// detalhamento do cálculo e suas limitações.
interface EntradaRiscoSinistroRoubo {
  valor: number
  amostraModelosIvr: number
}

const riscoSinistroRoubo = riscoSusepData as Record<CategoriaVeiculo, EntradaRiscoSinistroRoubo>

// Abaixo desse número de modelos do IVR, o valor não é confiável — é
// literalmente 0% por falta de dado (caso do elétrico hoje, com 1 único
// modelo), não porque o risco real medido seja zero. Ver
// scripts/exportar_risco_susep.py.
const AMOSTRA_MINIMA_MODELOS_IVR = 5

export interface RiscoSinistroRoubo {
  valor: number
  amostraModelosIvr: number
  amostraSuficiente: boolean
}

export function getRiscoSinistroRoubo(categoria: CategoriaVeiculo): RiscoSinistroRoubo {
  const entrada = riscoSinistroRoubo[categoria]
  return {
    valor: entrada.valor,
    amostraModelosIvr: entrada.amostraModelosIvr,
    amostraSuficiente: entrada.amostraModelosIvr >= AMOSTRA_MINIMA_MODELOS_IVR,
  }
}

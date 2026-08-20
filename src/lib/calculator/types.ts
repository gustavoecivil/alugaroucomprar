export type CategoriaVeiculo = 'popular' | 'intermediario' | 'premium' | 'eletrico'
export type NivelRisco = 'baixo' | 'medio' | 'alto'

export interface EntradaComum {
  horizonteMeses: number
  taxaCustoOportunidadeAnual: number // % ao ano, ex: 10.5
  kmAno: number
  consumoKmL: number | null
  precoCombustivel: number | null
}

export interface EntradaComprar {
  precoVeiculo: number
  valorEntrada: number
  numeroParcelas: number
  taxaJurosMensal: number // %
  ipvaAnual: number
  seguroAnual: number
  manutencaoMensal: number
  valorRevendaEstimado: number
  risco: { modo: 'manual'; nivel: NivelRisco } | { modo: 'automatico'; categoria: CategoriaVeiculo }
}

export interface EntradaLocar {
  mensalidade: number
  kmMensalIncluso: number
  valorMultaKmExcedente: number
  multaRescisao: number
}

export interface EntradaAssinar {
  mensalidade: number
  kmMensalIncluso: number
  prazoMinimoMeses: number
}

export interface ResultadoCenario {
  custoMensalLiquido: number
  custoMensalMin: number // considerando a faixa de risco, quando aplicável
  custoMensalMax: number
  custoTotal: number
  custoCombustivelMensal: number
  saldoDevedor?: number // só em Comprar financiado
  valorRecuperado?: number // só em Comprar
}

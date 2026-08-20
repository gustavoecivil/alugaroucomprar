import type { EntradaLocar, EntradaComum, ResultadoCenario } from './types'
import { calcularCustoCombustivelMensal } from './combustivel'

// Nota: kmMensalIncluso, valorMultaKmExcedente e multaRescisao ficam
// reservados para uma versão futura que considere km rodado real e
// rescisão antecipada dentro do horizonte. Nesta v1 assume-se uso dentro
// da franquia e contrato mantido até o fim do horizonte, sem faixa de
// risco (não há depreciação/revenda envolvida em Locar).
export function calcularLocar(entrada: EntradaLocar, comum: EntradaComum): ResultadoCenario {
  const { mensalidade } = entrada
  const { horizonteMeses, kmAno, consumoKmL, precoCombustivel } = comum

  if (horizonteMeses <= 0) {
    throw new Error('horizonteMeses precisa ser maior que zero')
  }

  const custoCombustivelMensal = calcularCustoCombustivelMensal(kmAno, consumoKmL, precoCombustivel)
  const custoTotal = (mensalidade + custoCombustivelMensal) * horizonteMeses
  const custoMensalLiquido = custoTotal / horizonteMeses

  return {
    custoMensalLiquido,
    custoMensalMin: custoMensalLiquido,
    custoMensalMax: custoMensalLiquido,
    custoTotal,
    custoCombustivelMensal,
  }
}

import type { EntradaAssinar, EntradaComum, ResultadoCenario } from './types'
import { calcularCustoCombustivelMensal } from './combustivel'

// Nota: kmMensalIncluso fica reservado para uma versão futura que
// considere km rodado real. Se o horizonte pedido for menor que o prazo
// mínimo do contrato, o usuário continua pagando até completar o prazo
// mínimo — esse custo extra é diluído no custo mensal do horizonte.
export function calcularAssinar(entrada: EntradaAssinar, comum: EntradaComum): ResultadoCenario {
  const { mensalidade, prazoMinimoMeses } = entrada
  const { horizonteMeses, kmAno, consumoKmL, precoCombustivel } = comum

  if (horizonteMeses <= 0) {
    throw new Error('horizonteMeses precisa ser maior que zero')
  }

  const mesesCobrados = Math.max(horizonteMeses, prazoMinimoMeses)
  const custoCombustivelMensal = calcularCustoCombustivelMensal(kmAno, consumoKmL, precoCombustivel)
  const custoTotal = (mensalidade + custoCombustivelMensal) * mesesCobrados
  const custoMensalLiquido = custoTotal / horizonteMeses

  return {
    custoMensalLiquido,
    custoMensalMin: custoMensalLiquido,
    custoMensalMax: custoMensalLiquido,
    custoTotal,
    custoCombustivelMensal,
  }
}

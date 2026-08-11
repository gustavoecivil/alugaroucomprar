import type { EntradaAssinar, EntradaComum, ResultadoCenario } from './types'

// Nota: kmMensalIncluso fica reservado para uma versão futura que
// considere km rodado real. Se o horizonte pedido for menor que o prazo
// mínimo do contrato, o usuário continua pagando até completar o prazo
// mínimo — esse custo extra é diluído no custo mensal do horizonte.
export function calcularAssinar(entrada: EntradaAssinar, comum: EntradaComum): ResultadoCenario {
  const { mensalidade, prazoMinimoMeses } = entrada
  const { horizonteMeses } = comum

  if (horizonteMeses <= 0) {
    throw new Error('horizonteMeses precisa ser maior que zero')
  }

  const mesesCobrados = Math.max(horizonteMeses, prazoMinimoMeses)
  const custoTotal = mensalidade * mesesCobrados
  const custoMensalLiquido = custoTotal / horizonteMeses

  return {
    custoMensalLiquido,
    custoMensalMin: custoMensalLiquido,
    custoMensalMax: custoMensalLiquido,
    custoTotal,
  }
}

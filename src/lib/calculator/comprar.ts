import type { EntradaComprar, EntradaComum, ResultadoCenario } from './types'
import { getFaixaRisco } from './risco'
import { calcularCustoCombustivelMensal } from './combustivel'
import { fatorManutencaoPorKm } from '../perfilUso'

// Parcela fixa pela tabela Price (sistema de amortização francês).
function calcularParcelaPrice(valorFinanciado: number, taxaMensal: number, numeroParcelas: number): number {
  if (numeroParcelas <= 0 || valorFinanciado <= 0) return 0
  if (taxaMensal === 0) return valorFinanciado / numeroParcelas
  return (valorFinanciado * taxaMensal) / (1 - Math.pow(1 + taxaMensal, -numeroParcelas))
}

// Saldo devedor remanescente após `parcelasPagas` parcelas, pela tabela Price:
// valor presente das parcelas que ainda faltam pagar.
function calcularSaldoDevedor(
  parcela: number,
  taxaMensal: number,
  numeroParcelas: number,
  parcelasPagas: number,
): number {
  const restantes = numeroParcelas - parcelasPagas
  if (restantes <= 0) return 0
  if (taxaMensal === 0) return parcela * restantes
  return (parcela * (1 - Math.pow(1 + taxaMensal, -restantes))) / taxaMensal
}

export function calcularComprar(entrada: EntradaComprar, comum: EntradaComum): ResultadoCenario {
  const {
    precoVeiculo,
    valorEntrada,
    numeroParcelas,
    taxaJurosMensal,
    ipvaAnual,
    seguroAnual,
    manutencaoMensal,
    valorRevendaEstimado,
    risco,
  } = entrada
  const { horizonteMeses, taxaCustoOportunidadeAnual, kmAno, consumoKmL, precoCombustivel } = comum

  if (horizonteMeses <= 0) {
    throw new Error('horizonteMeses precisa ser maior que zero')
  }

  const valorFinanciado = Math.max(precoVeiculo - valorEntrada, 0)
  const taxaMensal = taxaJurosMensal / 100
  const parcela = calcularParcelaPrice(valorFinanciado, taxaMensal, numeroParcelas)

  const parcelasPagasNoHorizonte = Math.min(horizonteMeses, numeroParcelas)
  const custoParcelas = parcela * parcelasPagasNoHorizonte

  const saldoDevedor =
    horizonteMeses < numeroParcelas
      ? calcularSaldoDevedor(parcela, taxaMensal, numeroParcelas, horizonteMeses)
      : 0

  const anos = horizonteMeses / 12
  const custoIpva = ipvaAnual * anos
  const custoSeguro = seguroAnual * anos
  const custoManutencao = manutencaoMensal * fatorManutencaoPorKm(kmAno) * horizonteMeses
  const custoCombustivelMensal = calcularCustoCombustivelMensal(kmAno, consumoKmL, precoCombustivel)
  const custoCombustivel = custoCombustivelMensal * horizonteMeses

  // Custo de oportunidade: dinheiro da entrada que deixou de render à
  // taxaCustoOportunidadeAnual, pró-rata pelo horizonte (juros simples).
  const custoOportunidade = valorEntrada * (taxaCustoOportunidadeAnual / 100) * anos

  const margem = getFaixaRisco(risco)
  const valorRevendaMin = valorRevendaEstimado * (1 - margem)
  const valorRevendaMax = valorRevendaEstimado * (1 + margem)

  const custosFixos =
    valorEntrada + custoParcelas + custoIpva + custoSeguro + custoManutencao + custoCombustivel + custoOportunidade + saldoDevedor

  const custoTotal = custosFixos - valorRevendaEstimado
  const custoTotalMin = custosFixos - valorRevendaMax // melhor revenda -> menor custo
  const custoTotalMax = custosFixos - valorRevendaMin // pior revenda -> maior custo

  return {
    custoMensalLiquido: custoTotal / horizonteMeses,
    custoMensalMin: custoTotalMin / horizonteMeses,
    custoMensalMax: custoTotalMax / horizonteMeses,
    custoTotal,
    saldoDevedor,
    valorRecuperado: valorRevendaEstimado,
    custoCombustivelMensal,
  }
}

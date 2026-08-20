import { describe, it, expect } from 'vitest'
import { calcularComprar } from './comprar'
import { calcularLocar } from './locar'
import { calcularAssinar } from './assinar'
import { getFaixaRisco } from './risco'
import { calcularCustoCombustivelMensal } from './combustivel'
import type { EntradaComum, EntradaComprar, EntradaLocar, EntradaAssinar } from './types'

describe('getFaixaRisco', () => {
  it('retorna as margens da tabela no modo manual', () => {
    expect(getFaixaRisco({ modo: 'manual', nivel: 'baixo' })).toBeCloseTo(0.05)
    expect(getFaixaRisco({ modo: 'manual', nivel: 'medio' })).toBeCloseTo(0.1)
    expect(getFaixaRisco({ modo: 'manual', nivel: 'alto' })).toBeCloseTo(0.18)
  })

  it('retorna as margens reais do Índice GSA no modo automático por categoria', () => {
    expect(getFaixaRisco({ modo: 'automatico', categoria: 'popular' })).toBeCloseTo(0.0183)
    expect(getFaixaRisco({ modo: 'automatico', categoria: 'intermediario' })).toBeCloseTo(0.0207)
    expect(getFaixaRisco({ modo: 'automatico', categoria: 'premium' })).toBeCloseTo(0.0259)
    expect(getFaixaRisco({ modo: 'automatico', categoria: 'eletrico' })).toBeCloseTo(0.0293)
  })
})

describe('calcularComprar', () => {
  it('calcula um cenário à vista (sem financiamento)', () => {
    const comum: EntradaComum = { horizonteMeses: 12, taxaCustoOportunidadeAnual: 10, kmAno: 15000, consumoKmL: null, precoCombustivel: null }
    const entrada: EntradaComprar = {
      precoVeiculo: 60000,
      valorEntrada: 60000,
      numeroParcelas: 0,
      taxaJurosMensal: 0,
      ipvaAnual: 1200,
      seguroAnual: 2400,
      manutencaoMensal: 100,
      valorRevendaEstimado: 54000,
      risco: { modo: 'manual', nivel: 'baixo' },
    }

    const resultado = calcularComprar(entrada, comum)

    // custosFixos = 60000 (entrada) + 0 (parcelas) + 1200 (ipva) + 2400 (seguro)
    //   + 1200 (manutenção 100*12) + 6000 (oportunidade 60000*10%*1 ano) + 0 (saldo)
    // custoTotal = 70800 - 54000 (revenda) = 16800
    expect(resultado.saldoDevedor).toBe(0)
    expect(resultado.valorRecuperado).toBe(54000)
    expect(resultado.custoTotal).toBeCloseTo(16800)
    expect(resultado.custoMensalLiquido).toBeCloseTo(1400)
  })

  it('calcula saldo devedor quando o horizonte é menor que o número de parcelas', () => {
    const comum: EntradaComum = { horizonteMeses: 12, taxaCustoOportunidadeAnual: 0, kmAno: 15000, consumoKmL: null, precoCombustivel: null }
    const entrada: EntradaComprar = {
      precoVeiculo: 50000,
      valorEntrada: 10000,
      numeroParcelas: 48,
      taxaJurosMensal: 1.5,
      ipvaAnual: 0,
      seguroAnual: 0,
      manutencaoMensal: 0,
      valorRevendaEstimado: 40000,
      risco: { modo: 'automatico', categoria: 'popular' },
    }

    const resultado = calcularComprar(entrada, comum)

    expect(resultado.saldoDevedor).toBeGreaterThan(0)
    expect(resultado.saldoDevedor!).toBeLessThan(40000)
  })
})

describe('calcularLocar', () => {
  it('calcula o custo total como mensalidade x horizonte', () => {
    const comum: EntradaComum = { horizonteMeses: 24, taxaCustoOportunidadeAnual: 10, kmAno: 15000, consumoKmL: null, precoCombustivel: null }
    const entrada: EntradaLocar = {
      mensalidade: 2500,
      kmMensalIncluso: 2000,
      valorMultaKmExcedente: 1.5,
      multaRescisao: 3000,
    }

    const resultado = calcularLocar(entrada, comum)

    expect(resultado.custoTotal).toBe(60000)
    expect(resultado.custoMensalLiquido).toBe(2500)
    expect(resultado.custoMensalMin).toBe(2500)
    expect(resultado.custoMensalMax).toBe(2500)
  })
})

describe('calcularAssinar', () => {
  it('dilui o prazo mínimo no custo mensal quando o horizonte é menor', () => {
    const comum: EntradaComum = { horizonteMeses: 6, taxaCustoOportunidadeAnual: 10, kmAno: 15000, consumoKmL: null, precoCombustivel: null }
    const entrada: EntradaAssinar = {
      mensalidade: 3000,
      kmMensalIncluso: 3000,
      prazoMinimoMeses: 12,
    }

    const resultado = calcularAssinar(entrada, comum)

    // ainda paga os 12 meses do prazo mínimo, diluídos nos 6 meses do horizonte
    expect(resultado.custoTotal).toBe(36000)
    expect(resultado.custoMensalLiquido).toBe(6000)
  })
})

describe('custo de combustível por quilometragem', () => {
  const comprar: EntradaComprar = {
    precoVeiculo: 0,
    valorEntrada: 0,
    numeroParcelas: 0,
    taxaJurosMensal: 0,
    ipvaAnual: 0,
    seguroAnual: 0,
    manutencaoMensal: 0,
    valorRevendaEstimado: 0,
    risco: { modo: 'manual', nivel: 'medio' },
  }
  const locar: EntradaLocar = {
    mensalidade: 0,
    kmMensalIncluso: 0,
    valorMultaKmExcedente: 0,
    multaRescisao: 0,
  }
  const assinar: EntradaAssinar = {
    mensalidade: 0,
    kmMensalIncluso: 0,
    prazoMinimoMeses: 0,
  }

  it('aplica o mesmo custo de combustível aos três cenários', () => {
    const comum: EntradaComum = {
      horizonteMeses: 12,
      taxaCustoOportunidadeAnual: 0,
      kmAno: 15000,
      consumoKmL: 10,
      precoCombustivel: 6,
    }

    const resultados = [
      calcularComprar(comprar, comum),
      calcularLocar(locar, comum),
      calcularAssinar(assinar, comum),
    ]

    expect(resultados.map((resultado) => resultado.custoCombustivelMensal)).toEqual([750, 750, 750])
  })

  it('faz 60.000 km/ano custarem exatamente dez vezes 6.000 km/ano', () => {
    const custoBaixo = calcularCustoCombustivelMensal(6000, 10, 6)
    const custoAlto = calcularCustoCombustivelMensal(60000, 10, 6)

    expect(custoAlto).toBe(custoBaixo * 10)
  })

  it('retorna zero quando o consumo é zero, sem produzir NaN', () => {
    const custo = calcularCustoCombustivelMensal(15000, 0, 6)

    expect(custo).toBe(0)
    expect(Number.isNaN(custo)).toBe(false)
  })
})

describe('sensibilidade da manutenção à quilometragem', () => {
  const comprar: EntradaComprar = {
    precoVeiculo: 0,
    valorEntrada: 0,
    numeroParcelas: 0,
    taxaJurosMensal: 0,
    ipvaAnual: 0,
    seguroAnual: 0,
    manutencaoMensal: 100,
    valorRevendaEstimado: 0,
    risco: { modo: 'manual', nivel: 'medio' },
  }
  const locar: EntradaLocar = {
    mensalidade: 100,
    kmMensalIncluso: 0,
    valorMultaKmExcedente: 0,
    multaRescisao: 0,
  }
  const assinar: EntradaAssinar = {
    mensalidade: 100,
    kmMensalIncluso: 0,
    prazoMinimoMeses: 12,
  }
  const comum = (kmAno: number): EntradaComum => ({
    horizonteMeses: 12,
    taxaCustoOportunidadeAnual: 0,
    kmAno,
    consumoKmL: null,
    precoCombustivel: null,
  })

  it('escala Comprar, mas não altera Locar nem Assinar', () => {
    const comprarBaixo = calcularComprar(comprar, comum(6000))
    const comprarAlto = calcularComprar(comprar, comum(60000))
    const locarBaixo = calcularLocar(locar, comum(6000))
    const locarAlto = calcularLocar(locar, comum(60000))
    const assinarBaixo = calcularAssinar(assinar, comum(6000))
    const assinarAlto = calcularAssinar(assinar, comum(60000))

    expect(comprarAlto.custoTotal).toBe(comprarBaixo.custoTotal * 10)
    expect(locarAlto.custoTotal).toBe(locarBaixo.custoTotal)
    expect(assinarAlto.custoTotal).toBe(assinarBaixo.custoTotal)
  })
})

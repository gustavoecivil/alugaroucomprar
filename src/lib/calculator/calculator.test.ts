import { describe, it, expect } from 'vitest'
import { calcularComprar } from './comprar'
import { calcularLocar } from './locar'
import { calcularAssinar } from './assinar'
import { getFaixaRisco } from './risco'
import type { EntradaComum, EntradaComprar, EntradaLocar, EntradaAssinar } from './types'

describe('getFaixaRisco', () => {
  it('retorna as margens da tabela no modo manual', () => {
    expect(getFaixaRisco({ modo: 'manual', nivel: 'baixo' })).toBeCloseTo(0.05)
    expect(getFaixaRisco({ modo: 'manual', nivel: 'medio' })).toBeCloseTo(0.1)
    expect(getFaixaRisco({ modo: 'manual', nivel: 'alto' })).toBeCloseTo(0.18)
  })

  it('retorna as margens da tabela no modo automático por categoria', () => {
    expect(getFaixaRisco({ modo: 'automatico', categoria: 'popular' })).toBeCloseTo(0.05)
    expect(getFaixaRisco({ modo: 'automatico', categoria: 'intermediario' })).toBeCloseTo(0.1)
    expect(getFaixaRisco({ modo: 'automatico', categoria: 'premium' })).toBeCloseTo(0.18)
    expect(getFaixaRisco({ modo: 'automatico', categoria: 'eletrico' })).toBeCloseTo(0.15)
  })
})

describe('calcularComprar', () => {
  it('calcula um cenário à vista (sem financiamento)', () => {
    const comum: EntradaComum = { horizonteMeses: 12, taxaCustoOportunidadeAnual: 10 }
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
    const comum: EntradaComum = { horizonteMeses: 12, taxaCustoOportunidadeAnual: 0 }
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
    const comum: EntradaComum = { horizonteMeses: 24, taxaCustoOportunidadeAnual: 10 }
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
    const comum: EntradaComum = { horizonteMeses: 6, taxaCustoOportunidadeAnual: 10 }
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

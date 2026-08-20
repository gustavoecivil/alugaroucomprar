/**
 * Calcula o custo mensal de combustível ou energia.
 * Para veículos elétricos, precoCombustivel representa a tarifa em R$/kWh
 * e consumoKmL representa km/kWh; a mesma fórmula permanece válida.
 */
/** Quantidade de meses usada para converter a quilometragem anual em mensal. */
export const MESES_POR_ANO = 12

export function calcularCustoCombustivelMensal(
  kmAno: number,
  consumoKmL: number | null | undefined,
  precoCombustivel: number | null | undefined,
): number {
  if (!kmAno || kmAno <= 0 || !consumoKmL || consumoKmL <= 0 || precoCombustivel == null || precoCombustivel < 0) {
    return 0
  }

  return (kmAno / MESES_POR_ANO / consumoKmL) * precoCombustivel
}

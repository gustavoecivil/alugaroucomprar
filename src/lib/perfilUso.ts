export type PerfilUso = 'particular' | 'app' | 'fimdesemana' | 'trabalho'

export const KM_ANO: Record<PerfilUso, number> = {
  particular: 15000,
  app: 60000,
  fimdesemana: 6000,
  trabalho: 30000,
}

export const PERFIL_LABELS: Record<PerfilUso, string> = {
  particular: 'Uso particular',
  app: 'Motorista de app (Uber/99)',
  fimdesemana: 'Só fim de semana',
  trabalho: 'Trabalho / campo',
}

export const PERFIL_DESCRICAO: Record<PerfilUso, string> = {
  particular: '~15.000 km/ano — casa, trabalho, lazer',
  app: '~60.000 km/ano — uso intensivo, desvalorização acelerada',
  fimdesemana: '~6.000 km/ano — carro parado a maior parte do tempo',
  trabalho: '~30.000 km/ano — deslocamento profissional frequente',
}

/**
 * Quilometragem anual de referência.
 * A manutenção informada pelo usuário (ou vinda do Índice GSA) assume
 * este uso médio. Rodar acima ou abaixo escala o custo proporcionalmente.
 */
export const KM_ANO_REFERENCIA = 15000

export function fatorManutencaoPorKm(kmAno: number): number {
  if (!kmAno || kmAno <= 0) return 1
  return kmAno / KM_ANO_REFERENCIA
}

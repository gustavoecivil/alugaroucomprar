"""
Exporta um snapshot estatico do risco de sinistro/roubo (SUSEP) por
categoria de veiculo (popular/intermediario/premium/eletrico), a partir
do JSON ja calculado no projeto indice-gsa-veicular (repositorio
separado, mesmo autor), pra public/dados/risco-susep.json aqui no
alugaroucomprar.

Mesmo padrao ja usado pro combustivel da ANP, consumo do INMETRO e
tarifa eletrica da ANEEL: exportar um snapshot estatico, sem conectar os
projetos em tempo real. Diferente dos outros, le direto o JSON de saida
de scripts/analise/calcular_risco_susep.py (nao o DuckDB) — o calculo em
si (cruzamento AUTOSEG/IVR com a categoria de preco) ja foi feito la.

Fonte tem, por categoria, varios indicadores (sinistralidade geral via
AUTOSEG, indice de roubo/furto via AUTOSEG, indice de roubo/furto via
IVR, tamanho de amostra de cada um). O valor exportado aqui e
especificamente o indice_roubo_furto_pct_ivr — o indice de Roubo/Furto
publicado pela propria ferramenta oficial da SUSEP (IVR), nao a
sinistralidade geral do AUTOSEG (que inclui causas nao correlacionadas —
vidro, assistencia 24h etc — e nao tem uma segunda fonte pra
cross-check). Convertido de "pontos percentuais" (ex: 4.8798) pra fracao
decimal (0.048798), no mesmo padrao de risco_categoria.json.

Cada categoria exporta { valor, amostraModelosIvr } — nao so o numero.
O tamanho de amostra (quantos modelos do IVR entraram na media daquela
categoria) vai junto de proposito: a categoria eletrico tem so 1 modelo
no IVR (14 veiculos expostos), entao o "valor" dela e literalmente 0 por
falta de dado, nao porque o risco real seja zero. Sem o tamanho de
amostra, a UI nao tem como distinguir "risco medido como zero" de "risco
nao medido ainda" — ver SimuladorForm.tsx, que usa amostraModelosIvr pra
mostrar "dado insuficiente" em vez de "0%" quando a amostra for pequena
demais.

Ver docs/METODOLOGIA_RISCO_SUSEP.md no indice-gsa-veicular para o
detalhamento completo: os numeros de AUTOSEG e IVR discordam em
magnitude (~7-13x) por serem de periodos diferentes.

Requer o pacote "duckdb" nao e necessario aqui (le o JSON direto, nao o
banco) — mas usa o mesmo venv do indice-gsa-veicular por convencao.

Uso:
    D:\\indice-gsa-veicular\\venv\\Scripts\\python.exe scripts\\exportar_risco_susep.py
"""

from __future__ import annotations

import json
from pathlib import Path

SOURCE_PATH = Path(r"D:\indice-gsa-veicular\data\processed\risco_susep_categoria.json")
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "public" / "dados" / "risco-susep.json"

CATEGORIAS = ["popular", "intermediario", "premium", "eletrico"]


def main() -> None:
    if not SOURCE_PATH.exists():
        raise SystemExit(
            f"[erro] JSON do indice-gsa-veicular nao encontrado em {SOURCE_PATH} — "
            "confira se o outro projeto esta no mesmo caminho e ja rodou "
            "scripts/analise/calcular_risco_susep.py."
        )

    with open(SOURCE_PATH, "r", encoding="utf-8") as f:
        fonte = json.load(f)

    faltando = [categoria for categoria in CATEGORIAS if categoria not in fonte]
    if faltando:
        raise SystemExit(f"[erro] categorias ausentes no JSON fonte: {faltando}")

    dados = {}
    for categoria in CATEGORIAS:
        pct = fonte[categoria]["indice_roubo_furto_pct_ivr"]
        dados[categoria] = {
            "valor": round(pct / 100, 6),
            "amostraModelosIvr": fonte[categoria]["modelos_ivr"],
        }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")

    print(f"[info] {len(dados)} categorias exportadas para {OUTPUT_PATH}")
    for categoria in CATEGORIAS:
        entrada = dados[categoria]
        print(f"  {categoria}: {entrada['valor'] * 100:.4f}% (amostra IVR: {entrada['amostraModelosIvr']} modelos)")


if __name__ == "__main__":
    main()

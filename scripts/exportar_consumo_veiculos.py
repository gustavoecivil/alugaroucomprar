"""
Exporta um snapshot estatico do consumo real (km/l) por veiculo, cruzando
fipe_pbev_match (INMETRO/PBEV casado com FIPE) do projeto
indice-gsa-veicular (repositorio separado, mesmo autor), pra
public/dados/consumo-veiculos.json aqui no alugaroucomprar.

O match do indice-gsa-veicular e feito por marca+modelo FIPE (o PBEV nao
tem codigo de ano), entao a chave do JSON e "{codigo_marca_fipe}-
{codigo_modelo_fipe}" -- os mesmos codigos que FipeAutofill.tsx ja tem em
maos assim que marca e modelo sao escolhidos (mesma numeracao da API
parallelum /brands e /models). Veiculos eletricos (sem km/l equivalente)
e marca/modelo sem match no INMETRO (confianca = "sem_match") ficam de
fora do JSON -- o consumo so aparece quando ha correspondencia real.

Quando ha mais de um registro INMETRO casado com a mesma marca+modelo
(motorizacoes/versoes diferentes), o consumo exportado e a media entre
eles, pra dar uma estimativa unica por marca+modelo.

Script solto, nao faz parte do build do site — roda uma vez (ou sempre
que quiser atualizar o snapshot) pra gerar o JSON estatico que
FipeAutofill.tsx consome via fetch. Nao ha conexao em tempo real entre
os dois projetos (mesmo padrao de scripts/exportar_precos_combustivel.py).

Requer o pacote "duckdb" (ja instalado no venv do indice-gsa-veicular).

Uso:
    C:\\Users\\gusta\\indice-gsa-veicular\\venv\\Scripts\\python.exe scripts\\exportar_consumo_veiculos.py
"""

from __future__ import annotations

import json
from pathlib import Path

import duckdb

DB_PATH = Path(r"D:\indice-gsa-veicular\data\processed\indice_gsa.duckdb")
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "public" / "dados" / "consumo-veiculos.json"


def main() -> None:
    if not DB_PATH.exists():
        raise SystemExit(
            f"[erro] DuckDB do indice-gsa-veicular nao encontrado em {DB_PATH} — "
            "confira se o outro projeto esta no mesmo caminho e ja rodou o match "
            "fipe_pbev_match (scripts de ingestao do INMETRO/PBEV)."
        )

    con = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        linhas = con.execute(
            """
            SELECT
                m.codigo_marca_fipe,
                m.codigo_modelo_fipe,
                m.confianca,
                AVG((c.consumo_cidade_km_l + c.consumo_estrada_km_l) / 2) AS consumo_km_l
            FROM fipe_pbev_match m
            JOIN inmetro_consumo_veiculos c ON c.id = m.inmetro_id
            WHERE m.confianca != 'sem_match'
              AND c.consumo_cidade_km_l IS NOT NULL
              AND c.consumo_estrada_km_l IS NOT NULL
            GROUP BY m.codigo_marca_fipe, m.codigo_modelo_fipe, m.confianca
            ORDER BY m.codigo_marca_fipe, m.codigo_modelo_fipe
            """
        ).fetchall()
    finally:
        con.close()

    if not linhas:
        raise SystemExit(
            "[erro] nenhuma linha com consumo valido encontrada cruzando "
            "fipe_pbev_match com inmetro_consumo_veiculos."
        )

    dados: dict[str, dict[str, float | str]] = {}
    for codigo_marca, codigo_modelo, confianca, consumo_km_l in linhas:
        chave = f"{codigo_marca}-{codigo_modelo}"
        dados[chave] = {
            "consumo_km_l": round(float(consumo_km_l), 1),
            "confianca_match": confianca,
        }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")

    print(f"[info] {len(dados)} veiculos (marca-modelo) exportados para {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

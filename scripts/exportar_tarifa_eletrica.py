"""
Exporta um snapshot estatico da tarifa residencial de energia eletrica
(TE, R$/kWh) media por UF, a partir do DuckDB do projeto
indice-gsa-veicular (repositorio separado, mesmo autor), pra
public/dados/tarifa-eletrica.json aqui no alugaroucomprar.

Mesmo padrao ja usado pro combustivel da ANP (exportar_precos_combustivel.py)
e pro consumo do INMETRO (exportar_consumo_veiculos.py): exportar um
snapshot estatico, sem conectar os projetos em tempo real.

A tabela fonte (aneel_tarifa_residencial) tem uma linha por distribuidora
de energia — varias UFs tem mais de uma distribuidora (cooperativas
rurais pequenas, sobretudo em SC e RS). A tarifa exportada aqui e a
MEDIA SIMPLES entre as distribuidoras de cada UF, sem ponderar por numero
de consumidores atendidos — ver docs/FONTES.md no indice-gsa-veicular pra
detalhamento completo dessa limitacao.

Requer o pacote "duckdb" (ja instalado no venv do indice-gsa-veicular).

Uso:
    C:\\Users\\gusta\\indice-gsa-veicular\\venv\\Scripts\\python.exe scripts\\exportar_tarifa_eletrica.py
"""

from __future__ import annotations

import json
from pathlib import Path

import duckdb

DB_PATH = Path(r"D:\indice-gsa-veicular\data\processed\indice_gsa.duckdb")
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "public" / "dados" / "tarifa-eletrica.json"


def main() -> None:
    if not DB_PATH.exists():
        raise SystemExit(
            f"[erro] DuckDB do indice-gsa-veicular nao encontrado em {DB_PATH} — "
            "confira se o outro projeto esta no mesmo caminho e ja rodou a ingestao "
            "da ANEEL (scripts/ingestao/aneel_tarifas.py)."
        )

    con = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        linhas = con.execute(
            """
            SELECT uf, AVG(tarifa_te_reais_kwh) AS tarifa_media
            FROM aneel_tarifa_residencial
            GROUP BY uf
            ORDER BY uf
            """
        ).fetchall()
    finally:
        con.close()

    if not linhas:
        raise SystemExit(
            "[erro] nenhuma linha encontrada em aneel_tarifa_residencial — rode a "
            "ingestao da ANEEL antes (scripts/ingestao/aneel_tarifas.py)."
        )

    dados = {uf: round(float(tarifa_media), 4) for uf, tarifa_media in linhas}

    faltando = sorted(
        set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split())
        - dados.keys()
    )
    if faltando:
        print(f"[aviso] UFs sem tarifa eletrica: {faltando}")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")

    print(f"[info] {len(dados)} UFs exportadas para {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

"""
Exporta um snapshot estatico do preco mais recente de gasolina e etanol
por UF, a partir do DuckDB do projeto indice-gsa-veicular (repositorio
separado, mesmo autor), pra public/dados/precos-combustivel.json aqui no
alugaroucomprar.

Script solto, nao faz parte do build do site — roda uma vez (ou sempre
que quiser atualizar o snapshot) pra gerar o JSON estatico que o
CombustivelAutofill.tsx consome via fetch. Nao ha conexao em tempo real
entre os dois projetos: o alugaroucomprar e um site estatico (Netlify) e
nao teria como acessar aquele DuckDB local em producao.

Requer o pacote "duckdb" (ja instalado no venv do indice-gsa-veicular).

Uso:
    C:\\Users\\gusta\\indice-gsa-veicular\\venv\\Scripts\\python.exe scripts\\exportar_precos_combustivel.py
"""

from __future__ import annotations

import json
from pathlib import Path

import duckdb

DB_PATH = Path(r"C:\Users\gusta\indice-gsa-veicular\data\processed\indice_gsa.duckdb")
OUTPUT_PATH = Path(__file__).resolve().parents[1] / "public" / "dados" / "precos-combustivel.json"

FUEL_MAP = {
    "gasolina": "GASOLINA COMUM",
    "etanol": "ETANOL HIDRATADO",
}


def main() -> None:
    if not DB_PATH.exists():
        raise SystemExit(
            f"[erro] DuckDB do indice-gsa-veicular nao encontrado em {DB_PATH} — "
            "confira se o outro projeto esta no mesmo caminho e ja rodou a "
            "ingestao da ANP (scripts/ingestao/anp.py)."
        )

    con = duckdb.connect(str(DB_PATH), read_only=True)
    try:
        dados: dict[str, dict[str, float | str]] = {}

        for chave_saida, tipo_combustivel in FUEL_MAP.items():
            linhas = con.execute(
                """
                SELECT uf, preco_medio, semana_referencia
                FROM anp_precos_combustivel
                WHERE tipo_combustivel = ?
                QUALIFY semana_referencia = MAX(semana_referencia) OVER (PARTITION BY uf)
                ORDER BY uf
                """,
                [tipo_combustivel],
            ).fetchall()

            if not linhas:
                raise SystemExit(
                    f"[erro] nenhuma linha encontrada pra '{tipo_combustivel}' em "
                    "anp_precos_combustivel — rode a ingestao da ANP antes."
                )

            for uf, preco_medio, semana_referencia in linhas:
                dados.setdefault(uf, {})[chave_saida] = round(float(preco_medio), 2)
                dados[uf]["semana_referencia"] = semana_referencia.isoformat()
    finally:
        con.close()

    faltando = [
        uf for uf, valores in dados.items() if "gasolina" not in valores or "etanol" not in valores
    ]
    if faltando:
        print(f"[aviso] UFs sem os dois combustiveis (gasolina e etanol): {faltando}")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(dados, f, ensure_ascii=False, indent=2, sort_keys=True)
        f.write("\n")

    print(f"[info] {len(dados)} UFs exportadas para {OUTPUT_PATH}")


if __name__ == "__main__":
    main()

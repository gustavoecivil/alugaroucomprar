import type { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
  const { marca, modelo, ano } = event.queryStringParameters ?? {};
  if (!marca || !modelo || !ano) return { statusCode: 400, body: JSON.stringify({ error: "missing params" }) };

  try {
    const res = await fetch(`https://fipe.parallelum.com.br/api/v2/cars/brands/${marca}/models/${modelo}/years/${ano}`);
    const data = await res.json()
    return { statusCode: 200, headers: { "content-type": "application/json" }, body: JSON.stringify(data) }
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: "fipe_unavailable" }) }
  }
}

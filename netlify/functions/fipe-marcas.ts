import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  try {
    const res = await fetch("https://fipe.parallelum.com.br/api/v2/cars/brands");
    const data = await res.json()
    return { statusCode: 200, headers: { "cache-control": "public, max-age=2592000", "content-type": "application/json" }, body: JSON.stringify(data) }
  } catch {
    return { statusCode: 502, body: JSON.stringify({ error: "fipe_unavailable" }) }
  }
}

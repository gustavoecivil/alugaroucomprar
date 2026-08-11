const FIPE_BASE = 'https://fipe.parallelum.com.br/api/v2/cars'

export default async () => {
  try {
    const res = await fetch(`${FIPE_BASE}/brands`)
    if (!res.ok) throw new Error('fipe_unavailable')
    const data = await res.json()

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=2592000',
      },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'fipe_unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

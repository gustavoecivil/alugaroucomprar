const FIPE_BASE = 'https://fipe.parallelum.com.br/api/v2/cars'

export default async (req: Request) => {
  const marca = new URL(req.url).searchParams.get('marca')
  if (!marca) {
    return new Response(JSON.stringify({ error: 'missing_marca' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const res = await fetch(`${FIPE_BASE}/brands/${marca}/models`)
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

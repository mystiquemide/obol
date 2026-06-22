// MusicBrainz artist resolution

export interface ResolvedArtist {
  musicBrainzId: string
  name: string
  sortName: string
}

const MB_BASE = "https://musicbrainz.org/ws/2"
const MB_HEADERS = {
  "User-Agent": "Obol/1.0 (obol.app; mide27145@gmail.com)",
  Accept: "application/json",
}

// Rate limit: MusicBrainz allows 1 req/sec for anonymous clients
let lastRequestTime = 0
async function rateLimitedFetch(url: string): Promise<Response> {
  const now = Date.now()
  const elapsed = now - lastRequestTime
  if (elapsed < 1100) {
    await new Promise((r) => setTimeout(r, 1100 - elapsed))
  }
  lastRequestTime = Date.now()
  return fetch(url, { headers: MB_HEADERS })
}

export async function resolveArtistByMbId(
  mbId: string
): Promise<ResolvedArtist | null> {
  try {
    const res = await rateLimitedFetch(`${MB_BASE}/artist/${mbId}?fmt=json`)
    if (!res.ok) return null
    const data = await res.json()
    return {
      musicBrainzId: data.id,
      name: data.name,
      sortName: data["sort-name"] ?? data.name,
    }
  } catch {
    return null
  }
}

export async function searchArtistByName(
  name: string
): Promise<ResolvedArtist | null> {
  try {
    const query = encodeURIComponent(`artist:"${name}"`)
    const res = await rateLimitedFetch(
      `${MB_BASE}/artist?query=${query}&limit=1&fmt=json`
    )
    if (!res.ok) return null
    const data = await res.json()
    const artists = data.artists ?? []
    if (artists.length === 0) return null
    const a = artists[0]
    return {
      musicBrainzId: a.id,
      name: a.name,
      sortName: a["sort-name"] ?? a.name,
    }
  } catch {
    return null
  }
}

export async function resolveArtist(
  name: string,
  mbId?: string | null
): Promise<ResolvedArtist | null> {
  if (mbId) {
    const result = await resolveArtistByMbId(mbId)
    if (result) return result
  }
  return searchArtistByName(name)
}

export interface ArtistCandidate {
  musicBrainzId: string
  name: string
  sortName: string
  disambiguation?: string
  type?: string
  country?: string
  score?: number
}

// Returns multiple candidate artists for a name so the agent can disambiguate.
export async function searchArtistCandidates(
  name: string,
  limit = 5
): Promise<ArtistCandidate[]> {
  try {
    const query = encodeURIComponent(`artist:"${name}"`)
    const res = await rateLimitedFetch(
      `${MB_BASE}/artist?query=${query}&limit=${limit}&fmt=json`
    )
    if (!res.ok) return []
    const data = await res.json()
    const artists = (data.artists ?? []) as Array<Record<string, unknown>>
    return artists.map((a) => ({
      musicBrainzId: String(a.id),
      name: String(a.name),
      sortName: String(a["sort-name"] ?? a.name),
      disambiguation: a.disambiguation ? String(a.disambiguation) : undefined,
      type: a.type ? String(a.type) : undefined,
      country: a.country ? String(a.country) : undefined,
      score: typeof a.score === "number" ? a.score : undefined,
    }))
  } catch {
    return []
  }
}

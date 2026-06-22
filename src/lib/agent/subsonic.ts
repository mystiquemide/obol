// Subsonic/Navidrome API client

export interface Scrobble {
  trackId: string
  title: string
  artist: string
  albumArtist: string
  musicBrainzId: string | null
  playedAt: Date
}

export async function fetchRecentScrobbles(
  url: string,
  user: string,
  pass: string,
  since?: Date
): Promise<Scrobble[]> {
  const params = new URLSearchParams({
    u: user,
    p: pass,
    v: "1.16.1",
    c: "obol",
    f: "json",
    count: "200",
  })
  if (since) {
    params.set("ifModifiedSince", since.getTime().toString())
  }

  const res = await fetch(`${url}/rest/getNowPlaying.view?${params}`)
  const data = await res.json()

  // Also fetch play history via getAlbumList
  const histParams = new URLSearchParams({
    u: user,
    p: pass,
    v: "1.16.1",
    c: "obol",
    f: "json",
    type: "recent",
    size: "50",
  })

  const histRes = await fetch(`${url}/rest/getAlbumList.view?${histParams}`)
  const histData = await histRes.json()

  return parseScrobbles(data, histData)
}

export async function fetchNowPlaying(
  url: string,
  user: string,
  pass: string
): Promise<Scrobble[]> {
  const params = new URLSearchParams({
    u: user,
    p: pass,
    v: "1.16.1",
    c: "obol",
    f: "json",
  })

  const res = await fetch(`${url}/rest/getNowPlaying.view?${params}`)
  const data = await res.json()
  const entries = data["subsonic-response"]?.nowPlaying?.entry ?? []

  return entries.map((e: Record<string, unknown>) => ({
    trackId: String(e.id),
    title: String(e.title ?? "Unknown"),
    artist: String(e.artist ?? "Unknown"),
    albumArtist: String(e.albumArtist ?? e.artist ?? "Unknown"),
    musicBrainzId: e.musicBrainzId ? String(e.musicBrainzId) : null,
    playedAt: new Date(),
  }))
}

export async function searchTracks(
  url: string,
  user: string,
  pass: string,
  query: string
): Promise<Scrobble[]> {
  const params = new URLSearchParams({
    u: user,
    p: pass,
    v: "1.16.1",
    c: "obol",
    f: "json",
    query,
    songCount: "10",
    albumCount: "0",
    artistCount: "0",
  })

  const res = await fetch(`${url}/rest/search3.view?${params}`)
  const data = await res.json()
  const songs = data["subsonic-response"]?.searchResult3?.song ?? []

  return songs.map((s: Record<string, unknown>) => ({
    trackId: String(s.id),
    title: String(s.title ?? "Unknown"),
    artist: String(s.artist ?? "Unknown"),
    albumArtist: String(s.albumArtist ?? s.artist ?? "Unknown"),
    musicBrainzId: s.musicBrainzId ? String(s.musicBrainzId) : null,
    playedAt: new Date(),
  }))
}

export async function getRandomTracks(
  url: string,
  user: string,
  pass: string,
  count = 10
): Promise<Scrobble[]> {
  const params = new URLSearchParams({
    u: user,
    p: pass,
    v: "1.16.1",
    c: "obol",
    f: "json",
    size: String(count),
  })

  const res = await fetch(`${url}/rest/getRandomSongs.view?${params}`)
  const data = await res.json()
  const songs = data["subsonic-response"]?.randomSongs?.song ?? []

  return songs.map((s: Record<string, unknown>) => ({
    trackId: String(s.id),
    title: String(s.title ?? "Unknown"),
    artist: String(s.artist ?? "Unknown"),
    albumArtist: String(s.albumArtist ?? s.artist ?? "Unknown"),
    musicBrainzId: s.musicBrainzId ? String(s.musicBrainzId) : null,
    playedAt: new Date(),
  }))
}

function parseScrobbles(
  _nowPlaying: Record<string, unknown>,
  _history: Record<string, unknown>
): Scrobble[] {
  return []
}

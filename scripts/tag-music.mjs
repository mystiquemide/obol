import NodeID3 from "node-id3"
import path from "path"

const musicDir = path.join("C:", "Users", "Prince", "Projects", "hackathons", "navidrome", "music", "Various Artists")

const tracks = [
  { file: path.join(musicDir, "01 - Kevin MacLeod - Cipher.mp3"),      title: "Cipher",      artist: "Kevin MacLeod", album: "Incompetech" },
  { file: path.join(musicDir, "02 - Kevin MacLeod - Atlantis.mp3"),    title: "Atlantis",    artist: "Kevin MacLeod", album: "Incompetech" },
  { file: path.join(musicDir, "03 - Kevin MacLeod - Destiny Day.mp3"), title: "Destiny Day", artist: "Kevin MacLeod", album: "Incompetech" },
]

for (const t of tracks) {
  const result = NodeID3.write({ title: t.title, artist: t.artist, album: t.album }, t.file)
  console.log(result === true ? `Tagged: ${t.title} by ${t.artist}` : `Failed: ${JSON.stringify(result)}`)
}

import 'dotenv/config'
import fetch from 'node-fetch'
import ytdl from 'ytdl-core'

const YT_API_KEY = process.env.YOUTUBE_API_KEY
let tempStorage = {}

// Función de búsqueda en YouTube usando API Key
async function searchYouTube(query) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&key=${YT_API_KEY}&maxResults=1`
  const res = await fetch(url)
  const data = await res.json()
  if (!data.items || data.items.length === 0) throw new Error('No se encontraron resultados')
  const video = data.items[0]
  return {
    title: video.snippet.title,
    url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
    thumbnail: video.snippet.thumbnails.high.url,
    channel: video.snippet.channelTitle
  }
}

// Handler principal
const handler = async (m, { conn, text, usedPrefix }) => {
  if (!text) return conn.reply(m.chat, `Usa: ${usedPrefix}play <nombre del audio>`, m)

  try {
    const video = await searchYouTube(text)
    tempStorage[m.sender] = { url: video.url, title: video.title }

    const caption = `
🎵 *Audio:* ${video.title}
👤 *Autor:* ${video.channel}
🔗 *Link:* ${video.url}

Presiona 🎶 para descargar.
`.trim()

    await conn.sendMessage(
      m.chat,
      {
        image: { url: video.thumbnail },
        caption,
        footer: '🌸 Mally Bot • Audio Only',
        buttons: [
          { buttonId: `.ytmp3 ${video.url}`, buttonText: { displayText: '🎶 Descargar Audio' }, type: 1 }
        ],
        headerType: 4
      },
      { quoted: m }
    )
  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, `❌ Error: ${e.message}`, m)
  }
}

// ======= Botón de descarga de audio =======
const ytmp3Handler = async (m, { conn, args }) => {
  const url = args[0]
  if (!url) return conn.reply(m.chat, '❌ URL no proporcionada', m)
  try {
    const info = await ytdl.getInfo(url)
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' })
    await conn.sendMessage(m.chat, { audio: { url: audioFormat.url }, mimetype: 'audio/mpeg' }, { quoted: m })
  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, '❌ Error al descargar el audio', m)
  }
}

ytmp3Handler.command = /^ytmp3$/i

handler.command = /^play$/i
handler.register = true
export default handler
export { ytmp3Handler }
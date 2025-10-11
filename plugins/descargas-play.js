// 📁 plugins/MIMI-Play.js
// 💜 MIMI ver. BTS — Reproductor y Descargador de Música estilo idol 🎶🌸

import 'dotenv/config'
import fetch from 'node-fetch'
import ytdl from 'ytdl-core'

const YT_API_KEY = process.env.YOUTUBE_API_KEY
if (!YT_API_KEY) console.warn('⚠️ No se encontró la variable YOUTUBE_API_KEY en .env 💔')

/* ================================
   🔍 FUNCIÓN: Buscar en YouTube
================================ */
async function searchYouTube(query) {
  if (!YT_API_KEY) throw new Error('API Key de YouTube no configurada 💢')
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(
    query
  )}&key=${YT_API_KEY}&maxResults=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Error en la solicitud a la API de YouTube 😿')
  const data = await res.json()
  if (!data.items || data.items.length === 0) throw new Error('No se encontraron resultados 💜')

  const video = data.items[0]
  return {
    title: video.snippet.title,
    url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
    thumbnail: video.snippet.thumbnails.high.url,
    channel: video.snippet.channelTitle
  }
}

/* ================================
   🎵 COMANDO: !play
================================ */
const handler = async (m, { conn, text, usedPrefix }) => {
  if (!text)
    return conn.reply(m.chat, `
🎤💜 *MIMI ver. BTS* está lista para cantar contigo~ 🌸

Usa el comando así:
${usedPrefix}play <nombre de la canción>

💡 Ejemplos:
• ${usedPrefix}play Butter BTS
• ${usedPrefix}play Love Dive Ive
• ${usedPrefix}play Super Shy New Jeans

✨ ¡Deja que MIMI encuentre tu melodía perfecta, oppa~! 🎶💜
    `.trim(), m)

  try {
    const video = await searchYouTube(text)
    const caption = `
🌸 *Canción encontrada por MIMI ver. BTS* 💜

🎶 *${video.title}*
👩‍🎤 *Canal:* ${video.channel}
🔗 *Link:* ${video.url}

💜 ¿Querés que te mande el audio, ne~? 🎧
`.trim()

    await conn.sendMessage(
      m.chat,
      {
        image: { url: video.thumbnail },
        caption,
        footer: '🎤 MIMI ver. BTS • Audio Only 💜',
        buttons: [
          {
            buttonId: JSON.stringify({ cmd: 'ytmp3', url: video.url }),
            buttonText: { displayText: '🎧 Descargar Audio (MP3)' },
            type: 1
          }
        ],
        headerType: 4
      },
      { quoted: m }
    )
  } catch (e) {
    console.error('💔 Error en búsqueda musical:', e)
    await conn.reply(m.chat, `😿 *Ups... algo falló, oppa~*\n🔧 Error: ${e.message}\n💜 Intenta otra canción, ne~ 🎶`, m)
  }
}

/* ================================
   ⬇️ BOTÓN: Descargar MP3
================================ */
const ytmp3Handler = async (m, { conn, args }) => {
  let url

  // Botón con JSON
  if (typeof m?.msg?.selectedButtonId === 'string') {
    try {
      const data = JSON.parse(m.msg.selectedButtonId)
      if (data.cmd === 'ytmp3') url = data.url
    } catch {}
  }

  // Argumento directo
  if (!url && args.length > 0) url = args[0]
  if (!url)
    return conn.reply(m.chat, '❌ No encontré ningún enlace válido, oppa~ 💔', m)

  try {
    if (!ytdl.validateURL(url)) throw new Error('URL no válida de YouTube 😿')

    const info = await ytdl.getInfo(url)
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' })

    // Validación de tamaño (para evitar archivos enormes)
    const contentLength = parseInt(format.contentLength || '0', 10)
    const fileSizeMB = contentLength / (1024 * 1024)
    if (fileSizeMB > 40)
      return conn.reply(m.chat, `⚠️ El archivo es demasiado grande (${fileSizeMB.toFixed(1)} MB) 💜`, m)

    await conn.sendMessage(
      m.chat,
      {
        audio: { url: format.url },
        mimetype: 'audio/mpeg',
        fileName: `${info.videoDetails.title}.mp3`
      },
      { quoted: m }
    )

    await conn.reply(m.chat, `🎶💜 ¡Listo! *MIMI te envió el audio con amor BTS~!* 🌸`, m)
  } catch (e) {
    console.error('Error en ytmp3Handler:', e)
    await conn.reply(m.chat, '❌ Error al descargar el audio 😿', m)
  }
}

handler.command = /^play$/i
ytmp3Handler.command = /^ytmp3$/i
export default handler
export { ytmp3Handler }
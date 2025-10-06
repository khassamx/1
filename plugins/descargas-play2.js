import yts from 'yt-search'
import fetch from 'node-fetch'
import ytdl from 'ytdl-core'

let tempStorage = {}

async function downloadAudio(url) {
  // Intentar ytdl primero
  try {
    const info = await ytdl.getInfo(url)
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' })
    return audioFormat.url
  } catch { return null }
}

async function downloadVideo(url) {
  try {
    const info = await ytdl.getInfo(url)
    const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' })
    return videoFormat.url
  } catch { return null }
}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return conn.reply(m.chat, `Usa: ${usedPrefix + command} <nombre del video>`, m)

  try {
    const searchResults = await yts(text)
    if (!searchResults.videos.length) throw new Error('No se encontraron resultados')

    const video = searchResults.videos[0]
    tempStorage[m.sender] = { url: video.url, title: video.title }

    const caption = `
🎬 *Título:* ${video.title}
👤 *Autor:* ${video.author.name}
⏱ *Duración:* ${video.timestamp}
🔗 *Link:* ${video.url}

Selecciona qué deseas descargar: 🎶 Audio | 📽 Video
`.trim()

    await conn.sendMessage(
      m.chat,
      {
        image: { url: video.thumbnail },
        caption,
        footer: '🌸 Mally Bot • Multi-API & Streaming',
        buttons: [
          { buttonId: `.ytmp3 ${video.url}`, buttonText: { displayText: '🎶 Audio' }, type: 1 },
          { buttonId: `.ytmp4 ${video.url}`, buttonText: { displayText: '📽 Video' }, type: 1 }
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

handler.before = async (m, { conn }) => {
  const text = m.text?.trim()?.toLowerCase()
  if (!['🎶','audio','📽','video'].includes(text)) return

  const userData = tempStorage[m.sender]
  if (!userData?.url) return

  try {
    const isAudio = text === '🎶' || text === 'audio'
    const url = userData.url
    let mediaUrl = isAudio ? await downloadAudio(url) : await downloadVideo(url)
    if (!mediaUrl) return conn.reply(m.chat, '❌ No se pudo obtener el enlace directo', m)

    // Enviar directamente desde URL (streaming)
    await conn.sendMessage(m.chat, isAudio ? { audio: { url: mediaUrl }, mimetype: 'audio/mpeg' } : { video: { url: mediaUrl }, mimetype: 'video/mp4', caption: `🎬 ${userData.title}` }, { quoted: m })
  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, '❌ Error al enviar el archivo', m)
  } finally {
    delete tempStorage[m.sender]
  }
}

handler.command = /^(play2)$/i
handler.register = true
export default handler
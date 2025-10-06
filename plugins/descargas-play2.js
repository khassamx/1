import yts from 'yt-search'
import ytdl from 'ytdl-core'

let tempStorage = {}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return conn.reply(m.chat, `Usa: ${usedPrefix + command} <nombre del video>`, m)

  try {
    const searchResults = await yts(text)
    if (!searchResults.videos.length) throw new Error('No se encontraron resultados')

    const video = searchResults.videos[0]
    tempStorage[m.sender] = { url: video.url, title: video.title }

    const caption = `
🎬 *Video:* ${video.title}
👤 *Autor:* ${video.author.name}
⏱ *Duración:* ${video.timestamp}
🔗 *Link:* ${video.url}

Presiona 📽 para descargar.
`.trim()

    await conn.sendMessage(
      m.chat,
      {
        image: { url: video.thumbnail },
        caption,
        footer: '🌸 Mally Bot • Video Only',
        buttons: [
          { buttonId: `.ytmp4 ${video.url}`, buttonText: { displayText: '📽 Descargar Video' }, type: 1 }
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

// ======= Botón de video =======
handler.before = async (m, { conn }) => {
  const text = m.text?.trim()?.toLowerCase()
  if (!['📽','video'].includes(text)) return

  const userData = tempStorage[m.sender]
  if (!userData?.url) return

  try {
    const url = userData.url
    const info = await ytdl.getInfo(url)
    const videoFormat = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' })
    await conn.sendMessage(m.chat, { video: { url: videoFormat.url }, mimetype: 'video/mp4', caption: `🎬 ${userData.title}` }, { quoted: m })
  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, '❌ No se pudo descargar el video', m)
  } finally {
    delete tempStorage[m.sender]
  }
}

handler.command = /^(play2)$/i
handler.register = true
export default handler
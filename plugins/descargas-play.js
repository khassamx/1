import yts from 'yt-search'
import ytdl from 'ytdl-core'

let tempStorage = {}

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return conn.reply(m.chat, `Usa: ${usedPrefix + command} <nombre de la canción>`, m)

  try {
    const searchResults = await yts(text)
    if (!searchResults.videos.length) throw new Error('No se encontraron resultados')

    const video = searchResults.videos[0]
    tempStorage[m.sender] = { url: video.url, title: video.title }

    const caption = `
🎵 *Audio de:* ${video.title}
👤 *Autor:* ${video.author.name}
⏱ *Duración:* ${video.timestamp}
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

// ======= Botón de audio =======
handler.before = async (m, { conn }) => {
  const text = m.text?.trim()?.toLowerCase()
  if (!['🎶','audio'].includes(text)) return

  const userData = tempStorage[m.sender]
  if (!userData?.url) return

  try {
    const url = userData.url
    const info = await ytdl.getInfo(url)
    const audioFormat = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' })
    await conn.sendMessage(m.chat, { audio: { url: audioFormat.url }, mimetype: 'audio/mpeg' }, { quoted: m })
  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, '❌ No se pudo descargar el audio', m)
  } finally {
    delete tempStorage[m.sender]
  }
}

handler.command = /^(play)$/i
handler.register = true
export default handler
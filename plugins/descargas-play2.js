import yts from 'yt-search'
import fetch from 'node-fetch'

// ▸ API Adonix
async function apiAdonix(url) {
  const apiURL = `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(url)}&apikey=sylphy-fbb9`
  const res = await fetch(apiURL)
  const data = await res.json()
  if (!data.status || !data.data?.url) throw new Error('API Adonix no devolvió datos válidos')
  return { url: data.data.url, title: data.data.title || 'Video sin título XD', fuente: 'Adonix' }
}

// ▸ API JoseDev
async function apiJoseDev(url) {
  const apiURL = `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(url)}&apikey=sylphy-fbb9`
  const res = await fetch(apiURL)
  const data = await res.json()
  if (!data.status || !data.res?.url) throw new Error('API JoseDev no devolvió datos válidos')
  return { url: data.res.url, title: data.res.title || 'Video sin título XD', fuente: 'JoseDev' }
}

// ▸ Intentar con Adonix primero, si falla usar JoseDev
async function ytdl(url) {
  try {
    console.log('🎬 Intentando con API Adonix...')
    return await apiAdonix(url)
  } catch (e1) {
    console.warn('⚠️ Falló Adonix:', e1.message)
    console.log('🎞️ Intentando con API JoseDev...')
    return await apiJoseDev(url)
  }
}

// ▸ Handler principal
let handler = async (m, { conn, text, usedPrefix }) => {
  const ctxErr = (global.rcanalx || {})
  const ctxWarn = (global.rcanalw || {})
  const ctxOk = (global.rcanalr || {})

  if (!text) {
    return conn.reply(m.chat, `Descargar Video

📝 Uso:
• ${usedPrefix}play2 <nombre de la canción>

💡 Ejemplo:
• ${usedPrefix}play2 spy x family opening

🎯 Formato:
🎥 Video MP4 de alta calidad

🍱 ¡Disfruta tus videos con Khassam!
`.trim(), m, ctxWarn)
  }

  try {
    await conn.reply(m.chat, '🎬 Khassam está buscando tu video...', m, ctxOk)

    const searchResults = await yts(text)
    if (!searchResults.videos.length) throw new Error('No se encontraron resultados')

    const video = searchResults.videos[0]
    const { url, title, fuente } = await ytdl(video.url)

    const caption = `
✨ ¡Khassam trae tu video! ✨
💖 Título: ${title}
⏱ Duración: ${video.timestamp}
👤 Autor: ${video.author.name}
🔗 URL: ${video.url}

🌐 Fuente: ${fuente}
¡Disfruta y no olvides sonreír!

> 🍱 Gracias por elegirme para tus descargas
`.trim()

    const buffer = await fetch(url).then(res => res.buffer())

    await conn.sendMessage(
      m.chat,
      {
        video: buffer,
        mimetype: 'video/mp4',
        fileName: `${title}.mp4`,
        caption
      },
      { quoted: m }
    )
  } catch (e) {
    console.error('❌ Error en play2:', e)
    await conn.reply(m.chat, `❌ Error: ${e.message}`, m, ctxErr)
  }
}

handler.help = ['play2 <nombre>']
handler.tags = ['descargas']
handler.command = ['play2']

export default handler
import yts from 'yt-search'
import fetch from 'node-fetch'

/* ================================
    🔹 DESCARGA CON API PRINCIPAL
================================ */
async function apiAdonix(url) {
  const api = `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(url)}&apikey=sylphy-fbb9`
  const res = await fetch(api)
  const data = await res.json()

  if (!data.status || !data.data?.url) throw new Error('La API Adonix no devolvió una URL válida')

  return {
    url: data.data.url,
    title: data.data.title || 'Video sin título',
    fuente: 'Adonix'
  }
}

/* ================================
    🔹 API DE RESPALDO
================================ */
async function apiBackup(url) {
  const api = `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`
  const res = await fetch(api)
  const data = await res.json()

  if (!data.status || !data.result?.url) throw new Error('La API Backup no devolvió datos válidos')

  return {
    url: data.result.url,
    title: data.result.title || 'Video sin título',
    fuente: 'Ryzendesu'
  }
}

/* ================================
    🔹 FUNCIÓN PRINCIPAL DE DESCARGA
================================ */
async function getVideo(url) {
  try {
    console.log('🎬 Probando API Adonix...')
    return await apiAdonix(url)
  } catch (err1) {
    console.warn('⚠️ Error con Adonix:', err1.message)
    console.log('🔁 Cambiando a API Backup...')
    return await apiBackup(url)
  }
}

/* ================================
    🔹 HANDLER DE COMANDO
================================ */
const handler = async (m, { conn, text, usedPrefix }) => {
  const ctxErr = global.rcanalx || {}
  const ctxWarn = global.rcanalw || {}
  const ctxOk = global.rcanalr || {}

  if (!text) {
    return conn.reply(m.chat, `
🎬 *Descargar Video de YouTube (MP4)*

📝 *Uso:*
${usedPrefix}play2 <nombre del video>

💡 *Ejemplo:*
${usedPrefix}play2 spy x family opening

📽️ *Formato:* MP4 (Alta calidad)
✨ *Bot:* Mally-AI 🎀
    `.trim(), m, ctxWarn)
  }

  try {
    await conn.reply(m.chat, '🔍 *Mally está buscando tu video...* 🎧', m, ctxOk)

    // Buscar en YouTube
    const search = await yts(text)
    if (!search.videos.length) throw new Error('No se encontraron resultados en YouTube.')

    const video = search.videos[0]
    const { url, title, fuente } = await getVideo(video.url)

    const caption = `
🎀 *Mally Bot - Video Encontrado* 🎀

💖 *Título:* ${title}
⏱️ *Duración:* ${video.timestamp}
👤 *Autor:* ${video.author.name}
🔗 *Enlace:* ${video.url}

🌐 *Fuente:* ${fuente}
💬 *Disfruta tu video con Mally 💫*
`.trim()

    // Descargar video
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
    await conn.reply(m.chat, `❌ *Error:* ${e.message}`, m, ctxErr)
  }
}

/* ================================
    🔹 METADATOS DEL COMANDO
================================ */
handler.help = ['play2 <nombre>']
handler.tags = ['descargas']
handler.command = ['play2']
handler.register = true

export default handler
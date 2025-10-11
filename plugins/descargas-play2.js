// 📁 plugins/MIMI-Play2.js
// 💜 MIMI ver. BTS — Descargador de Videos MP4 con encanto idol 🎬✨

import yts from 'yt-search'
import fetch from 'node-fetch'

// 🌸 API Adonix (primera opción)
async function apiAdonix(url) {
  const apiURL = `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(url)}&apikey=sylphy-fbb9`
  const res = await fetch(apiURL)
  if (!res.ok) throw new Error(`Error HTTP ${res.status}`)
  const data = await res.json()

  if (!data.status || !data.data?.url) throw new Error('😿 API Adonix no devolvió datos válidos')
  return {
    url: data.data.url,
    title: data.data.title || '💜 Video sin título~',
    fuente: 'Adonix'
  }
}

// 💜 API alternativa (JoseDev)
async function apiJoseDev(url) {
  const apiURL = `https://api.josedev.xyz/ytmp4?url=${encodeURIComponent(url)}`
  const res = await fetch(apiURL)
  if (!res.ok) throw new Error(`Error HTTP ${res.status}`)
  const data = await res.json()

  if (!data.status || !data.result?.url) throw new Error('😿 API JoseDev no devolvió datos válidos')
  return {
    url: data.result.url,
    title: data.result.title || '💜 Video sin título~',
    fuente: 'JoseDev'
  }
}

// 💫 Intentar con Adonix primero, luego JoseDev
async function ytdl(url) {
  try {
    console.log('🎬 MIMI está usando API Adonix 💜...')
    return await apiAdonix(url)
  } catch (e1) {
    console.warn('⚠️ Adonix falló:', e1.message)
    console.log('🎞️ Reintentando con API JoseDev 🌸...')
    return await apiJoseDev(url)
  }
}

// 🎤 Handler principal
let handler = async (m, { conn, text, usedPrefix }) => {
  const ctxErr = global.rcanalx || {}
  const ctxWarn = global.rcanalw || {}
  const ctxOk = global.rcanalr || {}

  if (!text) {
    return conn.reply(
      m.chat,
      `
💜 *MIMI ver. BTS — Descarga de Videos (MP4)* 🎬✨

🎶 Usa el comando así:
${usedPrefix}play2 <nombre o enlace>

💡 Ejemplos:
• ${usedPrefix}play2 BTS Dynamite  
• ${usedPrefix}play2 New Jeans Super Shy  
• ${usedPrefix}play2 Le Sserafim Easy

🎥 Formato: MP4 (alta calidad)  
🌸 MIMI te traerá el video con estilo idol~ 💫
      `.trim(),
      m,
      ctxWarn
    )
  }

  try {
    await conn.reply(m.chat, '🔍💜 MIMI está buscando tu video, espera un momento, oppa~ 🎶', m, ctxOk)

    const searchResults = await yts(text)
    if (!searchResults.videos.length) throw new Error('😿 No se encontraron resultados en YouTube 💔')

    const video = searchResults.videos[0]
    const { url, title, fuente } = await ytdl(video.url)

    const caption = `
🎬 *¡MIMI ver. BTS trajo tu video, oppa~!* 💜✨

🎵 *Título:* ${title}
👩‍🎤 *Canal:* ${video.author.name}
🕒 *Duración:* ${video.timestamp}
🔗 *Enlace:* ${video.url}

🌐 *Fuente:* ${fuente}
💜 *Disfruta tu video con energía idol!* 🎤🌸
    `.trim()

    // ⚖️ Verificar tamaño antes de enviar
    const head = await fetch(url, { method: 'HEAD' })
    const size = Number(head.headers.get('content-length') || 0)
    const mb = size / (1024 * 1024)
    if (mb > 80)
      throw new Error(`😿 El video pesa ${mb.toFixed(1)}MB — demasiado grande para enviar, oppa~ 💔`)

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

    await conn.reply(m.chat, '💜🎞️ ¡Video enviado con amor por MIMI ver. BTS~! 🌸', m)
  } catch (e) {
    console.error('❌ Error en play2:', e)
    await conn.reply(m.chat, `😿 *Error:* ${e.message}\n💜 MIMI intentará mejorarlo luego~ 🌷`, m, ctxErr)
  }
}

handler.help = ['play2 <nombre>']
handler.tags = ['descargas']
handler.command = ['play2']

export default handler
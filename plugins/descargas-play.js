import yts from 'yt-search'
import fetch from 'node-fetch'

/* ================================
   🔹 API PRINCIPAL (Akuari, más rápida)
================================ */
async function apiFast(url, type = 'mp3') {
  const endpoint = type === 'mp4' ? 'ytmp4' : 'ytmp3'
  const api = `https://api.akuari.my.id/downloader/${endpoint}?link=${encodeURIComponent(url)}`
  const res = await fetch(api)
  const data = await res.json()

  const result = data.hasil || data.result || {}
  if (!result.url) throw new Error('La API rápida no devolvió una URL válida')

  return {
    url: result.url,
    title: result.title || 'Sin título',
    fuente: 'Akuari.my.id'
  }
}

/* ================================
   🔹 RESPALDOS
================================ */
async function apiAdonix(url, type = 'mp3') {
  const endpoint = type === 'mp4' ? 'ytmp4' : 'ytmp3'
  const res = await fetch(`https://api.sylphy.xyz/download/${endpoint}?url=${encodeURIComponent(url)}&apikey=sylphy-fbb9`)
  const data = await res.json()
  if (!data.status || !data.data?.url) throw new Error('Adonix no devolvió datos válidos')
  return { url: data.data.url, title: data.data.title, fuente: 'Adonix' }
}

async function apiBackup(url, type = 'mp3') {
  const endpoint = type === 'mp4' ? 'ytmp4' : 'ytmp3'
  const res = await fetch(`https://api.ryzendesu.vip/api/downloader/${endpoint}?url=${encodeURIComponent(url)}`)
  const data = await res.json()
  if (!data.status || !data.result?.url) throw new Error('Backup no devolvió datos válidos')
  return { url: data.result.url, title: data.result.title, fuente: 'Ryzendesu' }
}

/* ================================
   🔹 DESCARGA PRINCIPAL
================================ */
async function getMedia(url, type = 'mp3') {
  try {
    console.log(`🚀 Intentando API rápida (${type})...`)
    return await apiFast(url, type)
  } catch (err1) {
    console.warn(`⚠️ Error API rápida:`, err1.message)
    try {
      console.log(`🎧 Intentando Adonix (${type})...`)
      return await apiAdonix(url, type)
    } catch (err2) {
      console.warn(`⚠️ Error Adonix:`, err2.message)
      console.log(`🔁 Último intento con Backup (${type})...`)
      return await apiBackup(url, type)
    }
  }
}

/* ================================
   🔹 HANDLER PRINCIPAL (INTERACTIVO)
================================ */
const handler = async (m, { conn, text, usedPrefix }) => {
  if (!text) {
    return conn.reply(m.chat, `
🎶 *Descargar de YouTube (Audio o Video rápido)*

📝 *Uso:*
${usedPrefix}play <nombre o enlace>

💡 *Ejemplo:*
${usedPrefix}play enemy imagine dragons

⚡ *Modo rápido activado*  
✨ *Bot:* Mally-AI 💖
`.trim(), m)
  }

  try {
    await conn.reply(m.chat, '🔍 *Mally está buscando tu video...* 🎧', m)

    const search = await yts(text)
    if (!search.videos.length) throw new Error('No se encontraron resultados en YouTube.')

    const video = search.videos[0]

    const caption = `
🎀 *Mally Bot - Resultado encontrado* 🎀

🎵 *Título:* ${video.title}
⏱️ *Duración:* ${video.timestamp}
👤 *Autor:* ${video.author.name}
🔗 *Enlace:* ${video.url}

💬 *Elige cómo quieres descargar:*
`.trim()

    await conn.sendMessage(m.chat, {
      image: { url: video.thumbnail },
      caption,
      footer: '⚡ Modo rápido: descargas en segundos ⚡',
      buttons: [
        { buttonId: `!play-fast-audio ${video.url}`, buttonText: { displayText: '🎧 Audio (Rápido)' }, type: 1 },
        { buttonId: `!play-fast-video ${video.url}`, buttonText: { displayText: '🎬 Video (Rápido)' }, type: 1 }
      ]
    }, { quoted: m })

  } catch (e) {
    console.error('❌ Error en play rápido:', e)
    await conn.reply(m.chat, `❌ *Error:* ${e.message}`, m)
  }
}

/* ================================
   🔹 SUBCOMANDOS DE DESCARGA RÁPIDA
================================ */
const playFastAudio = async (m, { conn, args }) => {
  const url = args[0]
  try {
    const { url: audioUrl, title, fuente } = await getMedia(url, 'mp3')
    await conn.sendFile(m.chat, audioUrl, `${title}.mp3`, `🎧 *${title}*\n🌐 Fuente: ${fuente}\n💖 *Mally-AI (Fast Mode)*`, m)
  } catch (e) {
    console.error('❌ Error al descargar audio:', e)
    await conn.reply(m.chat, `❌ *Error:* ${e.message}`, m)
  }
}

const playFastVideo = async (m, { conn, args }) => {
  const url = args[0]
  try {
    const { url: videoUrl, title, fuente } = await getMedia(url, 'mp4')
    await conn.sendFile(m.chat, videoUrl, `${title}.mp4`, `🎬 *${title}*\n🌐 Fuente: ${fuente}\n💖 *Mally-AI (Fast Mode)*`, m)
  } catch (e) {
    console.error('❌ Error al descargar video:', e)
    await conn.reply(m.chat, `❌ *Error:* ${e.message}`, m)
  }
}

/* ================================
   🔹 METADATOS
================================ */
handler.help = ['play <nombre>']
handler.tags = ['descargas']
handler.command = ['play']
handler.register = true

playFastAudio.command = ['play-fast-audio']
playFastVideo.command = ['play-fast-video']

export default handler
export { playFastAudio, playFastVideo }
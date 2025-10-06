import yts from 'yt-search'
import fetch from 'node-fetch'

/* ================================
    🔹 API PRINCIPAL (Adonix)
================================ */
async function apiAdonixMP3(url) {
  const api = `https://api.sylphy.xyz/download/ytmp3?url=${encodeURIComponent(url)}&apikey=sylphy-fbb9`
  const res = await fetch(api)
  const data = await res.json()

  if (!data.status || !data.data?.url) throw new Error('La API Adonix no devolvió una URL válida')

  return {
    url: data.data.url,
    title: data.data.title || 'Audio sin título',
    fuente: 'Adonix'
  }
}

/* ================================
    🔹 API DE RESPALDO (Ryzendesu)
================================ */
async function apiBackupMP3(url) {
  const api = `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(url)}`
  const res = await fetch(api)
  const data = await res.json()

  if (!data.status || !data.result?.url) throw new Error('La API Backup no devolvió datos válidos')

  return {
    url: data.result.url,
    title: data.result.title || 'Audio sin título',
    fuente: 'Ryzendesu'
  }
}

/* ================================
    🔹 FUNCIÓN PRINCIPAL DE DESCARGA
================================ */
async function getAudio(url) {
  try {
    console.log('🎧 Probando API Adonix...')
    return await apiAdonixMP3(url)
  } catch (err1) {
    console.warn('⚠️ Error con Adonix:', err1.message)
    console.log('🔁 Cambiando a API Backup...')
    return await apiBackupMP3(url)
  }
}

/* ================================
    🔹 HANDLER DEL COMANDO PLAY
================================ */
const handler = async (m, { conn, text, usedPrefix }) => {
  const ctxErr = global.rcanalx || {}
  const ctxWarn = global.rcanalw || {}
  const ctxOk = global.rcanalr || {}

  if (!text) {
    return conn.reply(m.chat, `
🎶 *Descargar Música de YouTube (MP3)*

📝 *Uso:*
${usedPrefix}play <nombre de la canción>

💡 *Ejemplo:*
${usedPrefix}play enemy imagine dragons

🎧 *Formato:* MP3 (Alta calidad)
✨ *Bot:* Mally-AI 🎀
    `.trim(), m, ctxWarn)
  }

  try {
    await conn.reply(m.chat, '🔍 *Mally está buscando tu canción...* 🎼', m, ctxOk)

    // Buscar en YouTube
    const search = await yts(text)
    if (!search.videos.length) throw new Error('No se encontraron resultados en YouTube.')

    const song = search.videos[0]
    const { url, title, fuente } = await getAudio(song.url)

    const caption = `
🎀 *Mally Bot - Canción Encontrada* 🎀

🎵 *Título:* ${title}
⏱️ *Duración:* ${song.timestamp}
👤 *Autor:* ${song.author.name}
🔗 *Enlace:* ${song.url}

🌐 *Fuente:* ${fuente}
💬 *Disfruta tu música con Mally 💫*
`.trim()

    // Descargar audio
    const buffer = await fetch(url).then(res => res.buffer())

    await conn.sendMessage(
      m.chat,
      {
        audio: buffer,
        mimetype: 'audio/mpeg',
        fileName: `${title}.mp3`,
        caption,
        ptt: false
      },
      { quoted: m }
    )

  } catch (e) {
    console.error('❌ Error en play:', e)
    await conn.reply(m.chat, `❌ *Error:* ${e.message}`, m, ctxErr)
  }
}

/* ================================
    🔹 METADATOS DEL COMANDO
================================ */
handler.help = ['play <nombre>']
handler.tags = ['descargas']
handler.command = ['play']
handler.register = true

export default handler
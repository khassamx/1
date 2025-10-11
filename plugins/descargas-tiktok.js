// 📁 plugins/Descargas.social.auto.js
// 🌸 Auto-descarga TikTok + Instagram con detección automática

import axios from 'axios'
import dyluxApi from 'api-dylux'

const handler = async (m, { conn, text }) => {
  // Detectar si el mensaje contiene un enlace de TikTok o Instagram
  const body = text || m.text || m.caption || ''
  if (!body) return

  const isTikTok = /tiktok\.com/i.test(body)
  const isInstagram = /instagram\.com/i.test(body)

  if (!isTikTok && !isInstagram) return // Si no hay enlaces, no hace nada

  try {
    // Borra el mensaje con el enlace (opcional)
    if (m.key?.id) {
      await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id } })
    }

    // Mensaje de procesamiento
    const processingMsg = await conn.sendMessage(
      m.chat,
      { text: '⏳ Procesando tu enlace... un momento, baka~ 💗' },
      { quoted: m }
    )

    // Simula “escribiendo” continuamente
    const typingInterval = setInterval(() => conn.sendPresenceUpdate('composing', m.chat), 2000)

    if (isTikTok) {
      const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(body)}&hd=1`)
      const data = res.data?.data
      if (!data?.play) return conn.reply(m.chat, '❌ Enlace TikTok inválido.', m)
      const caption = createTikTokCaption(data)

      if (data.type === 'image' && Array.isArray(data.images)) {
        for (const img of data.images.slice(0, 10)) {
          await conn.sendMessage(m.chat, { image: { url: img }, caption }, { quoted: m })
        }
        if (data.music) {
          await conn.sendMessage(
            m.chat,
            { audio: { url: data.music }, mimetype: 'audio/mp4', fileName: 'tiktok_audio.mp4' },
            { quoted: m }
          )
        }
      } else {
        await conn.sendMessage(m.chat, { video: { url: data.play }, caption }, { quoted: m })
      }

    } else if (isInstagram) {
      const res = await dyluxApi.igdl(body)
      if (!res || (Array.isArray(res) && res.length === 0))
        return conn.reply(m.chat, '❌ Enlace Instagram inválido.', m)

      const mediaList = Array.isArray(res) ? res : [res]

      for (let i = 0; i < mediaList.length; i++) {
        const media = mediaList[i]
        const isVideo = media.type === 'video'
        const mediaKey = isVideo ? 'video' : 'image'
        const caption = mediaList.length > 1
          ? `🔥 Carrusel: elemento ${i + 1} de ${mediaList.length}`
          : `✅ Descarga completada.`
        await conn.sendMessage(
          m.chat,
          { [mediaKey]: { url: media.url }, caption, mimetype: isVideo ? 'video/mp4' : 'image/jpeg' },
          { quoted: m }
        )
        if (mediaList.length > 1) await new Promise(r => setTimeout(r, 1000))
      }
    }

    clearInterval(typingInterval)
    if (processingMsg.key?.id) {
      await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: true, id: processingMsg.key.id } })
    }

  } catch (e) {
    console.error('❌ Error Descargas.social.auto:', e)
    await conn.reply(m.chat, `⚠️ Error al procesar: ${e.message}`, m)
  }
}

// Caption personalizado para TikTok
function createTikTokCaption(data) {
  const name = data.author?.nickname || data.author?.unique_id || 'Desconocido'
  const uid = data.author?.unique_id || 'unknown'
  return `🦋 *Título ›* \`${data.title || 'No disponible'}\`\n> 👑 Autor › *${name}*\n> ⏳ Duración › *${data.duration || 'No disponible'}s*\n> 🎶 Música › [${name}] original sound - ${uid}`
}

handler.help = ['tiktok', 'ig']
handler.tags = ['downloader']
handler.command = /^(tiktok|tt|ig)$/i
handler.all = true // <- Esto activa la detección automática

export default handler
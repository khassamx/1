// 📁 plugins/MIMI-Social.js
// 💜 MIMI ver. BTS — Descargador TikTok, Instagram, Facebook y X (Twitter) con estilo idol 🌸🎤
// ✨ Creado por KekoOfficial y mejorado con GPT-5-mini 💫

import axios from 'axios'
import dyluxApi from 'api-dylux'

const handler = async (m, { conn, text, command }) => {
  if (!text) return conn.reply(m.chat, '📎 Oppa~ envíame un enlace válido de TikTok, Instagram, Facebook o X (Twitter) 💜', m)

  try {
    // 🧹 Borra el mensaje original con enlace
    if (m.key?.id) {
      await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id } })
    }

    // ⏳ Mensaje de procesamiento estilo MIMI
    const processingMsg = await conn.sendMessage(
      m.chat,
      { text: '⏳ MIMI está procesando tu enlace kawaii~ 💗 un momento oppa~' },
      { quoted: m }
    )

    // 💬 Simula “escribiendo…” continuamente
    const typingInterval = setInterval(() => conn.sendPresenceUpdate('composing', m.chat), 2000)

    let matched = false

    // 🔹 TikTok
    if (/tiktok\.com/i.test(text)) {
      matched = true
      const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`)
      const data = res.data?.data
      if (!data?.play) throw new Error('❌ Enlace TikTok inválido, oppa~')
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
    }

    // 🔹 Instagram
    else if (/instagram\.com/i.test(text)) {
      matched = true
      const res = await dyluxApi.igdl(text)
      if (!res || (Array.isArray(res) && res.length === 0)) throw new Error('❌ Enlace Instagram inválido 💗')

      const mediaList = Array.isArray(res) ? res : [res]
      for (let i = 0; i < mediaList.length; i++) {
        const media = mediaList[i]
        const isVideo = media.type === 'video'
        const mediaKey = isVideo ? 'video' : 'image'
        const caption =
          mediaList.length > 1
            ? `🌸 Carrusel ${i + 1} de ${mediaList.length} descargado por MIMI 💜`
            : `✅ Descarga completada por MIMI 🎀`
        await conn.sendMessage(
          m.chat,
          { [mediaKey]: { url: media.url }, caption, mimetype: isVideo ? 'video/mp4' : 'image/jpeg' },
          { quoted: m }
        )
        if (mediaList.length > 1) await new Promise(r => setTimeout(r, 800))
      }
    }

    // 🔹 Facebook
    else if (/facebook\.com|fb\.watch/i.test(text)) {
      matched = true
      const res = await dyluxApi.fbdown(text)
      if (!res?.url) throw new Error('❌ Enlace Facebook inválido 💜')
      await conn.sendMessage(
        m.chat,
        { video: { url: res.url }, caption: '📘 Video de Facebook descargado exitosamente por MIMI 💗' },
        { quoted: m }
      )
    }

    // 🔹 X (Twitter)
    else if (/twitter\.com|x\.com/i.test(text)) {
      matched = true
      const res = await dyluxApi.xdl(text)
      if (!res || !res.url) throw new Error('❌ Enlace X/Twitter inválido 💜')
      const media = Array.isArray(res.url) ? res.url[0] : res.url
      await conn.sendMessage(
        m.chat,
        { video: { url: media }, caption: '🐦 Video de X (Twitter) descargado por MIMI ver. BTS 🎀' },
        { quoted: m }
      )
    }

    if (!matched) {
      await conn.reply(m.chat, '❌ Enlace no reconocido 💜 Solo TikTok, Instagram, Facebook o X (Twitter).', m)
    }

    // 🧹 Detener “escribiendo…” y borrar el mensaje de procesamiento
    clearInterval(typingInterval)
    if (processingMsg.key?.id) {
      await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: true, id: processingMsg.key.id } })
    }

  } catch (e) {
    console.error('❌ Error Descargas.social.pro:', e)
    await conn.reply(m.chat, `⚠️ Oops~ algo salió mal 💜\nMIMI no pudo procesar tu enlace.\nError: ${e.message}`, m)
  }
}

// 🦋 Función auxiliar para TikTok
function createTikTokCaption(data) {
  const name = data.author?.nickname || data.author?.unique_id || 'Desconocido'
  const uid = data.author?.unique_id || 'unknown'
  return `🦋 *Título:* ${data.title || 'No disponible'}
> 👑 Autor: ${name}
> ⏳ Duración: ${data.duration || 'No disponible'}s
> 🎶 Música: [${name}] original sound - ${uid}
💜 Descargado con amor por MIMI ver. BTS 🌸`
}

handler.help = ['tiktok', 'tt', 'ig', 'fb', 'x']
handler.tags = ['downloader']
handler.command = ['tiktok', 'tt', 'ig', 'fb', 'x']
handler.all = true // autodetección de enlaces

export default handler
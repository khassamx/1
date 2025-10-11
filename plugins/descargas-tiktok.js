// 📁 plugins/MIMI-Social.js
// 💜 MIMI ver. BTS — Descargador TikTok, Instagram, Facebook y X (Twitter)
// 🌸 Estilo Idol, Elegancia y Potencia — Creado por KekoOfficial + GPT-5 💫

import axios from 'axios'
import dyluxApi from 'api-dylux'

const handler = async (m, { conn, text }) => {
  if (!text) return conn.reply(m.chat, '📎 Oppa~ envíame un enlace válido de TikTok, Instagram, Facebook o X 💜', m)

  try {
    // 🧹 Elimina el mensaje original con el enlace
    if (m.key?.id)
      await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id } })

    // 💫 Mensaje de procesamiento con efecto typing
    const processingMsg = await conn.sendMessage(m.chat, { text: '💫 MIMI está preparando tu descarga~ 💜' }, { quoted: m })
    const typing = setInterval(() => conn.sendPresenceUpdate('composing', m.chat), 2000)

    let matched = false

    // 🔹 TIKTOK — API oficial estable (tikwm)
    if (/tiktok\.com/i.test(text)) {
      matched = true
      const { data } = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`)
      if (!data?.data?.play) throw new Error('No se pudo procesar el TikTok 💔')

      const info = data.data
      const caption = `🎶 Video de ${info.author?.nickname || 'Desconocido'} descargado por MIMI ver. BTS 🌸`
      await conn.sendMessage(m.chat, { video: { url: info.play }, caption }, { quoted: m })
    }

    // 🔹 INSTAGRAM — Nueva API (Ryzendesu, con fallback)
    else if (/instagram\.com/i.test(text)) {
      matched = true

      let mediaList = []
      try {
        const { data } = await axios.get(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(text)}`)
        if (data?.result?.length) mediaList = data.result
      } catch (err) {
        console.log("⚠️ API Ryzendesu falló, usando respaldo...")
      }

      // 🔸 Fallback (saveig.app extractor)
      if (mediaList.length === 0) {
        const backup = await axios.post('https://saveig.app/api/ajaxSearch', new URLSearchParams({ q: text }))
        const urls = backup.data?.data?.map?.(v => v.url) || []
        mediaList = urls.map(url => ({ url, type: url.endsWith('.mp4') ? 'video' : 'image' }))
      }

      if (mediaList.length === 0) throw new Error('No se pudo obtener contenido de Instagram 💔')

      for (const media of mediaList) {
        const isVideo = media.type === 'video' || media.url.endsWith('.mp4')
        const caption = isVideo
          ? '🎥 Video descargado por MIMI ver. BTS 💜'
          : '📸 Imagen descargada por MIMI ver. BTS 🌸'
        await conn.sendMessage(m.chat, { [isVideo ? 'video' : 'image']: { url: media.url }, caption }, { quoted: m })
      }
    }

    // 🔹 FACEBOOK — API Dylux
    else if (/facebook\.com|fb\.watch/i.test(text)) {
      matched = true
      const res = await dyluxApi.fbdown(text)
      if (!res?.url) throw new Error('No se pudo descargar el video de Facebook 💔')
      await conn.sendMessage(m.chat, { video: { url: res.url }, caption: '📘 Video descargado con amor por MIMI 💜' }, { quoted: m })
    }

    // 🔹 TWITTER / X — API Dylux
    else if (/twitter\.com|x\.com/i.test(text)) {
      matched = true
      const res = await dyluxApi.xdl(text)
      if (!res?.url) throw new Error('No se pudo descargar el video de X 💔')
      await conn.sendMessage(m.chat, { video: { url: res.url }, caption: '🐦 Video de X (Twitter) descargado por MIMI 🎤' }, { quoted: m })
    }

    // 🔹 SIN COINCIDENCIAS
    if (!matched) {
      await conn.reply(m.chat, '❌ Solo acepto enlaces de TikTok, Instagram, Facebook o X 💜', m)
    }

    // 🔚 Limpieza final
    clearInterval(typing)
    if (processingMsg.key?.id)
      await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: true, id: processingMsg.key.id } })
  } catch (e) {
    console.error('⚠️ Error MIMI-Social:', e)
    await conn.reply(
      m.chat,
      `⚠️ Oops~ algo falló 💜\nMIMI no pudo procesar tu enlace.\n\n🧩 Detalle técnico: ${e.message}`,
      m
    )
  }
}

handler.help = ['tiktok', 'tt', 'ig', 'fb', 'x']
handler.tags = ['downloader']
handler.command = ['tiktok', 'tt', 'ig', 'fb', 'x']
handler.all = true

export default handler
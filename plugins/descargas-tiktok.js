// 📁 plugins/MIMI-Social.js
// 💜 MIMI ver. BTS — Descargador TikTok, Instagram, Facebook y X (Twitter)
// ✨ Creado por KekoOfficial + GPT-5 — Actualizado con triple respaldo para Instagram 💫

import axios from 'axios'
import dyluxApi from 'api-dylux'

const handler = async (m, { conn, text }) => {
  if (!text) return conn.reply(m.chat, '📎 Oppa~ envíame un enlace válido de TikTok, Instagram, Facebook o X 💜', m)

  try {
    // 🧹 Elimina mensaje original con el enlace
    if (m.key?.id)
      await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id } })

    // 💫 MIMI procesando con estilo idol~
    const processingMsg = await conn.sendMessage(m.chat, { text: '💫 MIMI está preparando tu descarga, espera un poquito oppa~ 💜' }, { quoted: m })
    const typing = setInterval(() => conn.sendPresenceUpdate('composing', m.chat), 2000)

    let matched = false

    // 🔹 TIKTOK
    if (/tiktok\.com/i.test(text)) {
      matched = true
      const { data } = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`)
      if (!data?.data?.play) throw new Error('No se pudo procesar el TikTok 💔')

      const info = data.data
      const caption = `🎶 Video de ${info.author?.nickname || 'Desconocido'} descargado por MIMI ver. BTS 🌸`
      await conn.sendMessage(m.chat, { video: { url: info.play }, caption }, { quoted: m })
    }

    // 🔹 INSTAGRAM (3 APIs: Ryzendesu → Snapinsta → Instagramdl)
    else if (/instagram\.com/i.test(text)) {
      matched = true
      let mediaList = []

      // 1️⃣ API Ryzendesu
      try {
        const { data } = await axios.get(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(text)}`)
        if (data?.result?.length) mediaList = data.result
      } catch (err) {
        console.log("⚠️ API Ryzendesu falló")
      }

      // 2️⃣ API Snapinsta (respaldo)
      if (mediaList.length === 0) {
        try {
          const snap = await axios.get(`https://snapinsta.app/api?url=${encodeURIComponent(text)}`)
          const urls = snap.data?.data?.map?.(v => v.url) || []
          mediaList = urls.map(url => ({ url, type: url.endsWith('.mp4') ? 'video' : 'image' }))
        } catch (err) {
          console.log("⚠️ Snapinsta no respondió")
        }
      }

      // 3️⃣ API Instagramdl (último recurso)
      if (mediaList.length === 0) {
        try {
          const { data } = await axios.get(`https://instagramdl.net/api?url=${encodeURIComponent(text)}`)
          if (data?.media?.length)
            mediaList = data.media.map(url => ({ url, type: url.endsWith('.mp4') ? 'video' : 'image' }))
        } catch (err) {
          console.log("⚠️ Fallback Instagramdl también falló")
        }
      }

      if (mediaList.length === 0) throw new Error('No se pudo descargar desde ninguna API 💔')

      for (const media of mediaList) {
        const isVideo = media.type === 'video' || media.url.endsWith('.mp4')
        const caption = isVideo
          ? '🎥 Video descargado por MIMI ver. BTS 💜'
          : '📸 Imagen descargada por MIMI ver. BTS 🌸'
        await conn.sendMessage(m.chat, { [isVideo ? 'video' : 'image']: { url: media.url }, caption }, { quoted: m })
      }
    }

    // 🔹 FACEBOOK
    else if (/facebook\.com|fb\.watch/i.test(text)) {
      matched = true
      const res = await dyluxApi.fbdown(text)
      if (!res?.url) throw new Error('No se pudo descargar el video de Facebook 💔')
      await conn.sendMessage(m.chat, { video: { url: res.url }, caption: '📘 Video descargado con amor por MIMI 💜' }, { quoted: m })
    }

    // 🔹 X / TWITTER
    else if (/twitter\.com|x\.com/i.test(text)) {
      matched = true
      const res = await dyluxApi.xdl(text)
      if (!res?.url) throw new Error('No se pudo descargar el video de X 💔')
      await conn.sendMessage(m.chat, { video: { url: res.url }, caption: '🐦 Video de X (Twitter) descargado por MIMI 🎤' }, { quoted: m })
    }

    // 🔹 Sin coincidencias
    if (!matched) {
      await conn.reply(m.chat, '❌ Solo acepto enlaces de TikTok, Instagram, Facebook o X 💜', m)
    }

    // 🔚 Limpieza
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
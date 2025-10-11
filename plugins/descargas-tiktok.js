// 📁 plugins/MIMI-Social.js
// 💜 MIMI ver. BTS — Descargador universal con estilo idol 🌸🎤
// ✨ Creado por KekoOfficial y optimizado con GPT-5 💫

import axios from 'axios'
import dyluxApi from 'api-dylux'

const handler = async (m, { conn, text }) => {
  try {
    // 🩷 Validación inicial
    if (!text || !isValidURL(text)) {
      return conn.reply(
        m.chat,
        '📎 Oppa~ envíame un enlace válido de TikTok, Instagram, Facebook o X 💜',
        m
      )
    }

    // 🧹 Elimina el mensaje original con enlace (limpieza visual)
    if (m.key?.id) {
      await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id } })
    }

    // ⏳ Mensaje temporal de procesamiento + animación “escribiendo…”
    const processingMsg = await conn.sendMessage(
      m.chat,
      { text: '💫 MIMI está preparando tu video~ espera un poquito, oppa 💜' },
      { quoted: m }
    )
    const typing = setInterval(() => conn.sendPresenceUpdate('composing', m.chat), 2000)

    let matched = false

    // 🔹 TikTok — alta calidad (HD)
    if (/tiktok\.com/i.test(text)) {
      matched = true
      const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`, { timeout: 20000 })
      const data = res?.data?.data
      if (!data?.play) throw new Error('El enlace de TikTok no es válido o no tiene contenido 💔')

      const caption = `🎶 Video de ${data.author?.nickname || 'Desconocido'} descargado por 💜 MIMI ver. BTS 🌸`
      await conn.sendMessage(m.chat, { video: { url: data.play }, caption }, { quoted: m })
    }

    // 🔹 Instagram — respaldo alternativo estable
    else if (/instagram\.com/i.test(text)) {
      matched = true
      const res = await axios.get(`https://api.lolhuman.xyz/api/instagram?apikey=demo&url=${encodeURIComponent(text)}`, { timeout: 20000 })
      const result = res?.data?.result
      if (!result || !Array.isArray(result) || result.length === 0) {
        throw new Error('No se pudo descargar el contenido de Instagram 💔 (privado o eliminado)')
      }

      for (const media of result) {
        if (media.endsWith('.mp4')) {
          await conn.sendMessage(m.chat, { video: { url: media }, caption: '💜 Video descargado por MIMI ver. BTS 🎀' }, { quoted: m })
        } else {
          await conn.sendMessage(m.chat, { image: { url: media }, caption: '🌸 Imagen descargada por MIMI ver. BTS 💫' }, { quoted: m })
        }
        await delay(1000)
      }
    }

    // 🔹 Facebook — usa API dylux
    else if (/facebook\.com|fb\.watch/i.test(text)) {
      matched = true
      const res = await dyluxApi.fbdown(text)
      if (!res?.url) throw new Error('Facebook inválido o sin video disponible 💔')

      await conn.sendMessage(
        m.chat,
        { video: { url: res.url }, caption: '📘 Video de Facebook descargado con amor por 💜 MIMI ver. BTS 🌸' },
        { quoted: m }
      )
    }

    // 🔹 X / Twitter — descarga directa
    else if (/twitter\.com|x\.com/i.test(text)) {
      matched = true
      const res = await dyluxApi.xdl(text)
      const mediaURL = Array.isArray(res?.url) ? res.url[0] : res?.url
      if (!mediaURL) throw new Error('Twitter/X inválido o sin contenido 💔')

      await conn.sendMessage(
        m.chat,
        { video: { url: mediaURL }, caption: '🐦 Video de X (Twitter) descargado por 💜 MIMI ver. BTS 🎤' },
        { quoted: m }
      )
    }

    // 🚫 Ninguna plataforma reconocida
    if (!matched) {
      await conn.reply(
        m.chat,
        '❌ Oppa~ ese enlace no pertenece a TikTok, Instagram, Facebook o X 💜',
        m
      )
    }

    // 🧹 Limpieza final
    clearInterval(typing)
    if (processingMsg.key?.id) {
      await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: true, id: processingMsg.key.id } })
    }
  } catch (e) {
    console.error('⚠️ Error en MIMI-Social estricto:', e)
    await conn.reply(
      m.chat,
      `⚠️ Oops~ algo falló 💜\n\nMIMI no pudo procesar tu enlace.\n\n🧩 Detalle técnico: ${e.message}`,
      m
    )
  }
}

// 🧩 Funciones auxiliares
function isValidURL(url) {
  return /^https?:\/\/[^\s/$.?#].[^\s]*$/i.test(url)
}

function delay(ms) {
  return new Promise(res => setTimeout(res, ms))
}

// 📚 Metadatos del comando
handler.help = ['tiktok', 'tt', 'ig', 'fb', 'x']
handler.tags = ['downloader']
handler.command = ['tiktok', 'tt', 'ig', 'fb', 'x']
handler.all = true // autodetección activa
handler.limit = 3 // evita spam

export default handler
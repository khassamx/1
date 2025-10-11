// 📁 plugins/MIMI-Social.js
// 💜 MIMI ver. BTS — Descargador TikTok, Instagram, Facebook y X (Twitter) con estilo idol 🌸🎤
// ✨ Creado por KekoOfficial y mejorado con GPT-5 💫

import axios from 'axios'
import dyluxApi from 'api-dylux'

const handler = async (m, { conn, text }) => {
  if (!text) return conn.reply(m.chat, '📎 Oppa~ envíame un enlace válido de TikTok, Instagram, Facebook o X 💜', m)

  try {
    // 🧹 Borra el mensaje original con enlace
    if (m.key?.id) await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id } })

    // ⏳ Mensaje temporal de procesamiento
    const processingMsg = await conn.sendMessage(m.chat, { text: '💫 MIMI está trabajando en tu video~ espera un poquito oppa 💜' }, { quoted: m })
    const typing = setInterval(() => conn.sendPresenceUpdate('composing', m.chat), 2000)

    let matched = false

    // 🔹 TikTok
    if (/tiktok\.com/i.test(text)) {
      matched = true
      const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`)
      const data = res.data?.data
      if (!data?.play) throw new Error('TikTok inválido 💔')

      const caption = `🎶 Video de ${data.author?.nickname || 'Desconocido'} descargado por MIMI ver. BTS 🌸`
      await conn.sendMessage(m.chat, { video: { url: data.play }, caption }, { quoted: m })
    }

    // 🔹 Instagram (usando API de respaldo)
    else if (/instagram\.com/i.test(text)) {
      matched = true
      const { data } = await axios.get(`https://api.lolhuman.xyz/api/instagram?apikey=demo&url=${encodeURIComponent(text)}`)
      if (!data?.result) throw new Error('Instagram no disponible 💜')

      for (const media of data.result) {
        if (media.includes('.mp4')) {
          await conn.sendMessage(m.chat, { video: { url: media }, caption: '💜 Video descargado por MIMI ver. BTS' }, { quoted: m })
        } else {
          await conn.sendMessage(m.chat, { image: { url: media }, caption: '🌸 Imagen descargada por MIMI ver. BTS' }, { quoted: m })
        }
      }
    }

    // 🔹 Facebook
    else if (/facebook\.com|fb\.watch/i.test(text)) {
      matched = true
      const res = await dyluxApi.fbdown(text)
      if (!res?.url) throw new Error('Facebook inválido 💔')
      await conn.sendMessage(m.chat, { video: { url: res.url }, caption: '📘 Video de Facebook descargado con amor por MIMI 💜' }, { quoted: m })
    }

    // 🔹 X / Twitter
    else if (/twitter\.com|x\.com/i.test(text)) {
      matched = true
      const res = await dyluxApi.xdl(text)
      if (!res?.url) throw new Error('Twitter inválido 💔')
      await conn.sendMessage(m.chat, { video: { url: res.url }, caption: '🐦 Video de X (Twitter) descargado por MIMI 🎤' }, { quoted: m })
    }

    if (!matched) {
      await conn.reply(m.chat, '❌ Solo acepto enlaces de TikTok, Instagram, Facebook o X 💜', m)
    }

    // 🔚 Limpieza
    clearInterval(typing)
    if (processingMsg.key?.id)
      await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: true, id: processingMsg.key.id } })
  } catch (e) {
    console.error('⚠️ Error MIMI-Social:', e)
    await conn.reply(m.chat, `⚠️ Oops~ algo falló 💜\nMIMI no pudo procesar tu enlace.\n\n📄 Error técnico: ${e.message}`, m)
  }
}

handler.help = ['tiktok', 'tt', 'ig', 'fb', 'x']
handler.tags = ['downloader']
handler.command = ['tiktok', 'tt', 'ig', 'fb', 'x']
handler.all = true

export default handler
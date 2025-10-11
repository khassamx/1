// 📁 plugins/MIMI-Social.js
// 💜 MIMI ver. BTS — Descargador con voz idol 🌸
// ✨ Creado por KekoOfficial + GPT-5 💫

import axios from 'axios'
import fs from 'fs'
import gtts from 'node-gtts'
import dyluxApi from 'api-dylux'

const handler = async (m, { conn, text }) => {
  if (!text) return speak(conn, m, '📎 Oppa~ envíame un enlace válido de TikTok, Instagram, Facebook o X 💜')

  try {
    if (m.key?.id) await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id } })
    const processingMsg = await conn.sendMessage(m.chat, { text: '⏳ MIMI está procesando tu enlace kawaii~ 💜' }, { quoted: m })
    const typing = setInterval(() => conn.sendPresenceUpdate('composing', m.chat), 2000)

    let matched = false

    // 🩵 TikTok
    if (/tiktok\.com/i.test(text)) {
      matched = true
      const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`)
      const data = res.data?.data
      if (!data?.play) throw new Error('TikTok inválido 💔')
      await conn.sendMessage(m.chat, { video: { url: data.play }, caption: '💜 Descargado por MIMI ver. BTS 🌸' }, { quoted: m })
      await speak(conn, m, 'Oppa~ tu video de TikTok está listo 💜')
    }

    // 🩷 Instagram
    else if (/instagram\.com/i.test(text)) {
      matched = true
      const { data } = await axios.get(`https://api.lolhuman.xyz/api/instagram?apikey=demo&url=${encodeURIComponent(text)}`)
      if (!data?.result) throw new Error('Instagram no disponible 💜')

      for (const media of data.result) {
        if (media.includes('.mp4')) {
          await conn.sendMessage(m.chat, { video: { url: media }, caption: '🎀 Video descargado por MIMI' }, { quoted: m })
        } else {
          await conn.sendMessage(m.chat, { image: { url: media }, caption: '🌸 Imagen descargada por MIMI' }, { quoted: m })
        }
      }
      await speak(conn, m, 'Oppa~ tu descarga de Instagram está completada 💜')
    }

    // 💙 Facebook
    else if (/facebook\.com|fb\.watch/i.test(text)) {
      matched = true
      const res = await dyluxApi.fbdown(text)
      if (!res?.url) throw new Error('Facebook inválido 💔')
      await conn.sendMessage(m.chat, { video: { url: res.url }, caption: '📘 Facebook descargado por MIMI 💜' }, { quoted: m })
      await speak(conn, m, 'Oppa~ MIMI bajó tu video de Facebook 💜')
    }

    // 💛 Twitter / X
    else if (/twitter\.com|x\.com/i.test(text)) {
      matched = true
      const res = await dyluxApi.xdl(text)
      if (!res?.url) throw new Error('Twitter inválido 💔')
      await conn.sendMessage(m.chat, { video: { url: res.url }, caption: '🐦 Video descargado por MIMI 🎤' }, { quoted: m })
      await speak(conn, m, 'Oppa~ ya tienes tu video de Twitter 💜')
    }

    if (!matched) await speak(conn, m, '❌ Oppa~ no reconozco ese enlace 💜')

    clearInterval(typing)
    if (processingMsg.key?.id)
      await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: true, id: processingMsg.key.id } })
  } catch (e) {
    console.error('⚠️ Error MIMI:', e)
    await speak(conn, m, `⚠️ Oops~ algo salió mal 💜 Error: ${e.message}`)
  }
}

// 🎤 Voz MIMI (TTS coreano-español con acento idol)
async function speak(conn, m, text) {
  const tts = gtts('es')
  const path = './tmp/mimi-voice.mp3'
  tts.save(path, text, () => {
    conn.sendMessage(m.chat, { audio: { url: path }, mimetype: 'audio/mpeg', ptt: true }, { quoted: m })
  })
}

handler.help = ['tiktok', 'tt', 'ig', 'fb', 'x']
handler.tags = ['downloader']
handler.command = ['tiktok', 'tt', 'ig', 'fb', 'x']
handler.all = true

export default handler
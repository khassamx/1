// 📁 plugins/Descargas.social.js
// 🌸 TikTok + Instagram con comandos y auto-detección

import axios from 'axios'
import dyluxApi from 'api-dylux'

const handler = async (m, { conn, text, usedPrefix, command }) => {
  if (!text) return conn.reply(m.chat, `❌ Usa: ${usedPrefix}${command} [enlace]`, m)

  try {
    // Borra el mensaje original con enlace
    if (m.key && m.key.id) {
      await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id } })
    }

    if (command.toLowerCase() === 'tiktok' || /tiktok\.com/i.test(text)) {
      await m.react('🕒')
      const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`)
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
      await m.react('✅')

    } else if (command.toLowerCase() === 'ig' || /instagram\.com/i.test(text)) {
      await m.react('🕒')
      const res = await dyluxApi.igdl(text)
      if (!res || (Array.isArray(res) && res.length === 0)) return conn.reply(m.chat, '❌ Enlace Instagram inválido.', m)
      const mediaList = Array.isArray(res) ? res : [res]
      for (let i = 0; i < mediaList.length; i++) {
        const media = mediaList[i]
        const isVideo = media.type === 'video'
        const mediaKey = isVideo ? 'video' : 'image'
        const caption = mediaList.length > 1
          ? `🔥 Carrusel: elemento ${i + 1} de ${mediaList.length}`
          : `✅ Descarga completada.`
        await conn.sendMessage(m.chat, { [mediaKey]: { url: media.url }, caption, mimetype: isVideo ? 'video/mp4' : 'image/jpeg' }, { quoted: m })
        if (mediaList.length > 1) await new Promise(r => setTimeout(r, 1000))
      }
      await m.react('✅')
    } else {
      conn.reply(m.chat, '❌ Enlace no soportado.', m)
    }
  } catch (e) {
    console.error('❌ Error Descargas.social:', e)
    await conn.react(m.chat, '❎')
    await conn.reply(m.chat, `⚠️ Error al procesar: ${e.message}`, m)
  }
}

// Funciones auxiliares
function createTikTokCaption(data) {
  const name = data.author?.nickname || data.author?.unique_id || 'Desconocido'
  const uid = data.author?.unique_id || 'unknown'
  return `🦋 *Título ›* \`${data.title || 'No disponible'}\`\n> 👑 Autor › *${name}*\n> ⏳ Duración › *${data.duration || 'No disponible'}s*\n> 🎶 Música › [${name}] original sound - ${uid}`
}

handler.help = ['tiktok', 'tt', 'ig']
handler.tags = ['downloader']
handler.command = ['tiktok','tt','ig']
handler.all = true // Auto-detección de enlaces en cualquier mensaje
export default handler
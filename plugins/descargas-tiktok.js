// 📁 plugins/descarga-tiktok.js
// 🌸 Auto-descarga TikTok con “escribiendo…” continuo y eliminación del mensaje del enlace

import axios from 'axios'

const handler = async (m, { conn }) => {
  const body = m.text || m.caption || ''
  if (!/tiktok\.com/i.test(body)) return // Solo TikTok

  try {
    // Borra el mensaje original con enlace (opcional)
    if (m.key?.id) {
      await conn.sendMessage(m.chat, {
        delete: { remoteJid: m.chat, fromMe: false, id: m.key.id }
      })
    }

    // Envia mensaje de carga
    const processingMsg = await conn.sendMessage(
      m.chat,
      { text: '⏳ Descargando tu video de TikTok... espera un momento 💗' },
      { quoted: m }
    )

    // Simula “escribiendo…” continuamente
    const typing = setInterval(() => conn.sendPresenceUpdate('composing', m.chat), 2000)

    // Llamada a la API
    const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(body)}&hd=1`)
    const data = res.data?.data

    if (!data?.play) {
      clearInterval(typing)
      return conn.reply(m.chat, '❌ No se pudo procesar el enlace de TikTok.', m)
    }

    // Crea pie de video
    const caption = `🦋 *Título:* ${data.title || 'Sin título'}\n👑 *Autor:* ${data.author?.nickname || data.author?.unique_id}\n🎶 *Sonido:* ${data.music_info?.title || 'Desconocido'}`

    // Envia video
    await conn.sendMessage(
      m.chat,
      { video: { url: data.play }, caption },
      { quoted: m }
    )

    // Detiene “escribiendo…”
    clearInterval(typing)

    // Borra mensaje de “procesando”
    if (processingMsg.key?.id) {
      await conn.sendMessage(m.chat, {
        delete: { remoteJid: m.chat, fromMe: true, id: processingMsg.key.id }
      })
    }

  } catch (e) {
    console.error('❌ Error en descarga-tiktok.js:', e)
    await conn.reply(m.chat, `⚠️ Error al descargar: ${e.message}`, m)
  }
}

// 🔥 Detección automática
handler.all = async (m, ctx) => await handler(m, ctx)

handler.help = ['tiktok']
handler.tags = ['downloader']
handler.command = ['tiktok', 'tt']
handler.all = true // Escucha todos los mensajes (auto TikTok)

export default handler
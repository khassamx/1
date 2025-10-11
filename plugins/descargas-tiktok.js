// 📁 plugins/MIMI-Social-global-typing.js
// 💜 MIMI ver. BTS — Escribiendo globalmente sin enviar mensajes 🌸🎤
// ✨ Creado por KekoOfficial y GPT-5-mini 💫

import axios from 'axios'
import dyluxApi from 'api-dylux'
import Instagram from 'instagram-web-api'

// ⚡ Configura credenciales
const igClient = new Instagram({
  username: process.env.IG_USER || 'bot1mimi2',
  password: process.env.IG_PASS || 'q?pZ-pdYk595a:*'
})
let igLogged = false
async function ensureIGLogin() {
  if (!igLogged) {
    await igClient.login()
    igLogged = true
  }
}

// 🌎 Chats activos para “escribiendo”
const activeChats = new Map()

// 🌸 Inicia el loop global de typing
function startGlobalTyping(conn) {
  setInterval(() => {
    for (const chatId of activeChats.keys()) {
      try { conn.sendPresenceUpdate('composing', chatId) } catch {}
    }
  }, 5000) // cada 5 segundos
}

// 🌸 Handler principal
const handler = async (m, { conn, text }) => {
  // Registrar chat activo para typing global
  if (!activeChats.has(m.chat)) activeChats.set(m.chat, Date.now())

  try {
    if (!text) return conn.reply(m.chat, '📎 Oppa~ envíame un enlace válido de TikTok, Instagram, Facebook o X 💜', m)

    if (m.key?.id) await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: m.key.id } })

    const processingMsg = await conn.sendMessage(m.chat, { text: '💫 MIMI está trabajando en tu enlace~ espera un poquito oppa 💜' }, { quoted: m })
    
    let matched = false

    // 🔹 TikTok
    if (/tiktok\.com/i.test(text)) {
      matched = true
      const res = await axios.get(`https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`)
      const data = res.data?.data
      if (!data?.play) throw new Error('TikTok inválido 💔')
      await conn.sendMessage(m.chat, { video: { url: data.play }, caption: `🎶 Video de ${data.author?.nickname || 'Desconocido'} descargado por MIMI 🌸` }, { quoted: m })
    }

    // 🔹 Instagram
    else if (/instagram\.com/i.test(text)) {
      matched = true
      await ensureIGLogin()
      let post
      try { post = await igClient.getMediaByUrl(text) } catch { throw new Error('Instagram no disponible 💜') }
      if (!post) throw new Error('No se pudo obtener contenido de Instagram 💔')

      const medias = []
      if (post.edge_sidecar_to_children?.edges) {
        for (const edge of post.edge_sidecar_to_children.edges)
          medias.push(edge.node.is_video ? edge.node.video_url : edge.node.display_url)
      } else {
        medias.push(post.is_video ? post.video_url : post.display_url)
      }

      for (const media of medias) {
        if (media.endsWith('.mp4'))
          await conn.sendMessage(m.chat, { video: { url: media }, caption: '💜 Video descargado por MIMI 🌸' }, { quoted: m })
        else
          await conn.sendMessage(m.chat, { image: { url: media }, caption: '🌸 Imagen descargada por MIMI 🌸' }, { quoted: m })
      }
    }

    // 🔹 Facebook
    else if (/facebook\.com|fb\.watch/i.test(text)) {
      matched = true
      const res = await dyluxApi.fbdown(text)
      if (!res?.url) throw new Error('Facebook inválido 💔')
      await conn.sendMessage(m.chat, { video: { url: res.url }, caption: '📘 Video de Facebook descargado por MIMI 💜' }, { quoted: m })
    }

    // 🔹 X / Twitter
    else if (/twitter\.com|x\.com/i.test(text)) {
      matched = true
      const res = await dyluxApi.xdl(text)
      if (!res?.url) throw new Error('Twitter inválido 💔')
      await conn.sendMessage(m.chat, { video: { url: res.url }, caption: '🐦 Video de X (Twitter) descargado por MIMI 🌸' }, { quoted: m })
    }

    if (!matched) await conn.reply(m.chat, '❌ Solo acepto enlaces de TikTok, Instagram, Facebook o X 💜', m)

    if (processingMsg.key?.id) await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: true, id: processingMsg.key.id } })
  } catch (e) {
    console.error('⚠️ Error MIMI-Social:', e)
    await conn.reply(m.chat, `⚠️ Oops~ algo falló 💜\nMIMI no pudo procesar tu enlace.\n\n🧩 Detalle técnico: ${e.message}`, m)
  }
}

// 🔹 Metadata
handler.help = ['tiktok','tt','ig','fb','x']
handler.tags = ['downloader']
handler.command = ['tiktok','tt','ig','fb','x']
handler.all = true

// ⚡ Inicializar typing global al conectar el bot
handler.before = async (m, { conn }) => { startGlobalTyping(conn) }

export default handler
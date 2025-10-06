// 🪷 Menú oficial de MALLY BOT
// Creado por Khassam | Developer: Brayan OFC

import fetch from 'node-fetch'

const botname = global.botname || '⌬ MALLY Ϟ BOT ⌬'
const creador = 'Khassam'
const developer = 'Brayan OFC'
const version = '1.0.0'

let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    if (!global.db) global.db = {}
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.users) global.db.data.users = {}

    let userId = m.mentionedJid?.[0] || m.sender
    let date = new Date()
    let uptime = clockString(process.uptime() * 1000)

    // Inicializar el usuario si no existe
    if (!global.db.data.users[userId]) {
      global.db.data.users[userId] = { mensajes: 0 }
    }

    // Aumentar contador de mensajes
    global.db.data.users[userId].mensajes = (global.db.data.users[userId].mensajes || 0) + 1
    let mensajes = global.db.data.users[userId].mensajes

    let menuText = `
╭━━━〔 ⌬ MALLY Ϟ BOT ⌬ 〕━━━⬣
┃ 👋 ¡Hola! @${userId.split('@')[0]}
┃ 🧠 *Versión:* ${version}
┃ 👑 *Creador:* ${creador}
┃ 💻 *Developer:* ${developer}
┃ 💬 *Mensajes enviados:* ${mensajes}
┃ ⏱️ *Uptime:* ${uptime}
╰━━━━━━━━━━━━━━━━━━━━━━⬣

─────────────────────────────
👥 *GRUPOS*
─────────────────────────────
.kick       ➝ Expulsar a un usuario
.antilink   ➝ Bloquear enlaces
.tag        ➝ Etiquetar a todos

─────────────────────────────
📥 *DESCARGAS*
─────────────────────────────
.play [video | audio] ➝ Descargar desde YouTube
.tiktok      ➝ Descargar videos de TikTok
.ig          ➝ Descargar de Instagram

─────────────────────────────
🎨 *STICKERS*
─────────────────────────────
.s           ➝ Crear sticker
.hd          ➝ Mejorar calidad de imagen

─────────────────────────────
👤 *CREADOR*
─────────────────────────────
.owner       ➝ Información del creador

─────────────────────────────
🤖 *SUBBOT*
─────────────────────────────
.qr          ➝ Generar código QR
.code        ➝ Enlazar tu WhatsApp

─────────────────────────────
💠 *Creador:* ${creador}
💬 “Un bot rápido, útil y funcional para todos.”
─────────────────────────────
`

    // Reacción y envío del menú
    await conn.sendMessage(m.chat, { react: { text: '⚡', key: m.key } })

    // Video o GIF de presentación (opcional)
    const vid = await (await fetch('https://files.catbox.moe/nl3zrv.mp4')).buffer()
    await conn.sendMessage(
      m.chat,
      {
        video: vid,
        gifPlayback: true,
        caption: menuText,
        contextInfo: { mentionedJid: [userId] }
      },
      { quoted: m }
    )
  } catch (e) {
    await conn.sendMessage(m.chat, { text: `❌ Error en el menú:\n${e}` }, { quoted: m })
  }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'mallymenu']
export default handler

// 🕒 Función de reloj
function clockString(ms) {
  let d = Math.floor(ms / 86400000)
  let h = Math.floor(ms / 3600000) % 24
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return `${d ? d + 'd ' : ''}${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${s}s`
}
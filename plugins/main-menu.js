// 🦉 Menú DELUXE TITAN de MALLY BOT
// Creado por Khassam | Developer: Brayan OFC

import fetch from 'node-fetch'

const botname = '🦉 MALLY BOT TITAN 🦉'
const creador = 'KHASSAM'
const developer = 'BRAYAN OFC'
const version = '1.0.0'

let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    // Inicializar base de datos si no existe
    if (!global.db) global.db = {}
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.users) global.db.data.users = {}

    let userId = m.mentionedJid?.[0] || m.sender
    let user = global.db.data.users[userId] || { exp: 0, level: 1, premium: false, msgCount: 0 }
    let uptime = clockString(process.uptime() * 1000)

    let menuText = `
🦉 ${botname} - v${version} 🦉

⚔️ Saludos @${userId.split('@')[0]}
👑 Creador: ${creador}
💻 Developer: ${developer}
⏱ Uptime: ${uptime}
📊 Mensajes enviados: ${user.msgCount}
⭐ Nivel: ${user.level}
💎 Premium: ${user.premium ? 'Sí' : 'No'}

🦉 GRUPOS
.kick @user       → Expulsar a un intruso
.antilink on/off  → Bloquear enlaces peligrosos

🦉 DESCARGAS
.play [video|audio] → Descargar desde YouTube
.tiktok [url]       → Descargar videos de TikTok
.ig [url]           → Descargar de Instagram

🦉 CREADOR
.owner              → Info del creador

🦉 SUBBOT
.qr                 → Generar código QR
.code               → Enlazar tu WhatsApp
`

    // Incrementar contador de mensajes
    user.msgCount += 1
    global.db.data.users[userId] = user

    // Enviar menú
    await conn.sendMessage(m.chat, { text: menuText, contextInfo: { mentionedJid: [userId] } })

  } catch (e) {
    await conn.sendMessage(m.chat, { text: `❌ ERROR EN EL MENÚ:\n${e}` }, { quoted: m })
  }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'mallymenu', 'titanmenu']
export default handler

// Función para convertir uptime en texto
function clockString(ms) {
  let d = Math.floor(ms / 86400000)
  let h = Math.floor(ms / 3600000) % 24
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return `${d ? d + 'd ' : ''}${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${s}s`
}
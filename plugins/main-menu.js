// 🦉 Menú DELUXE TITAN de MALLY BOT
// Creado por Khassam | Developer: Brayan OFC

import fetch from 'node-fetch'

const botname = '🦉 MALLY🦉'
const creador = 'KHASSAM'
const developer = 'BRAYAN OFC'
const version = '1.0.0'
const rcanalw = 'https://whatsapp.com/channel/0029VbAzCfhFHWpwREs2ZT0V/129' // Canal oficial

let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    // Inicializar base de datos si no existe
    if (!global.db) global.db = {}
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.users) global.db.data.users = {}
    if (!global.db.data.global) global.db.data.global = { totalMessages: 0 }

    let userId = m.mentionedJid?.[0] || m.sender
    let user = global.db.data.users[userId] || { exp: 0, level: 1, premium: false, msgCount: 0 }
    let uptime = clockString(process.uptime() * 1000)

    // Calcular ping
    let start = Date.now()
    await conn.sendPresenceUpdate('composing', m.chat)
    let ping = Date.now() - start

    // Incrementar contador global y por usuario
    global.db.data.global.totalMessages += 1
    user.msgCount += 1
    global.db.data.users[userId] = user

    // Menú estilo mini-poster deluxe para WhatsApp con canal
    let menuText = `
🌸✨🔥 MALLY BOT 🔥✨🌸
===========================

👋 ¡Hola! @${userId.split('@')[0]}
🛠️ Creador: ${creador}
💻 Developer: ${developer}
⏱ Uptime: ${uptime}
📶 Ping: ${ping}ms
🗨️ Chat global: ${global.db.data.global.totalMessages}
⭐ Nivel: ${user.level}
💎 Premium: ${user.premium ? 'Sí' : 'No'}

📊 ➤ CONTADOR GLOBAL ➤ 📊
💛 Registra mensajes y acciones
💚 Actualización completa solo en canal autorizado

📋 🎨 MENÚ PRINCIPAL 🎨 📋
---------------------------------
👥 *Grupos / Administración*
💙 .kick @user
💜 .antilink on/off

🎵 *Descargas / Multimedia*
💚 .play
💖 .pla2
💙 .tiktok
💜 .ig

📞 *Creador / Contacto*
💛 .owner

📺 *Canal Oficial*  
💚 ${rcanalw}

🦉 SUBBOT
💚 .qr
💖 .code
`

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
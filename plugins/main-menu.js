import fetch from 'node-fetch'

const botname = '🦉 MALLY🦉'
const creador = 'KHASSAM'
const developer = 'BRAYAN OFC'
const version = '1.0.0'
const rcanalw = 'https://t.me/TuCanalOficial'

let handler = async (m, { conn }) => {
  try {
    if (!global.db) global.db = {}
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.users) global.db.data.users = {}
    if (!global.db.data.global) global.db.data.global = { totalMessages: 0 }
    if (!global.db.data.chats) global.db.data.chats = {}

    let userId = m.mentionedJid?.[0] || m.sender
    let user = global.db.data.users[userId] || { exp: 0, level: 1, premium: false, msgCount: 0 }
    let chat = global.db.data.chats[m.chat] || { antiLink: false }
    let uptime = clockString(process.uptime() * 1000)

    global.db.data.global.totalMessages += 1
    user.msgCount += 1
    global.db.data.users[userId] = user
    global.db.data.chats[m.chat] = chat

    // Texto del menú
    let menuText = `
🌸✨🔥 MALLY BOT 🔥✨🌸
===========================

👋 ¡Hola! @${userId.split('@')[0]}
🛠️ Creador: ${creador}
💻 Developer: ${developer}
⏱ Uptime: ${uptime}
📶 Ping: calculando...
🗨️ Chat global: ${global.db.data.global.totalMessages}
⭐ Nivel: ${user.level}
💎 Premium: ${user.premium ? 'Sí' : 'No'}

📋 🎨 MENÚ PRINCIPAL 🎨 📋
---------------------------------
👥 *Grupos / Administración*
💙 .kick @user
💜 AntiLink: ${chat.antiLink ? '✅ ACTIVADO' : '❌ DESACTIVADO'}

🎵 *Descargas / Multimedia*
💚 .play
💖 .pla2
💙 .tiktok
💜 .ig

📞 *Creador / Contacto*
💛 .owner

📺 *Canal Oficial*  
💚 ${rcanalw}
`

    // Botones para activar/desactivar AntiLink
    let buttons = [
      { buttonId: '.antilink on', buttonText: { displayText: '✅ Activar AntiLink' }, type: 1 },
      { buttonId: '.antilink off', buttonText: { displayText: '❌ Desactivar AntiLink' }, type: 1 },
      { buttonId: '.menu', buttonText: { displayText: '🔄 Actualizar Menú' }, type: 1 }
    ]

    await conn.sendMessage(
      m.chat,
      {
        text: menuText,
        footer: `🌸 ${botname} • v${version}`,
        buttons,
        headerType: 1,
        contextInfo: { mentionedJid: [userId] }
      },
      { quoted: m }
    )

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
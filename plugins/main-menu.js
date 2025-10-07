// 🦉 Menú MALLY BOT con foto y botones
// Creado por Khassam | Developer: Brayan OFC

import fs from 'fs'

let handler = async (m, { conn }) => {
  try {
    let userId = m.mentionedJid?.[0] || m.sender

    // Stats
    let uptime = clockString(process.uptime() * 1000)
    let ping = Date.now() - m.messageTimestamp
    let totalMsgs = global.db?.data?.global?.totalMessages || 0
    let userData = global.db?.data?.users?.[userId] || { level: 1, premium: false }

    // Texto del menú
    let menuText = `
🌸✨🦉 MALLY BOT 🦉✨🌸

👋 Hola @${userId.split('@')[0]}
⏱ Uptime: ${uptime} | 📶 Ping: ${ping}ms
🗨️ Mensajes globales: ${totalMsgs}
⭐ Nivel: ${userData.level} | 💎 Premium: ${userData.premium ? 'Sí' : 'No'}

✨─────────🌸─────────✨
👥 GRUPOS / ADMIN
.on antilink
.off antilink
.kick @user

✨─────────🌸─────────✨
🎵 DESCARGAS
.play
.play2
.ig
.tiktok

✨─────────🌸─────────✨
📞 CREADOR
.owner

✨─────────🌸─────────✨
🦉 SUBBOT
.qr
.code
✨─────────🌸─────────✨
`

    // Botones del menú
    const buttons = [
      { url: 'https://whatsapp.com/channel/0029VbAzCfhFHWpwREs2ZT0V/129', text: '🌸 Canal Oficial', type: 1 },
      { id: 'update', text: '🔄 Actualizar Bot', type: 2 },
      { phoneNumber: '+595XXXXXXXXX', text: '📞 Llamar al dueño', type: 3 }
    ]

    // Foto de encabezado (ejemplo: banner.png en tu proyecto)
    let image = fs.readFileSync('./banner.png') // reemplazar con la ruta de tu foto

    await conn.sendMessage(
      m.chat,
      {
        image: image,
        caption: menuText,
        footer: '🌸 Mally Bot ULTRA VISUAL 🌸',
        templateButtons: buttons,
        mentions: [userId]
      },
      { quoted: m }
    )

  } catch (e) {
    console.error(e)
    await conn.sendMessage(
      m.chat,
      { text: `❌ ERROR EN EL MENÚ:\n${e}` },
      { quoted: m }
    )
  }
}

// Función para convertir uptime a texto
function clockString(ms) {
  let d = Math.floor(ms / 86400000)
  let h = Math.floor(ms / 3600000) % 24
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return `${d ? d + 'd ' : ''}${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${s}s`
}

export default handler
handler.command = ['menu', 'help', 'mallymenu', 'titanmenu']
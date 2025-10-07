// 🦉 Menú ULTRA VISUAL DELUXE de MALLY BOT
// Creado por Khassam | Developer: Brayan OFC

let handler = async (m, { conn }) => {
  try {
    // Usuario
    let userId = m.mentionedJid?.[0] || m.sender

    // Ping y uptime
    let uptime = clockString(process.uptime() * 1000)
    let ping = Date.now() - m.messageTimestamp

    // Menú ultra visual
    let menuText = `
✨🌸────────────🌸✨
         🦉 MALLY BOT 🦉
           v1.0.0
✨🌸────────────🌸✨

👋 Hola, @${userId.split('@')[0]}!
⏱ Uptime: ${uptime} | 📶 Ping: ${ping}ms
🗨️ Mensajes globales: ${global.db?.data?.global?.totalMessages || 0}
⭐ Nivel: ${global.db?.data?.users?.[userId]?.level || 1}
💎 Premium: ${global.db?.data?.users?.[userId]?.premium ? 'Sí' : 'No'}

✨─────────🌸─────────✨
👥 GRUPOS / ADMIN
💙 .kick @usuario
💜 .antilink on/off
💛 .antilink2 on/off

✨─────────🌸─────────✨
🎵 DESCARGAS / MULTIMEDIA
💚 .play
💖 .pla2
💙 .tiktok
💜 .ig

✨─────────🌸─────────✨
📞 CREADOR / CONTACTO
💛 .owner

✨─────────🌸─────────✨
🦉 SUBBOT
💚 .qr
💖 .code
✨─────────🌸─────────✨
`

    // Botones funcionales
    const buttons = [
      { url: 'https://whatsapp.com/channel/0029VbAzCfhFHWpwREs2ZT0V/129', text: '🌸 Canal Oficial', type: 1 },
      { id: 'update', text: '🔄 Actualizar Bot', type: 2 },
      { phoneNumber: '+595XXXXXXXXX', text: '📞 Llamar al dueño', type: 3 }
    ]

    // Enviar mensaje con botones
    await conn.sendMessage(
      m.chat,
      {
        text: menuText,
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
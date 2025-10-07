// 🦉 Menú ULTRA DELUXE de MALLY BOT
// Creado por Khassam | Developer: Brayan OFC

let handler = async (m, { conn }) => {
  try {
    // Inicializar base de datos si no existe
    if (!global.db) global.db = {}
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.users) global.db.data.users = {}
    if (!global.db.data.global) global.db.data.global = { totalMessages: 0 }

    let userId = m.mentionedJid?.[0] || m.sender
    let user = global.db.data.users[userId] || { exp: 0, level: 1, premium: false, msgCount: 0 }

    // Stats
    let uptime = clockString(process.uptime() * 1000)
    let ping = Date.now() - m.messageTimestamp
    global.db.data.global.totalMessages += 1
    user.msgCount += 1
    global.db.data.users[userId] = user

    // Texto del menú ultra visual
    let menuText = `
✨🌸────────────🌸✨
         🦉 MALLY BOT 🦉
           v1.0.0
✨🌸────────────🌸✨

👋 Hola @${userId.split('@')[0]}!
⏱ Uptime: ${uptime} | 📶 Ping: ${ping}ms
🗨️ Mensajes globales: ${global.db.data.global.totalMessages}
⭐ Nivel: ${user.level} | 💎 Premium: ${user.premium ? 'Sí' : 'No'}

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

    // Enviar menú solo con texto + botones
    await conn.sendMessage(
      m.chat,
      {
        text: menuText,
        footer: '🌸 Mally Bot ULTRA DELUXE 🌸',
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

// Exportar handler y registrar comandos
export default handler
handler.command = /^(menu|help|mallymenu|titanmenu)$/i
handler.tags = ['main']
handler.help = ['menu', 'help']
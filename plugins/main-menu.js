let handler = async (m, { conn }) => {
  try {
    let userId = m.mentionedJid?.[0] || m.sender
    let uptime = clockString(process.uptime() * 1000)
    let ping = Date.now() - m.messageTimestamp

    let menuText = `
🌸✨🔥 MALLY BOT 🔥✨🌸

👋 ¡Hola! @${userId.split('@')[0]}
⏱ Uptime: ${uptime}
📶 Ping: ${ping}ms

📋 MENÚ PRINCIPAL
👥 .kick
💜 .antilink
🎵 .play
💖 .pla2
💙 .tiktok
💚 .ig
📞 .owner
🦉 .qr
💛 .code
`

    const buttons = [
      { url: 'https://whatsapp.com/channel/0029VbAzCfhFHWpwREs2ZT0V/129', text: '🌸 Canal Oficial', type: 1 },
      { id: 'update', text: '🔄 Actualizar Bot', type: 2 },
      { phoneNumber: '+595XXXXXXXXX', text: '📞 Llamar al dueño', type: 3 }
    ]

    await conn.sendMessage(m.chat, {
      text: menuText,
      footer: '🌸 Mally Bot v1.0.0 🌸',
      templateButtons: buttons,
      mentions: [userId]
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    await conn.sendMessage(m.chat, { text: `❌ ERROR EN EL MENÚ:\n${e}` }, { quoted: m })
  }
}

function clockString(ms) {
  let d = Math.floor(ms / 86400000)
  let h = Math.floor(ms / 3600000) % 24
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return `${d ? d + 'd ' : ''}${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${s}s`
}
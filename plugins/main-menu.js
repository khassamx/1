// 🦉 Menú DELUXE TITAN de MALLY BOT
// Creado por Khassam | Developer: Brayan OFC

import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

const botname = '🦉 MALLY🦉'
const creador = 'KHASSAM'
const developer = 'BRAYAN OFC'
const version = '1.0.0'
const canalOficial = 'https://whatsapp.com/channel/0029VbAzCfhFHWpwREs2ZT0V/129'
const numeroDueño = '+595XXXXXXXXX' // Poner tu número real

let handler = async (m, { conn }) => {
  try {
    // Inicializar base de datos si no existe
    if (!global.db) global.db = {}
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.users) global.db.data.users = {}
    if (!global.db.data.global) global.db.data.global = { totalMessages: 0 }

    let userId = m.mentionedJid?.[0] || m.sender
    let user = global.db.data.users[userId] || { exp: 0, level: 1, premium: false, msgCount: 0 }
    let uptime = clockString(process.uptime() * 1000)

    // Calcular ping simple
    let start = Date.now()
    await conn.sendPresenceUpdate('composing', m.chat)
    let ping = Date.now() - start

    // Incrementar contador global y por usuario
    global.db.data.global.totalMessages += 1
    user.msgCount += 1
    global.db.data.users[userId] = user

    // Texto del menú
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

🦉 SUBBOT
💚 .qr
💖 .code
`

    // Botones
    const templateButtons = [
      { urlButton: { displayText: '🌸 Canal Oficial', url: canalOficial } },
      { quickReplyButton: { displayText: '🔄 Actualizar Bot', id: 'update' } },
      { callButton: { displayText: '📞 Llamar al dueño', phoneNumber: numeroDueño } }
    ]

    // Construir mensaje hydratedTemplate
    const message = {
      templateMessage: {
        hydratedTemplate: {
          hydratedContentText: menuText,
          templateButtons: templateButtons,
          hydratedFooterText: `🌸 ${botname} v${version} 🌸`
        }
      }
    }

    // Enviar menú
    await conn.sendMessage(m.chat, message, { quoted: m })

  } catch (e) {
    console.error(e)
    await conn.sendMessage(m.chat, { text: `❌ ERROR EN EL MENÚ:\n${e}` }, { quoted: m })
  }
}

// Función para convertir uptime en texto
function clockString(ms) {
  let d = Math.floor(ms / 86400000)
  let h = Math.floor(ms / 3600000) % 24
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return `${d ? d + 'd ' : ''}${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${s}s`
}

export default handler
handler.command = ['menu', 'help', 'mallymenu', 'titanmenu']
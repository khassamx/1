// ⌬ Menú Eʟɪᴛᴇ Minimalista con Contador Global
// Creado por Khassam | Developer: Brayan OFC

import fetch from 'node-fetch'

const botname = '⌬ MALLY BOT'
const creador = 'KHASSAM'
const developer = 'BRAYAN OFC'

let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    // Inicializar base de datos global si no existe
    if (!global.db) global.db = {}
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.global) global.db.data.global = { totalMessages: 0 }

    // Incrementar contador global de mensajes
    global.db.data.global.totalMessages += 1
    let totalGlobal = global.db.data.global.totalMessages

    let userId = m.mentionedJid?.[0] || m.sender

    let menuText = `
${botname}

⌬ Creador: ${creador}
⌬ Developer: ${developer}
⌬ Mensajes globales: ${totalGlobal}

⌬ GRUPOS
⌬ .kick
⌬ .antilink

⌬ DESCARGAS
⌬ .play
⌬ .tiktok
⌬ .ig

⌬ CREADOR
⌬ .owner

⌬ SUBBOT
⌬ .qr
⌬ .code
`

    // Enviar menú
    await conn.sendMessage(m.chat, { text: menuText, contextInfo: { mentionedJid: [userId] } })

  } catch (e) {
    await conn.sendMessage(m.chat, { text: `❌ ERROR EN EL MENÚ:\n${e}` }, { quoted: m })
  }
}

// Configuración del comando
handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'mallymenu', 'elitemenu']
export default handler
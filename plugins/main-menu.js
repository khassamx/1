// ⌬ Menú MALLY BOT con letra estilizada segura
// Creado por Khassam | Developer: Brayan OFC

import fetch from 'node-fetch'

const botname = '⌬ MALLY Ϟ BOT ⌬'
const creador = 'KHASSAM'
const developer = 'BRAYAN OFC'

// Función solo para títulos y secciones
function fancyText(text) {
  const map = {
    'a':'ᴀ','b':'ʙ','c':'ᴄ','d':'ᴅ','e':'ᴇ','f':'ꜰ','g':'ɢ','h':'ʜ','i':'ɪ','j':'ᴊ',
    'k':'ᴋ','l':'ʟ','m':'ᴍ','n':'ɴ','o':'ᴏ','p':'ᴘ','q':'ǫ','r':'ʀ','s':'ꜱ','t':'ᴛ',
    'u':'ᴜ','v':'ᴠ','w':'ᴡ','x':'x','y':'ʏ','z':'ᴢ','A':'A','B':'B','C':'C','D':'D','E':'E',
    'F':'F','G':'G','H':'H','I':'I','J':'J','K':'K','L':'L','M':'M','N':'N','O':'O','P':'P',
    'Q':'Q','R':'R','S':'S','T':'T','U':'U','V':'V','W':'W','X':'X','Y':'Y','Z':'Z'
  }
  return text.split('').map(c => map[c] || c).join('')
}

let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    if (!global.db) global.db = {}
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.global) global.db.data.global = { totalMessages: 0 }

    global.db.data.global.totalMessages += 1
    let totalGlobal = global.db.data.global.totalMessages
    let userId = m.mentionedJid?.[0] || m.sender

    let menuText = `
${botname}

⌬ ${fancyText('Creador')}: ${creador}
⌬ ${fancyText('Developer')}: ${developer}
⌬ ${fancyText('Mensajes globales')}: ${totalGlobal}

⌬ ${fancyText('GRUPOS')}
⌬ .kick
⌬ .antilink

⌬ ${fancyText('DESCARGAS')}
⌬ .play
⌬ .tiktok
⌬ .ig

⌬ ${fancyText('CREADOR')}
⌬ .owner

⌬ ${fancyText('SUBBOT')}
⌬ .qr
⌬ .code
`

    await conn.sendMessage(m.chat, { text: menuText, contextInfo: { mentionedJid: [userId] } })

  } catch (e) {
    await conn.sendMessage(m.chat, { text: `❌ ERROR EN EL MENÚ:\n${e}` }, { quoted: m })
  }
}

// Comandos que activan el menú
handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'mallymenu']
export default handler
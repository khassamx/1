// 🪷 Menú oficial de MALLY BOT
// Creado por Khassam | Developer: Brayan OFC

import fetch from 'node-fetch'

const botname = global.botname || '⌬ MALLY Ϟ BOT ⌬'
const creador = 'Khassam'
const developer = 'Brayan OFC'
const version = '1.0.0'

let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    if (!global.db) global.db = {}
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.users) global.db.data.users = {}

    let userId = m.mentionedJid?.[0] || m.sender
    let date = new Date()
    let uptime = clockString(process.uptime() * 1000)

    let menuText = `
╔══ ❖ 𝐌𝐀𝐋𝐋𝐘 𝐁𝐎𝐓 ❖ ══╗
🤖 𝐁𝐨𝐭 𝐝𝐞 𝐖𝐡𝐚𝐭𝐬𝐀𝐩𝐩 𝐜𝐫𝐞𝐚𝐝𝐨 𝐩𝐨𝐫 𝐊𝐡𝐚𝐬𝐬𝐚𝐦
👨‍💻 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫: 𝐁𝐫𝐚𝐲𝐚𝐧 𝐎𝐅𝐂
─────────────────────────────
💬 “𝐏𝐞𝐪𝐮𝐞𝐧̃𝐨, 𝐫𝐚́𝐩𝐢𝐝𝐨 𝐲 𝐮́𝐭𝐢𝐥 𝐩𝐚𝐫𝐚 𝐭𝐨𝐝𝐨𝐬.”
─────────────────────────────

╭─👥 𝐆𝐑𝐔𝐏𝐎𝐒
│ .kick @user       ➜ 𝐄𝐱𝐩𝐮𝐥𝐬𝐚𝐫 𝐚 𝐮𝐧 𝐮𝐬𝐮𝐚𝐫𝐢𝐨
│ .antilink on/off  ➜ 𝐁𝐥𝐨𝐪𝐮𝐞𝐚𝐫 𝐞𝐧𝐥𝐚𝐜𝐞𝐬
╰─────────────────────────────

╭─📥 𝐃𝐄𝐒𝐂𝐀𝐑𝐆𝐀𝐒
│ .play [video | audio] ➜ 𝐃𝐞𝐬𝐜𝐚𝐫𝐠𝐚𝐫 𝐝𝐞 𝐘𝐨𝐮𝐓𝐮𝐛𝐞
│ .tiktok [url]         ➜ 𝐕𝐢𝐝𝐞𝐨𝐬 𝐝𝐞 𝐓𝐢𝐤𝐓𝐨𝐤
│ .ig [url]             ➜ 𝐑𝐞𝐞𝐥𝐬 𝐨 𝐟𝐨𝐭𝐨𝐬 𝐝𝐞 𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦
╰─────────────────────────────

╭─👤 𝐂𝐑𝐄𝐀𝐃𝐎𝐑
│ .owner               ➜ 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐜𝐢𝐨́𝐧 𝐝𝐞𝐥 𝐜𝐫𝐞𝐚𝐝𝐨𝐫
╰─────────────────────────────

╭─🤖 𝐒𝐔𝐁𝐁𝐎𝐓
│ .qr                  ➜ 𝐆𝐞𝐧𝐞𝐫𝐚𝐫 𝐜𝐨́𝐝𝐢𝐠𝐨 𝐐𝐑
│ .code                ➜ 𝐎𝐛𝐭𝐞𝐧𝐞𝐫 𝐜𝐨́𝐝𝐢𝐠𝐨 𝐩𝐚𝐫𝐚 𝐭𝐮 𝐒𝐮𝐛𝐁𝐨𝐭
╰─────────────────────────────

─────────────────────────────
💠 𝐂𝐫𝐞𝐚𝐝𝐨𝐫: 𝐊𝐡𝐚𝐬𝐬𝐚𝐦
👨‍💻 𝐃𝐞𝐯𝐞𝐥𝐨𝐩𝐞𝐫: 𝐁𝐫𝐚𝐲𝐚𝐧 𝐎𝐅𝐂
💬 “𝐑𝐞𝐧𝐨𝐯𝐚𝐧𝐝𝐨 𝐥𝐚 𝐞𝐱𝐩𝐞𝐫𝐢𝐞𝐧𝐜𝐢𝐚 𝐝𝐞 𝐥𝐨𝐬 𝐛𝐨𝐭𝐬.”
─────────────────────────────
`

    // Reacción y envío del menú
    await conn.sendMessage(m.chat, { react: { text: '⚡', key: m.key } })

    // Video o GIF de presentación (opcional)
    const vid = await (await fetch('https://files.catbox.moe/nl3zrv.mp4')).buffer()
    await conn.sendMessage(
      m.chat,
      {
        video: vid,
        gifPlayback: true,
        caption: menuText,
        contextInfo: { mentionedJid: [userId] }
      },
      { quoted: m }
    )
  } catch (e) {
    await conn.sendMessage(m.chat, { text: `❌ Error en el menú:\n${e}` }, { quoted: m })
  }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'mallymenu']
export default handler

// 🕒 Función de uptime
function clockString(ms) {
  let d = Math.floor(ms / 86400000)
  let h = Math.floor(ms / 3600000) % 24
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return `${d ? d + 'd ' : ''}${h ? h + 'h ' : ''}${m ? m + 'm ' : ''}${s}s`
}
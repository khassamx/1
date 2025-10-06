// Creador del menú: BrayanOFC
import fetch from 'node-fetch'

const botname = global.botname || '🌸 𝐈𝐓𝐒𝐔𝐊𝐈 𝐍𝐀𝐊𝐀𝐍𝐎-𝐀𝐈 🌸'
const creador = '𝗟𝗲𝗼  𝘅𝘇𝘅𝘀𝘆 ⚡'
const version = '𝗕𝗲𝘁𝗮'

let tags = {
  'serbot': '❤️‍🩹 𝗦𝗨𝗕-𝗕𝗢𝗧𝗦',
  'info': '🌸 𝗜𝗡𝗙𝗢𝗦',
  'main': '💋 𝗠𝗘𝗡𝗨',
  'nable': '🌀 𝗠𝗢𝗗𝗢 𝗔𝗩𝗔𝗡𝗭𝗔𝗗𝗢',
  'cmd': '📝 𝗖𝗢𝗠𝗔𝗡𝗗𝗢𝗦',
  'advanced': '🌟 𝗙𝗨𝗡𝗖𝗜𝗢𝗡𝗘𝗦',
  'game': '💫 𝗝𝗨𝗘𝗚𝗢𝗦',
  'economy': '✨ 𝗘𝗖𝗢𝗡𝗢𝗠𝗜𝗔',
  'gacha': '🧧 𝗚𝗔𝗖𝗛𝗔',
  'rpg': '⚔️ 𝗥𝗣𝗚',
  'group': '🌼 𝗚𝗥𝗨𝗣𝗢𝗦',
  'downloader': '👒 𝗗𝗘𝗦𝗖𝗔𝗥𝗚𝗔𝗦',
  'sticker': '🎀 𝗦𝗧𝗜𝗖𝗞𝗘𝗥',
  'audio': '🫧 𝗔𝗨𝗗𝗜𝗢',
  'search': '🪞 𝗕𝗨𝗦𝗤𝗨𝗘𝗝𝗔',
  'tools': '🧰 𝗛𝗘𝗥𝗔𝗠𝗜𝗘𝗡𝗧𝗔𝗦',
  'fun': '💃 𝗗𝗜𝗩𝗘𝗥𝗦𝗜𝗢𝗡',
  'anime': '🪭 𝗔𝗡𝗜𝗠𝗘',
  'premium': '💎 𝗣𝗥𝗘𝗠𝗜𝗨𝗠',
  'social': '📸 𝗥𝗘𝗗𝗘𝗦',
  'custom': '📕 𝗣𝗘𝗥𝗦𝗢𝗡𝗔𝗟'
}

let handler = async (m, { conn, usedPrefix: _p }) => {
  try {
    if (!global.db) global.db = {}
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.users) global.db.data.users = {}

    let userId = m.mentionedJid?.[0] || m.sender
    let user = global.db.data.users[userId] || { exp: 0, level: 1, premium: false }

    let totalPremium = Object.values(global.db.data.users).filter(u => u.premium).length

    let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => ({
      help: Array.isArray(plugin.help) ? plugin.help : (plugin.help ? [plugin.help] : []),
      tags: Array.isArray(plugin.tags) ? plugin.tags : (plugin.tags ? [plugin.tags] : []),
      limit: plugin.limit,
      premium: plugin.premium,
    }))

    let date = new Date()
    let uptime = clockString(process.uptime() * 1000)

    const botJid = conn.user.jid
    const officialBotNumber = '18097769423@s.whatsapp.net' // Reemplaza con el número real del bot oficial
    const isOfficialBot = botJid === officialBotNumber
    const botType = isOfficialBot ? '🌷 𝗕𝗼𝘁 𝗢𝗳𝗶𝗰𝗶𝗮𝗹: 𝗜𝘁𝘀𝘂𝗸𝗶 𝗡𝗮𝗸𝗮𝗻𝗼 𝗢𝗳𝗶𝗰𝗶𝗮𝗹 🌟' : '⭐ 𝗦𝘂𝗯-𝗕𝗼𝘁: 𝗡𝗼 𝗕𝗼𝘁 𝗢𝗳𝗰𝗶𝗮𝗹 🌟'

    let menuText = `
╭━━━〔 🌸 *ITSUKI NAKANO-AI MENU* 🌸 〕━━━⬣
┃ 👋🏻 *Hola* @${userId.split('@')[0]} ✨
┃ 👑 *Creador*: *${creador}*
┃ ${botType}
┃ ⏳️ *Uptime*: *${uptime}*
┃ 💎 *Premium*: *${totalPremium}*
┃ 🪷 *Versión*: *${version}*
╰━━━━━━━━━━━━━━━━━━━━━━⬣
`

    for (let tag in tags) {
      let comandos = help.filter(menu => menu.tags.includes(tag))
      if (!comandos.length) continue

      menuText += `
╭━━━〔 ${tags[tag]} 〕━━━⬣
${comandos.map(menu => menu.help.map(cmd =>
  `┃ 🌸 ${_p}${cmd}${menu.limit ? ' 💋' : ''}${menu.premium ? ' 🙈' : ''}`
).join('\n')).join('\n')}
╰━━━━━━━━━━━━━━━━━━━━━━⬣
`
    }

    await conn.sendMessage(m.chat, { react: { text: '🌸', key: m.key } })

    let vidBuffer = await (await fetch('https://files.catbox.moe/nl3zrv.mp4')).buffer()
    await conn.sendMessage(
      m.chat,
      {
        video: vidBuffer,
        gifPlayback: true,
        caption: menuText,
        contextInfo: {
          mentionedJid: [userId],
          isForwarded: true
        }
      },
      { quoted: m }
    )

  } catch (e) {
    await conn.sendMessage(m.chat, { text: `❌ Error en el menú:\n${e}` }, { quoted: m })
  }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'menunakano', 'help', 'menuitsuki']
export default handler

function clockString(ms) {
  let d = Math.floor(ms / 86400000)
  let h = Math.floor(ms / 3600000) % 24
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  let texto = []
  if (d > 0) texto.push(`${d} ${d == 1 ? 'día' : 'días'}`)
  if (h > 0) texto.push(`${h} ${h == 1 ? 'hora' : 'horas'}`)
  if (m > 0) texto.push(`${m} ${m == 1 ? 'minuto' : 'minutos'}`)
  if (s > 0) texto.push(`${s} ${s == 1 ? 'segundo' : 'segundos'}`)
  return texto.length ? texto.join(', ') : '0 segundos'
}
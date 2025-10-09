let handler = async (m, { conn, usedPrefix, command }) => {

global.creador = [
  ['5216641784469', 'BrayanOFC-Li', true], // ID del creador
]

// 🧩 Validación: debe etiquetar o responder a alguien
if (!m.mentionedJid[0] && !m.quoted)
  return m.reply(`🐉 Debes mencionar o responder al usuario que deseas expulsar.\n\n📌 Ejemplo:\n${usedPrefix + command} @usuario`)

// 🎯 Obtiene el JID del usuario objetivo
let user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted.sender

// 🚫 No puede expulsarse el bot
if (user === conn.user.jid)
  return m.reply(`☁️ No puedo expulsarme a mí mismo.`)

// ✅ El creador puede hacer kick a cualquiera
const creadorJids = (global.creador || []).map(([id]) => id + '@s.whatsapp.net')
const isCreador = creadorJids.includes(m.sender)

// ⚙️ Verifica dueño del grupo
let owner
try {
  const groupMetadata = await conn.groupMetadata(m.chat)
  owner = groupMetadata.owner || groupMetadata.participants.find(p => p.admin === 'superadmin')?.id
} catch (err) {
  console.error('⚠️ Error al obtener dueño del grupo:', err)
}

// 🚫 Restricciones (solo si no es el creador)
if (!isCreador) {
  if (user === m.sender)
    return m.reply(`😅 No puedes expulsarte a ti mismo.`)
  if (creadorJids.includes(user))
    return m.reply(`⚡ No puedes expulsar al creador del bot.`)
  if (user === owner)
    return m.reply(`👑 No puedes expulsar al dueño del grupo.`)
}

// 👑 Expulsar
try {
  await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
  await conn.sendMessage(m.chat, {
    text: `🔮 *Expulsión exitosa*\n\n@${user.split('@')[0]} fue eliminado por @${m.sender.split('@')[0]}`,
    mentions: [user, m.sender]
  })
} catch (err) {
  console.error('❌ Error al expulsar:', err)
  m.reply(`⚠️ No se pudo expulsar al usuario. Verifica si el bot tiene permisos de administrador.`)
}
}

handler.help = ['kick @usuario', 'expulsar @usuario']
handler.tags = ['grupo']
handler.command = ['kick', 'expulsar']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
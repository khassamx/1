let handler = async (m, { conn, usedPrefix, command }) => {

global.creador = [
 ['5216641784469', 'BrayanOFC-Li', true], 
]

  // 🧩 Validación: debe etiquetar o responder a alguien
  if (!m.mentionedJid[0] && !m.quoted) 
    return m.reply(`🐉 Debes mencionar o responder al usuario que deseas expulsar.\n\n📌 Ejemplo:\n${usedPrefix + command} @usuario`)

  // 🎯 Obtiene el JID del usuario objetivo
  let user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted.sender

  // 🚫 No puede expulsarse a sí mismo ni al bot
  if (user === conn.user.jid)
    return m.reply(`☁️ No puedo expulsarme a mí mismo.`)
  if (user === m.sender)
    return m.reply(`😅 No puedes expulsarte a ti mismo.`)

  // 🛡️ Protección del creador
  const creadorJids = (global.creador || []).map(([id]) => id + '@s.whatsapp.net')
  if (creadorJids.includes(user))
    return m.reply(`⚡ No puedes expulsar al creador del bot.`)

  // 👑 Expulsar
  try {
    await conn.groupParticipantsUpdate(m.chat, [user], 'remove')
    m.reply(`🔮 El usuario fue eliminado con éxito.`)
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
// 📁 plugins/MIMI-Antilink.js
// 💜 MIMI ver. BTS — Protección AntiLink con encanto idol 🌸

let handler = async (m, { conn, usedPrefix, args, isAdmin, isBotAdmin }) => {
  try {
    if (!m.isGroup)
      return m.reply(`⚠️ Este comando solo puede usarse en grupos, oppa~ 💜`);

    if (!isAdmin)
      return m.reply(`🚫 Lo siento, solo los *administradores* pueden activar o desactivar el modo AntiLink 😿`);

    if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
      return m.reply(`
🎀 *Modo AntiLink — MIMI ver. BTS* 💜

✨ Protege el grupo eliminando enlaces molestos 🌸

🧭 Uso correcto:
• ${usedPrefix}antilink on  → Activar AntiLink  
• ${usedPrefix}antilink off → Desactivar AntiLink

💬 Ejemplo:
${usedPrefix}antilink on

💜 *MIMI cuidará el chat como una buena idol manager~!* 🎤
      `.trim())
    }

    // Inicializa base de datos si no existe
    if (!global.db) global.db = {}
    if (!global.db.data) global.db.data = {}
    if (!global.db.data.chats) global.db.data.chats = {}

    const chatData = global.db.data.chats[m.chat] || {}
    const action = args[0].toLowerCase()

    if (action === 'on') {
      chatData.antiLink = true
      await conn.sendMessage(
        m.chat,
        { text: `💜 Modo AntiLink ACTIVADO 🌸\n\nMIMI ahora protegerá el grupo con toda su energía idol~ 🎶` },
        { quoted: m }
      )
    } else {
      chatData.antiLink = false
      await conn.sendMessage(
        m.chat,
        { text: `❌ Modo AntiLink DESACTIVADO 💫\n\nMIMI dejará que todos compartan libremente~ 🎤` },
        { quoted: m }
      )
    }

    global.db.data.chats[m.chat] = chatData

  } catch (e) {
    console.error('💔 Error en MIMI-Antilink.js:', e)
    await m.reply(`😿 *Ups... algo salió mal, oppa~*\n\n🔧 Error: ${e.message}\n\n💜 MIMI lo arreglará pronto, ne~ 🌸`)
  }
}

handler.help = ['antilink on/off']
handler.tags = ['grupo', 'admin']
handler.command = ['antilink', 'antilinks']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
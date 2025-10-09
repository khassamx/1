// Antilink.js
// Comando para activar o desactivar AntiLink en grupos

let handler = async (m, { conn, usedPrefix, args, isAdmin, isBotAdmin }) => {
    try {
        if (!m.isGroup) 
            return m.reply(`⚠️ Este comando solo se puede usar en grupos.`);

        if (!isAdmin) 
            return m.reply(`⚠️ Solo los administradores pueden activar o desactivar AntiLink.`);

        if (!args[0] || !['on', 'off'].includes(args[0].toLowerCase())) {
            return m.reply(`📌 Uso correcto:\n• ${usedPrefix}antilink on  → Activar AntiLink\n• ${usedPrefix}antilink off → Desactivar AntiLink`);
        }

        // Inicializar base de datos si no existe
        if (!global.db) global.db = {}
        if (!global.db.data) global.db.data = {}
        if (!global.db.data.chats) global.db.data.chats = {}

        const chatData = global.db.data.chats[m.chat] || {}
        const action = args[0].toLowerCase()

        if (action === 'on') {
            chatData.antiLink = true
            await conn.sendMessage(m.chat, { text: '✅ AntiLink ACTIVADO para este grupo.' }, { quoted: m })
        } else {
            chatData.antiLink = false
            await conn.sendMessage(m.chat, { text: '❌ AntiLink DESACTIVADO para este grupo.' }, { quoted: m })
        }

        global.db.data.chats[m.chat] = chatData

    } catch (e) {
        console.error('❌ Error en Antilink.js:', e)
        await m.reply(`❌ Ocurrió un error al procesar el comando AntiLink.\nDetalles: ${e.message}`)
    }
}

handler.help = ['antilink on/off']
handler.tags = ['grupo', 'admin']
handler.command = ['antilink', 'antilinks']
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler
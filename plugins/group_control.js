// 📁 plugins/group_control.js

const handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
    
    if (!isOwner) {
        return m.reply('Este comando es solo para mi Creador.');
    }

    if (!m.isGroup) {
        return m.reply('Este comando solo funciona en grupos.');
    }

    const chatId = m.chat;
    // Asegurarse de que global.blockedgroups exista
    global.blockedgroups = global.blockedgroups || new Set();

    if (command === 'addgrupo') {
        // Función: BLOQUEAR el grupo (el bot NO responderá comandos)
        if (global.blockedgroups.has(chatId)) {
            return m.reply('⚠️ Este grupo ya estaba bloqueado (Blacklist).');
        }
        global.blockedgroups.add(chatId);
        m.reply(`✅ Grupo agregado a la lista negra (Blacklist). A partir de ahora, NO responderé comandos aquí. Usa ${usedPrefix}addbotx para reactivarme.`);
        
    } else if (command === 'addbotx') {
        // Función: DESBLOQUEAR el grupo (el bot SÍ responderá comandos)
        if (!global.blockedgroups.has(chatId)) {
            return m.reply('⚠️ Este grupo no estaba en la lista negra (Blacklist).');
        }
        global.blockedgroups.delete(chatId);
        m.reply(`✅ Grupo eliminado de la lista negra. Ahora SÍ responderé comandos aquí. Usa ${usedPrefix}addgrupo para desactivarme.`);
    }
};

handler.help = ['addgrupo', 'addbotx'];
handler.tags = ['owner'];
handler.command = ['addgrupo', 'addbotx'];
handler.owner = true; // Solo el owner puede usarlo

export default handler;
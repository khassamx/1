// 📁 plugins/group_control.js (Lógica de Lista Blanca)

const handler = async (m, { conn, args, usedPrefix, command, isOwner }) => {
    
    if (!isOwner) {
        return m.reply('Este comando es solo para mi Creador (Owner).');
    }

    if (!m.isGroup) {
        return m.reply('Este comando solo funciona en grupos.');
    }

    const chatId = m.chat;
    // CRÍTICO: Usamos allowedGroups (grupos permitidos)
    global.allowedGroups = global.allowedGroups || new Set();

    if (command === 'addgrupo') {
        // Función: ACTIVAR el grupo (el bot SÍ responderá comandos)
        if (global.allowedGroups.has(chatId)) {
            return m.reply('⚠️ Este grupo ya estaba activo. El bot ya puede ser usado.');
        }
        global.allowedGroups.add(chatId);
        m.reply(`✅ Grupo activado. Ahora SÍ responderé comandos aquí. Usa ${usedPrefix}removegrupo para desactivarme.`);
        
    } else if (command === 'removegrupo' || command === 'addbotx') {
        // Función: DESACTIVAR el grupo (el bot NO responderá comandos)
        if (!global.allowedGroups.has(chatId)) {
            return m.reply('⚠️ Este grupo no estaba activo.');
        }
        global.allowedGroups.delete(chatId);
        m.reply(`✅ Grupo desactivado. A partir de ahora, NO responderé comandos aquí, incluyendo el menú. Solo responderé a los comandos de activación/desactivación.`);
    }
};

handler.help = ['addgrupo', 'removegrupo'];
handler.tags = ['owner'];
handler.command = ['addgrupo', 'removegrupo', 'addbotx']; // Añadimos addbotx como alias de remuevo
handler.owner = true; 

export default handler;
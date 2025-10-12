// 📁 plugins/menu2.js (Solo lista los comandos de la categoría)

const categoryMap = {
    'Grupos': ['grupo'],
    'Descargas': ['descargas', 'sticker'], 
    'Info/Utilidades': ['info', 'sistema', 'menu'], 
    'Creador/Owner': ['owner'],
};


const handler = async (m, { conn, isOwner, isPrems, text }) => {

    // 1. CHEQUEO RÁPIDO: Solo funciona si se llama con una categoría (ej: !menu2 Grupos)
    if (!text) return; 

    // Obtener roles y permisos para filtrar comandos
    const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
    const isROwner = [...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, "") + detectwhat).includes(m.sender);
    const isOwnerBot = isROwner || m.fromMe;

    const checkPermission = (plugin) => {
        if (plugin.rowner && !isROwner) return false;
        if (plugin.owner && !isOwnerBot) return false;
        if (plugin.premium && !isPrems) return false;
        return true;
    }

    // 2. ENCONTRAR LA CATEGORÍA SOLICITADA
    const query = text.trim();
    const foundCategoryKey = Object.keys(categoryMap).find(key => query.toLowerCase() === key.toLowerCase());

    if (!foundCategoryKey) {
        return conn.reply(m.chat, '❌ Categoría de comando no reconocida.', m);
    }
    
    // 3. RECOPILAR COMANDOS DE LA CATEGORÍA
    const commandsToDisplay = [];
    const tagsToMatch = categoryMap[foundCategoryKey];
    
    for (const name in global.plugins) {
        const plugin = global.plugins[name];
        
        if (plugin.command && !plugin.disabled && checkPermission(plugin)) {
            const tags = Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags];
            
            if (tagsToMatch.some(tag => tags.includes(tag))) {
                const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
                commands.forEach(cmd => {
                    if (typeof cmd === 'string' && cmd !== 'menu' && cmd !== 'menu2') {
                        commandsToDisplay.push(`!${cmd}`);
                    }
                });
            }
        }
    }

    // 4. CONSTRUIR Y ENVIAR LA LISTA
    if (commandsToDisplay.length === 0) {
        return conn.reply(m.chat, `⚠️ No hay comandos disponibles en la categoría **${foundCategoryKey}** para tu rol.`, m);
    }

    let commandList = `
╭──「 📚 **${foundCategoryKey.toUpperCase()}** 」
│ 
│ *Total Comandos:* ${commandsToDisplay.length}
│ 
*╰───────────────*
`.trim();
        
    commandList += commandsToDisplay.sort().map(cmd => `\n• \`${cmd}\``).join('');

    conn.reply(m.chat, commandList.trim(), m);
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['menu2'];
handler.tags = ['hidden']; // Etiqueta oculta para que no aparezca en el menú
handler.command = ['menu2'];
handler.owner = false; // No es necesario ser owner, pero debe existir

export default handler;
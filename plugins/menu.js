// 📁 plugins/menu.js (Versión de Solo Texto)

const categoryMap = {
    'menu': '📋 Menú',
    'info': 'ℹ️ Info/Utilidades',
    'descargas': '⬇️ Descargas',
    'sticker': '🖼️ Stickers/Media',
    'grupo': '👥 Grupos',
    'owner': '👑 Creador/Owner',
    'sistema': '⚙️ Sistema', 
};

const handler = async (m, { conn, isOwner, isPrems, usedPrefix }) => {

    // 0. OBTENER PERMISOS
    const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
    const isROwner = [...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, "") + detectwhat).includes(m.sender);
    const isOwnerBot = isROwner || m.fromMe;
    
    // Función para verificar si el usuario tiene permiso para ver un comando
    const checkPermission = (plugin) => {
        if (plugin.rowner && !isROwner) return false;
        if (plugin.owner && !isOwnerBot) return false;
        if (plugin.premium && !isPrems) return false;
        return true;
    }
    
    // 1. OBTENER Y CATEGORIZAR COMANDOS
    const categorizedCommands = {};
    for (const tag in categoryMap) {
        categorizedCommands[tag] = [];
    }

    for (const name in global.plugins) {
        const plugin = global.plugins[name];
        
        if (plugin.command && !plugin.disabled && checkPermission(plugin)) {
            const tags = Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags];
            
            for (const tag of tags) {
                // Si la etiqueta está en nuestras categorías, añadimos el comando
                if (categorizedCommands[tag]) {
                    const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
                    commands.forEach(cmd => {
                        if (typeof cmd === 'string' && cmd !== 'menu') {
                            categorizedCommands[tag].push(cmd);
                        }
                    });
                    break; // Solo necesitamos añadirlo a una categoría
                }
            }
        }
    }

    // 2. CONSTRUCCIÓN DEL MENSAJE DE TEXTO

    let menuText = `
*╭──「 👑 ${global.namebot} 」*
*│*
*│* 👋 *¡Hola, ${m.name}!*
*│* 👤 *Estado:* ${isOwnerBot ? 'Creador' : isPrems ? 'Premium' : 'Usuario'}
*│* 🗓️ *Fecha:* ${new Date().toLocaleDateString('es-ES', { timeZone: 'America/Asuncion' })}
*│* 🕒 *Hora:* ${new Date().toLocaleTimeString('es-ES', { timeZone: 'America/Asuncion' })}
*│* *╰───────────────*
    
*╭──「 📜 COMANDOS DISPONIBLES 」*
`.trim();

    // Iterar sobre las categorías para construir el menú
    for (const tag in categoryMap) {
        const title = categoryMap[tag];
        const commands = categorizedCommands[tag];
        
        if (commands.length > 0) {
            menuText += `\n*│*`;
            menuText += `\n*│ ❰ ${title} ❱*`;
            menuText += '\n*│*';
            
            commands.sort().forEach(cmd => {
                menuText += `\n*│* • \`${usedPrefix}${cmd}\``;
            });
            menuText += '\n*│*';
        }
    }

    menuText += `
*╰───────────────*
    
*👑 Contacto Owner:* ${usedPrefix}owner
    
`.trim();

    // 3. ENVÍO DEL MENSAJE DE SOLO TEXTO
    conn.reply(m.chat, menuText, m);
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['menu', 'help'];
handler.tags = ['menu'];
handler.command = ['menu', 'help', 'menú', 'ayuda'];

export default handler;
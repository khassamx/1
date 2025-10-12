// 📁 plugins/menu.js (Versión con Botones)

import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

// Mapeo de categorías a etiquetas de comando
const categoryMap = {
    'Grupos': ['grupo'],
    'Descargas': ['descargas', 'sticker'], // Combina descargas y stickers
    'Info/Utilidades': ['info', 'sistema'],
    'Creador/Owner': ['owner'],
};

const handler = async (m, { conn, isOwner, isPrems, usedPrefix }) => {

    // Obtener roles y permisos para filtrar comandos
    const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
    const isROwner = [...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, "") + detectwhat).includes(m.sender);
    const isOwnerBot = isROwner || m.fromMe;
    
    // Función para verificar si el usuario tiene permiso para un comando
    const checkPermission = (plugin) => {
        if (plugin.rowner && !isROwner) return false;
        if (plugin.owner && !isOwnerBot) return false;
        if (plugin.premium && !isPrems) return false;
        // Agrega aquí más cheques de isMods, isAdmin, etc., si los usas
        return true;
    }
    
    // 1. OBTENER Y CATEGORIZAR COMANDOS (para la sección de texto)
    const categorizedCommands = {};
    for (const key in categoryMap) {
        categorizedCommands[key] = [];
    }
    
    for (const name in global.plugins) {
        const plugin = global.plugins[name];
        
        if (plugin.command && !plugin.disabled && checkPermission(plugin)) {
            const tags = Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags];
            
            for (const key in categoryMap) {
                if (categoryMap[key].some(tag => tags.includes(tag))) {
                    const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
                    commands.forEach(cmd => {
                        if (typeof cmd === 'string' && cmd !== 'menu') { // Excluir el propio comando !menu
                            categorizedCommands[key].push(`!${cmd}`);
                        }
                    });
                    break;
                }
            }
        }
    }


    // 2. CONSTRUCCIÓN DEL MENSAJE DE TEXTO (HEADER)

    let menuText = `
*╭──「 👑 ${global.namebot} 」*
*│*
*│* 👋 *¡Hola, ${m.name}!*
*│* 👤 *Estado:* ${isOwnerBot ? 'Creador' : isPrems ? 'Premium' : 'Usuario'}
*│* 🗓️ *Fecha:* ${new Date().toLocaleDateString('es-ES', { timeZone: 'America/Asuncion' })}
*│* 🕒 *Hora:* ${new Date().toLocaleTimeString('es-ES', { timeZone: 'America/Asuncion' })}
*│* *╰───────────────*
    
*╭──「 📚 GUÍA DE COMANDOS 」*
*│* *│* *Toca un botón para ver los comandos de esa categoría.*
*│* *│* *Ejemplo:* Usa \`!ping\`
*│*
*╰───────────────*
    
`.trim();

    // 3. DEFINICIÓN DE BOTONES
    const buttons = [];
    
    // Botones de Comando (Texto)
    for (const key in categorizedCommands) {
        // Creamos un botón de texto para cada categoría
        buttons.push({
            buttonId: `${usedPrefix}comandos ${key}`, // Comando interno para listar la categoría
            buttonText: { displayText: `❰ ${key} ❱` },
            type: 1
        });
    }

    // Botón de Enlace para el Creador (URL/Link)
    buttons.push({
        buttonId: usedPrefix + 'owner', // El botón redirige al comando !owner
        buttonText: { displayText: `👑 Contactar Creador` },
        type: 1
    });

    // 4. PREPARACIÓN DEL OBJETO DEL MENSAJE
    const thumbnailBuffer = global.catalogo 
        ? (await conn.getFile(global.catalogo).data) 
        : Buffer.from(""); 

    const buttonMessage = {
        image: thumbnailBuffer, 
        caption: menuText,
        footer: `🫡 Creador: ${global.owner[0][1] || 'Owner'} | ${global.dev}`,
        headerType: 4, // 4 = IMAGE / 1 = TEXT
        buttons: buttons,
    };
    
    // 5. ENVÍO DEL MENSAJE CON BOTONES
    
    // Si el usuario solo escribe !menu, enviamos el menú principal con botones
    if (!m.text || !m.text.toLowerCase().startsWith('comandos')) {
        return conn.sendMessage(m.chat, buttonMessage, { quoted: m });
    }

    // 6. LÓGICA DE LISTADO DE COMANDOS (Si el usuario presionó un botón)
    const query = m.text.toLowerCase().replace('comandos', '').trim();
    const foundCategory = Object.keys(categoryMap).find(key => query.includes(key.toLowerCase()));

    if (foundCategory) {
        const commands = categorizedCommands[foundCategory];
        let commandList = `
╭──「 📚 **${foundCategory.toUpperCase()}** 」
│ 
│ *Total Comandos:* ${commands.length}
│ 
*╰───────────────*
`.trim();
        
        commandList += commands.sort().map(cmd => `\n• \`${cmd}\``).join('');

        conn.reply(m.chat, commandList.trim(), m);
        
    } else {
        // Si el query es inválido, mostramos un error simple.
        conn.reply(m.chat, '❌ Categoría de comando no reconocida. Intenta de nuevo.', m);
    }
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['menu', 'help'];
handler.tags = ['menu'];
handler.command = ['menu', 'help', 'menú', 'ayuda', 'comandos']; // Añadimos 'comandos' para la lógica interna

export default handler;
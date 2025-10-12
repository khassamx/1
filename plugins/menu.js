// 📁 plugins/menu.js (Versión Única y Robusta con Listado Interno)

import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import fs from 'fs'; 

// Mapeo de categorías a etiquetas de comando
const categoryMap = {
    'Grupos': ['grupo'],
    'Descargas': ['descargas', 'sticker'], 
    'Info/Utilidades': ['info', 'sistema', 'menu'], 
    'Creador/Owner': ['owner'],
};

// Función de ayuda para obtener la lista de comandos de una categoría
const getCommandList = (categoryKey, isROwner, isOwnerBot, isPrems) => {
    
    const tagsToMatch = categoryMap[categoryKey];
    if (!tagsToMatch) return '❌ Categoría de comando no reconocida.';
    
    const commandsToDisplay = [];
    
    // Filtro de permisos
    const checkPermission = (plugin) => {
        if (plugin.rowner && !isROwner) return false;
        if (plugin.owner && !isOwnerBot) return false;
        if (plugin.premium && !isPrems) return false;
        return true;
    }

    for (const name in global.plugins) {
        const plugin = global.plugins[name];
        
        if (plugin.command && !plugin.disabled && checkPermission(plugin)) {
            const tags = Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags];
            
            if (tagsToMatch.some(tag => tags.includes(tag))) {
                const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
                commands.forEach(cmd => {
                    if (typeof cmd === 'string' && cmd !== 'menu' && cmd !== 'comandos') {
                        commandsToDisplay.push(`!${cmd}`);
                    }
                });
            }
        }
    }

    if (commandsToDisplay.length === 0) {
        return `⚠️ No hay comandos disponibles en la categoría **${categoryKey}** para tu rol.`;
    }

    let commandList = `
╭──「 📚 **${categoryKey.toUpperCase()}** 」
│ 
│ *Total Comandos:* ${commandsToDisplay.length}
│ 
*╰───────────────*
`.trim();
        
    commandList += commandsToDisplay.sort().map(cmd => `\n• \`${cmd}\``).join('');
    
    return commandList.trim();
};


// ----------------------------------------------------------------------
// 🎯 HANDLER PRINCIPAL
// ----------------------------------------------------------------------

const handler = async (m, { conn, isOwner, isPrems, usedPrefix, text }) => {

    // 0. OBTENER PERMISOS
    const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
    const isROwner = [...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, "") + detectwhat).includes(m.sender);
    const isOwnerBot = isROwner || m.fromMe;
    
    // 1. LÓGICA DE RESPUESTA A BOTONES (LISTADO)
    // Se dispara si el mensaje empieza con !comandos (mensaje de texto generado por el botón)
    if (m.text && m.text.toLowerCase().startsWith('comandos')) {
        const query = m.text.toLowerCase().replace('comandos', '').trim();
        const foundCategoryKey = Object.keys(categoryMap).find(key => query.includes(key.toLowerCase()));
        
        if (foundCategoryKey) {
            const list = getCommandList(foundCategoryKey, isROwner, isOwnerBot, isPrems);
            return conn.reply(m.chat, list, m);
        } else {
             // Si presiona el botón, pero la categoría no se encuentra
             return conn.reply(m.chat, '❌ Error al procesar el botón de categoría. Intenta de nuevo con `!menu`', m);
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
*│*
*╰───────────────*
    
`.trim();

    // 3. DEFINICIÓN DE BOTONES
    const buttons = [];
    
    // Botones de Comando (Texto). Apuntan a !comandos
    for (const key in categoryMap) {
        buttons.push({
            // El buttonId ahora es !comandos <NombreCategoria>
            buttonId: `${usedPrefix}comandos ${key}`, 
            buttonText: { displayText: `❰ ${key} ❱` },
            type: 1
        });
    }

    // Botón para el Creador
    buttons.push({
        buttonId: usedPrefix + 'owner', 
        buttonText: { displayText: `👑 Contactar Creador` },
        type: 1
    });

    
    // 4. PREPARACIÓN Y ENVÍO ROBUSTO (con manejo de errores de imagen)
    let media = null;
    let caption = menuText;
    let footer = `🫡 Creador: ${global.owner[0][1] || 'Owner'} | ${global.dev}`;

    try {
        if (global.catalogo) {
            media = await conn.getFile(global.catalogo);
            if (media?.data && media.data.length > 0) {
                 media = media.data; 
            } else {
                 media = null; 
            }
        }
    } catch (e) {
        console.error('❌ Error al obtener la imagen del catálogo para el menú:', e.message);
        media = null; 
    }
    
    // Enviar mensaje con o sin imagen
    const messagePayload = media 
        ? { image: media, caption: caption, footer: footer, headerType: 4, buttons: buttons }
        : { text: caption, footer: footer, buttons: buttons, headerType: 1 };
        
    // 5. ENVÍO DEL MENÚ PRINCIPAL
    await conn.sendMessage(m.chat, messagePayload, { quoted: m });
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['menu', 'help'];
handler.tags = ['menu'];
handler.command = ['menu', 'help', 'menú', 'ayuda', 'comandos']; // Añadimos 'comandos'

export default handler;
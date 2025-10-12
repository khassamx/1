// 📁 plugins/menu.js (Versión con Botones Final y Corregida)

import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import fs from 'fs'; 

// Mapeo de categorías a etiquetas de comando
const categoryMap = {
    'Grupos': ['grupo'],
    'Descargas': ['descargas', 'sticker'], // Combina descargas y stickers
    'Info/Utilidades': ['info', 'sistema', 'menu'], // Añadimos 'menu' a info
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
        return true;
    }
    
    // 1. OBTENER Y CATEGORIZAR COMANDOS
    const categorizedCommands = {};
    for (const key in categoryMap) {
        categorizedCommands[key] = [];
    }
    
    for (const name in global.plugins) {
        const plugin = global.plugins[name];
        
        if (plugin.command && !plugin.disabled && checkPermission(plugin)) {
            // ❌ CORRECCIÓN CRÍTICA: Cambiamos 'tags' por 'plugin.tags' 
            const tags = Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags];
            
            for (const key in categoryMap) {
                if (categoryMap[key].some(tag => tags.includes(tag))) {
                    const commands = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
                    commands.forEach(cmd => {
                        if (typeof cmd === 'string' && cmd !== 'menu') {
                            categorizedCommands[key].push(`!${cmd}`);
                        }
                    });
                    // Agregamos break para evitar duplicados si un plugin tiene múltiples etiquetas en la misma categoría
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
*│*
*╰───────────────*
    
`.trim();

    // 3. DEFINICIÓN DE BOTONES
    const buttons = [];
    
    // Botones de Comando (Texto)
    for (const key in categorizedCommands) {
        if (categorizedCommands[key].length > 0) {
            buttons.push({
                buttonId: `${usedPrefix}comandos ${key}`, 
                buttonText: { displayText: `❰ ${key} ❱` },
                type: 1
            });
        }
    }

    // Botón de Enlace para el Creador
    buttons.push({
        buttonId: usedPrefix + 'owner', 
        buttonText: { displayText: `👑 Contactar Creador` },
        type: 1
    });

    
    // 4. PREPARACIÓN DE LA IMAGEN (Manejo de errores)
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
                 console.log('⚠️ Aviso: La URL del catálogo no devolvió datos válidos. Usando solo texto.');
            }
        }
    } catch (e) {
        console.error('❌ Error al obtener la imagen del catálogo para el menú:', e.message);
        media = null; 
    }
    
    // 5. ENVÍO ROBUSTO DEL MENSAJE
    
    if (media) {
        const buttonMessage = {
            image: media, 
            caption: caption,
            footer: footer,
            headerType: 4, 
            buttons: buttons,
        };
        await conn.sendMessage(m.chat, buttonMessage, { quoted: m });

    } else {
        // Enviar solo con texto y botones (Si falló la imagen)
         const buttonMessage = {
            text: caption,
            footer: footer,
            buttons: buttons,
            headerType: 1
        };
        await conn.sendMessage(m.chat, buttonMessage, { quoted: m });
    }
    
    // 6. LÓGICA DE LISTADO DE COMANDOS (Si el usuario presionó un botón)
    const query = m.text.toLowerCase().replace('comandos', '').trim();
    const foundCategory = Object.keys(categoryMap).find(key => query.includes(key.toLowerCase()));

    if (m.text && m.text.toLowerCase().startsWith('comandos') && foundCategory) {
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
        
    } else if (m.text && m.text.toLowerCase().startsWith('comandos')) {
        conn.reply(m.chat, '❌ Categoría de comando no reconocida. Intenta de nuevo.', m);
    }
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['menu', 'help'];
handler.tags = ['menu'];
handler.command = ['menu', 'help', 'menú', 'ayuda', 'comandos'];

export default handler;
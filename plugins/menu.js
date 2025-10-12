// 📁 plugins/menu.js (Solo Envía el Menú Principal con Botones)

import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

// Mapeo de categorías a etiquetas de comando
const categoryMap = {
    'Grupos': ['grupo'],
    'Descargas': ['descargas', 'sticker'], 
    'Info/Utilidades': ['info', 'sistema', 'menu'], 
    'Creador/Owner': ['owner'],
};

const handler = async (m, { conn, isOwner, isPrems, usedPrefix }) => {

    // Obtener roles y permisos (necesario solo para el header)
    const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
    const isROwner = [...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, "") + detectwhat).includes(m.sender);
    const isOwnerBot = isROwner || m.fromMe;
    
    
    // 1. CONSTRUCCIÓN DEL MENSAJE DE TEXTO (HEADER)

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

    // 2. DEFINICIÓN DE BOTONES
    const buttons = [];
    
    // Botones de Comando (Texto). Apuntan a !menu2
    for (const key in categoryMap) {
        buttons.push({
            // CRÍTICO: El buttonId apunta ahora al nuevo comando !menu2
            buttonId: `${usedPrefix}menu2 ${key}`, 
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

    
    // 3. PREPARACIÓN Y ENVÍO ROBUSTO (con manejo de errores de imagen)
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
        
    await conn.sendMessage(m.chat, messagePayload, { quoted: m });
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['menu', 'help'];
handler.tags = ['menu'];
handler.command = ['menu', 'help', 'menú', 'ayuda']; // Ya no incluye 'comandos'

export default handler;
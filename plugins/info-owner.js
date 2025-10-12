// 📁 plugins/info-owner.js

import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import fs from 'fs'; // Necesario para leer la imagen si es local

const handler = async (m, { conn }) => {
    
    // 1. OBTENER LA INFORMACIÓN DEL CREADOR PRINCIPAL
    const ownerData = global.owner[0];
    
    if (!ownerData || !ownerData[0]) {
        return conn.reply(m.chat, '❌ Error: La información del creador no está definida correctamente en config.js.', m);
    }
    
    const numeroOwner = ownerData[0].replace(/[^0-9]/g, ''); 
    const nombreOwner = ownerData[1] || 'Owner del Bot';
    
    // Obtener los enlaces de config.js
    const canal = global.channel || 'https://whatsapp.com/';
    const instagram = global.ch?.ch3 || 'https://instagram.com/'; // De config.js
    
    // Usamos el catálogo como miniatura
    const thumbnailBuffer = global.catalogo 
        ? (await conn.getFile(global.catalogo).data) 
        : Buffer.from(""); 

    // 2. CREAR EL VCF (Virtual Contact File)
    const vcard = 
`BEGIN:VCARD
VERSION:3.0
FN:${nombreOwner}
ORG:;
TITLE:👑 Creador Vegeta-Bot-MB
TEL;type=CELL;type=VOICE;waid=${numeroOwner}:+${numeroOwner}
X-SOCIALSTATUS:Soy el creador del bot. ¡Hola!
END:VCARD`;

    // 3. ENVIAR EL CONTACTO USANDO generateWAMessageFromContent
    // Esto incrusta el VCF en un mensaje con un Fake Reply (botones con enlaces).
    let msg = await generateWAMessageFromContent(m.chat, {
        "contactMessage": {
            "displayName": nombreOwner,
            "vcard": vcard,
            "jpegThumbnail": thumbnailBuffer,
            "contextInfo": {
                "mentionedJid": [m.sender],
                "forwardingScore": 999,
                "isForwarded": true,
                "externalAdReply": {
                    "showAdAttribution": true,
                    "renderLargerThumbnail": true,
                    // Título que actúa como mensaje principal
                    "title": `⭐ 👑 CREADOR DE ${global.namebot} 👑 ⭐`, 
                    
                    // Cuerpo que funciona como "botón" de Instagram
                    "body": `⚡️ TOCA AQUÍ PARA MI INSTAGRAM ⚡️`, 
                    
                    "mediaType": 1, // Tipo de media (imagen)
                    "thumbnail": thumbnailBuffer,
                    
                    // El sourceUrl es el enlace principal del "botón"
                    "sourceUrl": instagram // <-- Enlace de Instagram
                },
                "externalAdReply2": { // Segundo Fake Reply (Nuevo)
                    "showAdAttribution": true,
                    "renderLargerThumbnail": true,
                    "title": `🔗 CANAL DE COMUNIDAD: ${nombreOwner}`,
                    "body": `🔥 TOCA AQUÍ PARA IR AL CANAL 🔥`,
                    "mediaType": 1, 
                    "thumbnail": thumbnailBuffer,
                    "sourceUrl": canal // <-- Enlace del Canal
                }
            }
        }
    }, { quoted: m });
    
    // 4. ENVIAR EL MENSAJE
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });

};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['owner'];
handler.tags = ['info'];
handler.command = ['owner', 'creador', 'contactar'];

export default handler;
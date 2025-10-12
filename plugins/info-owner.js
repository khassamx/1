// 📁 plugins/info-owner.js

import { generateWAMessageFromContent } from '@whiskeysockets/baileys';

const handler = async (m, { conn }) => {
    
    // 1. OBTENER LA INFORMACIÓN DEL CREADOR PRINCIPAL
    // Tomamos el primer elemento de global.owner, que es el creador principal.
    const ownerData = global.owner[0];
    
    // Aseguramos que ownerData exista y tenga al menos el número (índice 0)
    if (!ownerData || !ownerData[0]) {
        return conn.reply(m.chat, '❌ Error: La información del creador no está definida correctamente en config.js.', m);
    }
    
    // Extraemos la información del array:
    // [0] = Número, [1] = Nombre/Alias, [2] = isOwnerVerificado (true/false)
    const numeroOwner = ownerData[0].replace(/[^0-9]/g, ''); // Limpiamos el número
    const nombreOwner = ownerData[1] || 'Owner del Bot';
    
    // Obtener el enlace de Instagram y Canal
    const canal = global.channel || 'No disponible';
    const instagram = global.ch?.ch3 || 'No disponible'; // Asumiendo ch3 es Instagram

    // 2. CREAR EL VCF (Virtual Contact File)
    const vcard = 
`BEGIN:VCARD
VERSION:3.0
FN:${nombreOwner}
ORG:;
TEL;type=CELL;type=VOICE;waid=${numeroOwner}:+${numeroOwner}
X-SOCIALSTATUS:Soy el creador de VEGETA-BOT-MB!
X-WA-BIZ-NAME:${nombreOwner}
END:VCARD`;

    // 3. MENSAJE CON INFO Y ENLACES (Para enviar junto al VCF)
    const infoMensaje = `
🌟 *INFORMACIÓN DEL CREADOR* 🌟

*Alias:* ${nombreOwner}
*Número:* +${numeroOwner}

🔗 *Enlaces Adicionales:*
*Canal/Comunidad:* ${canal}
*Instagram:* ${instagram}

*Guarda este contacto para chatear conmigo.*
`.trim();

    // 4. GENERAR Y ENVIAR EL MENSAJE VCF
    let msg = await generateWAMessageFromContent(m.chat, {
        "contactMessage": {
            "displayName": nombreOwner,
            "vcard": vcard,
            "jpegThumbnail": global.catalogo ? await conn.getFile(global.catalogo).data : Buffer.from(""),
            "contextInfo": {
                "mentionedJid": [m.sender],
                "forwardingScore": 999,
                "isForwarded": true,
                "externalAdReply": {
                    "showAdAttribution": true,
                    "renderLargerThumbnail": true,
                    "title": `⭐ ${nombreOwner} | Creador`,
                    "body": "Toca aquí para ver los enlaces",
                    "mediaType": 1, 
                    "thumbnail": global.catalogo ? await conn.getFile(global.catalogo).data : Buffer.from(""),
                    "sourceUrl": canal // Usamos el canal como fuente del enlace
                }
            }
        }
    }, { quoted: m });
    
    // 5. ENVIAR EL TEXTO Y EL VCF
    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    
    // Enviamos la información textual
    conn.reply(m.chat, infoMensaje, m);
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['owner'];
handler.tags = ['info'];
handler.command = ['owner', 'creador', 'contactar'];

export default handler;
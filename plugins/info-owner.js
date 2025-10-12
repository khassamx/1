// 📁 plugins/info-owner.js

// Nota: No necesitamos generateWAMessageFromContent ni importarla.

const handler = async (m, { conn }) => {
    
    // 1. OBTENER LA INFORMACIÓN DEL CREADOR PRINCIPAL
    const ownerData = global.owner[0];
    
    if (!ownerData || !ownerData[0]) {
        return conn.reply(m.chat, '❌ Error: La información del creador no está definida correctamente en config.js.', m);
    }
    
    // Extraemos la información del array:
    const numeroOwner = ownerData[0].replace(/[^0-9]/g, ''); // Limpiamos el número
    const nombreOwner = ownerData[1] || 'Owner del Bot';
    
    // Obtener el enlace de Instagram y Canal
    const canal = global.channel || 'No disponible';
    const instagram = global.ch?.ch3 || 'No disponible';

    // 2. CREAR EL VCF (Virtual Contact File) para sendContact
    const vcard = 
`BEGIN:VCARD
VERSION:3.0
FN:${nombreOwner}
ORG:;
TEL;type=CELL;type=VOICE;waid=${numeroOwner}:+${numeroOwner}
X-SOCIALSTATUS:Soy el creador de VEGETA-BOT-MB!
X-WA-BIZ-NAME:${nombreOwner}
END:VCARD`;

    // 3. MENSAJE CON INFO ADICIONAL Y ENLACES (Se envía ANTES del contacto)
    const infoMensaje = `
🌟 *INFORMACIÓN DEL CREADOR* 🌟

*Alias:* ${nombreOwner}
*Número:* +${numeroOwner}

🔗 *Enlaces Adicionales:*
*Canal/Comunidad:* ${canal}
*Instagram:* ${instagram}

*A continuación, verás la tarjeta de contacto de WhatsApp para guardarme.*
`.trim();
    
    // 4. ENVIAR EL TEXTO INFORMATIVO
    await conn.reply(m.chat, infoMensaje, m);
    
    // 5. ENVIAR EL CONTACTO NATIVO DE WHATSAPP (VCF)
    // conn.sendContact(jid, VCF, quoted, opts)
    await conn.sendContact(m.chat, [
        [numeroOwner, nombreOwner, true]
    ], m, { 
        // Caption opcional para acompañar el contacto
        caption: `Contacto de ${nombreOwner}`,
        // Incluir la tarjeta vcard completa si es necesario para información extra
        vcard: vcard 
    });
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['owner'];
handler.tags = ['info'];
handler.command = ['owner', 'creador', 'contactar'];

export default handler;
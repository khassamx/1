// 📁 plugins/owner-monitor-error.js

// Almacenamos el último error globalmente
global.lastError = { time: null, message: null, sender: null, chat: null, command: null };

/**
 * Función que se ejecuta DESPUÉS de cualquier plugin.
 * Si el plugin falló, registra el error.
 */
export async function after(m, { conn, __filename }) {
    // Solo si hay un error en el objeto del mensaje (m.error es establecido por handler.js)
    if (m.error) {
        const error = m.error;
        
        // Formatear el error
        const errorMessage = `
--- ❌ ERROR DETECTADO ---
*Comando:* ${m.plugin ? `!${m.command} (Plugin: ${m.plugin})` : 'N/A'}
*Usuario:* @${m.sender.split('@')[0]}
*Chat:* ${m.isGroup ? await conn.getName(m.chat) : 'Privado'}
*Mensaje:* ${m.text ? m.text.slice(0, 50) + (m.text.length > 50 ? '...' : '') : 'N/A'}
*Fecha/Hora:* ${new Date().toLocaleString('es-ES', { timeZone: 'America/Asuncion' })}

\`\`\`
${error.stack ? error.stack : String(error)}
\`\`\`
--------------------------
`.trim();

        // 1. Guardar el último error
        global.lastError = {
            time: Date.now(),
            message: errorMessage,
            sender: m.sender,
            chat: m.chat,
            command: m.command,
        };

        // 2. Enviar el error al Owner principal
        const ownerID = global.owner?.[0]?.[0] ? global.owner[0][0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;
        
        if (ownerID) {
            try {
                // Envía el error solo al owner y lo etiqueta
                await conn.reply(ownerID, '🚨 ERROR EN EJECUCIÓN 🚨\n' + errorMessage, null, { mentions: [m.sender] });
            } catch (e) {
                console.error('❌ No se pudo enviar el error al Owner:', e);
            }
        }
        
        // Opcional: Loguear en consola (ya lo hace handler.js, pero es bueno tenerlo aquí)
        console.error(errorMessage);
    }
    return true;
}

/**
 * Handler para el comando !error (Manual)
 */
const handler = async (m, { conn, isOwner }) => {
    
    if (!isOwner) {
        return global.dfail('owner', m, conn);
    }

    if (!global.lastError.time) {
        return conn.reply(m.chat, '✅ No se ha detectado ningún error reciente desde el último reinicio.', m);
    }

    const { time, message } = global.lastError;
    const timeElapsed = Date.now() - time;
    const minutesElapsed = Math.floor(timeElapsed / 60000);

    const replyMessage = `
--- 🚨 ÚLTIMO ERROR REGISTRADO ---
*Ocurrió hace:* ${minutesElapsed} minutos.

${message}
`.trim();

    conn.reply(m.chat, replyMessage, m, { mentions: [global.lastError.sender] });
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================

handler.help = ['error'];
handler.tags = ['owner'];
handler.command = ['error', 'latest-error'];
handler.owner = true; // Solo el Owner puede usar el comando

export default handler;
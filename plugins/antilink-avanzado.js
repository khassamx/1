// 📁 plugins/antilink-avanzado.js (Para antiLink2)

// ===================================================
// 🧠 CONSTANTES Y EXPRESIONES REGULARES
// ===================================================

// Regex general para cualquier URL (HTTP/HTTPS/WWW)
const linkRegex = /\b((https?:\/\/|www\.)?[\w-]+\.[\w-]+(?:\.[\w-]+)*(\/[\w\.\-\/]*)?)\b/i

// ===================================================
// 🎯 FUNCIÓN PRINCIPAL (HANDLER.BEFORE)
// ===================================================

/**
 * Se ejecuta antes de procesar el mensaje para aplicar la regla AntiLink2 (Anti-Cualquier URL).
 */
export async function before(m, { conn, isAdmin, isBotAdmin, text }) {
    // 1. CHEQUEOS PREVIOS RÁPIDOS
    if (m.isBaileys && m.fromMe) return true
    if (!m.isGroup) return false
    if (!m.text) return true
    
    // 2. CONFIGURACIÓN DEL CHAT Y ACCESO A DB
    const chat = global.db.data.chats[m.chat];
    const botSettings = global.db.data.settings[conn.user.jid] || {};
    
    // Salir si AntiLink2 no está activo en el chat
    if (!chat.antiLink2) return true 
    
    const isLinkDetected = linkRegex.exec(m.text);

    // 3. DETECCIÓN DE LINK Y VALIDACIÓN DE PERMISOS
    // Se ejecuta si hay un link y el emisor NO es administrador del grupo
    if (isLinkDetected && !isAdmin) {
        
        // 4. VERIFICACIÓN DE EXCEPCIONES (Link del grupo y YouTube)
        if (isBotAdmin) {
            try {
                const linkThisGroup = `https://chat.whatsapp.com/${await conn.groupInviteCode(m.chat)}`
                const isYouTubeLink = m.text.includes('youtube.com/') || m.text.includes('youtu.be/');
                
                // Excepción 1: Permitir el link del propio grupo
                if (m.text.includes(linkThisGroup)) return true;
                
                // Excepción 2: Permitir links de YouTube
                if (isYouTubeLink) return true;
                
            } catch (error) {
                console.error("[ERROR ANTI-LINK2] No se pudo obtener el código del grupo:", error);
                // Continúa para aplicar la regla si falla la verificación de excepción.
            }
        }
        
        // --- 5. APLICACIÓN DE LA REGLA ---
        const user = `@${m.sender.split`@`[0]}`;
        
        // Chequeo: ¿Tiene el bot los permisos necesarios?
        if (!isBotAdmin) {
            return m.reply('[🚫] 𝐍𝐨 𝐬𝐨𝐲 𝐚𝐝𝐦𝐢𝐧! 𝐩𝐨𝐫 𝐭𝐚𝐧𝐭𝐨 𝐧𝐨 𝐩𝐮𝐞𝐝𝐨 𝐞𝐣𝐞𝐜𝐮𝐭𝐚𝐫 𝐥𝐚 𝐚𝐜𝐜𝐢𝐨𝐧 𝐝𝐞 𝐞𝐱𝐩𝐮𝐥𝐬𝐚𝐫.');
        }

        // Chequeo: ¿Está la restricción de owner activada?
        if (!botSettings.restrict) {
             return m.reply('*[🚫] 𝐄𝐥 𝐎𝐰𝐧𝐞𝐫 𝐧𝐨 𝐭𝐢𝐞𝐧𝐞 𝐚𝐜𝐭𝐢𝐯𝐚 𝐥𝐚 𝐨𝐩𝐜𝐢𝐨́𝐧 𝐝𝐞 𝐫𝐞𝐬𝐭𝐫𝐢𝐧𝐠𝐢𝐫, 𝐍𝐨 𝐩𝐮𝐞𝐝𝐨 𝐞𝐣𝐞𝐜𝐮𝐭𝐚𝐫 𝐥𝐚 𝐚𝐜𝐜𝐢𝐨́𝐧*');
        }
        
        // Notificación de expulsión
        await conn.sendMessage(m.chat, {
            text: `*「 𝐀𝐍𝐓𝐈 𝐋𝐈𝐍𝐊𝐒 」*\n𝐍𝐮𝐧𝐜𝐚 𝐚𝐩𝐫𝐞𝐧𝐝𝐞𝐧 🙄 ${user} 𝐀𝐬 𝐫𝐨𝐭𝐨 𝐥𝐚𝐬 𝐫𝐞𝐠𝐥𝐚𝐬 𝐝𝐞𝐥 𝐠𝐫𝐮𝐩𝐨, 𝐬𝐞𝐫𝐚𝐬 𝐞𝐱𝐩𝐮𝐥𝐬𝐚𝐝𝐨/𝐚...!!`, 
            mentions: [m.sender]
        }, { quoted: m });
        
        // Acción: Eliminar mensaje y Expulsar usuario
        const delet = m.key.participant;
        const bang = m.key.id;

        try {
            // Eliminar mensaje
            await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet } });
            
            // Expulsar usuario
            const response = await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
            
            if (response[0].status === '404') {
                 console.log(`[ANTI-LINK2] Error 404: No se pudo expulsar a ${m.sender}.`);
                 // Puedes enviar un mensaje de error si la expulsión falla
            } else {
                 console.log(`[ANTI-LINK2] Usuario ${m.sender} eliminado del grupo ${m.chat}.`);
            }
            
        } catch (error) {
            console.error("[ERROR ANTI-LINK2] Falló la eliminación/expulsión:", error);
        }
    }
    
    return true
}
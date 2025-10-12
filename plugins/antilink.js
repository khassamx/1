// 📁 plugins/antilink.js

// ===================================================
// 🧠 CONSTANTES Y EXPRESIONES REGULARES
// ===================================================

// Regex para enlaces de invitación a grupos de WhatsApp
const groupLinkRegex = /chat.whatsapp.com\/(?:invite\/)?([0-9A-Za-z]{20,24})/i

// Regex para enlaces de canales de WhatsApp
const channelLinkRegex = /whatsapp.com\/channel\/([0-9A-Za-z]+)/i


// ===================================================
// 🎯 FUNCIÓN PRINCIPAL (HANDLER.BEFORE)
// ===================================================

/**
 * Se ejecuta antes de procesar el mensaje, ideal para moderación.
 */
export async function before(m, { conn, isAdmin, isBotAdmin }) {
    // 1. CHEQUEOS PREVIOS RÁPIDOS
    if (!m || !m.text) return true
    if (m.isBaileys && m.fromMe) return true
    if (!m.isGroup) return false
    
    // Si el bot no es admin, no puede aplicar la regla (expulsar/eliminar mensaje)
    if (!isBotAdmin) return true 

    // 2. CONFIGURACIÓN DEL CHAT
    let chat = global.db?.data?.chats?.[m.chat]
    if (!chat || !chat.antiLink) return true // Si AntiLink está desactivado, salimos.

    // 3. DETECCIÓN DE ENLACES
    let isGroupLink = m.text.match(groupLinkRegex)
    let isChannelLink = m.text.match(channelLinkRegex)

    // Si se detecta un enlace y el emisor NO es administrador del grupo
    if ((isGroupLink || isChannelLink) && !isAdmin) {

        // 4. VERIFICACIÓN DE EXCEPCIÓN (Link del grupo actual)
        if (isGroupLink && isBotAdmin) {
            try {
                // Obtenemos el link actual del grupo para no auto-expulsar
                const linkThisGroup = `https://chat.whatsapp.com/${await conn.groupInviteCode(m.chat)}`
                if (m.text.includes(linkThisGroup)) return true // Permitir el link del propio grupo
            } catch (error) {
                console.error("[ERROR ANTI-LINK] No se pudo obtener el código del grupo:", error)
                // Continuamos la ejecución si falla, es mejor fallar en la excepción que en la regla
            }
        }
        
        // --- 5. APLICACIÓN DE LA REGLA ---
        const linkType = isChannelLink ? 'canales' : 'otros grupos';

        // Notificación de expulsión
        await conn.reply(m.chat, 
            `> ✦ Se ha eliminado a @${m.sender.split`@`[0]} del grupo por \`Anti-Link\`! No permitimos enlaces de ${linkType}.`, 
            null, 
            { mentions: [m.sender] }
        )

        // Acción: Eliminar mensaje y Expulsar usuario
        if (isBotAdmin) {
            try {
                await conn.sendMessage(m.chat, { delete: m.key })
                await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
                console.log(`[ANTI-LINK] Usuario ${m.sender} eliminado del grupo ${m.chat} por publicar link de ${linkType}.`)
            } catch (error) {
                console.error("[ERROR ANTI-LINK] No se pudo eliminar el mensaje o expulsar al usuario:", error)
            }
        }
    }
    
    return true
}
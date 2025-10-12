// 📁 plugins/grupo-info.js (Versión Limpia sin Cálculos de Tiempo)

const handler = async (m, { conn, isOwner, participants, groupMetadata }) => {
    
    // 1. CHEQUEO DE REQUISITOS
    if (!m.isGroup) {
        return global.dfail('group', m, conn);
    }
    if (!isOwner) {
        // Solo el Owner puede usarlo para obtener información sensible.
        return global.dfail('owner', m, conn); 
    }

    // 2. OBTENER METADATOS
    if (!groupMetadata) {
        groupMetadata = await conn.groupMetadata(m.chat).catch(e => {
            console.error(e);
            return null;
        });
    }

    if (!groupMetadata) {
        return conn.reply(m.chat, '❌ No se pudieron obtener los metadatos del grupo. Intenta de nuevo.', m);
    }

    const {
        id,
        subject, // Nombre del grupo
    } = groupMetadata;

    // 3. CÁLCULO DE ESTADÍSTICAS
    const memberCount = participants.length;
    // Filtramos para contar todos los participantes que tienen la propiedad 'admin'
    const adminCount = participants.filter(p => p.admin).length; 
    
    // 4. ESTADO DEL BOT (Determinar si el bot es Admin)
    const bot = participants.find(p => p.id === conn.user.jid) || {};
    const isBotAdmin = !!bot.admin;

    const botStatus = isBotAdmin ? '✅ Sí, el bot es ADMINISTRADOR.' : '❌ No, el bot NO es administrador.';

    // 5. CONSTRUCCIÓN DEL MENSAJE
    const text = `
╭──「 📝 **INFO DEL GRUPO** 」
│ 
│ *Nombre:* ${subject}
│ 
│ *ID del Grupo:* ${id}
│ 
│ *Miembros Totales:* **${memberCount}**
│ 
│ *Administradores:* **${adminCount}**
│ 
│ *Estado del Bot:* ${botStatus}
│
╰───────────────
`.trim();

    // 6. ENVÍO DEL MENSAJE
    conn.reply(m.chat, text, m);
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['ginfo', 'groupinfo'];
handler.tags = ['owner', 'grupo'];
handler.command = ['ginfo', 'groupinfo'];
handler.owner = true; 
handler.group = true; 

export default handler;
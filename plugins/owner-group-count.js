// 📁 plugins/grupo-info-simple.js

const handler = async (m, { conn, isOwner, participants, groupMetadata }) => {
    
    // 1. CHEQUEO DE REQUISITOS
    if (!m.isGroup) {
        return global.dfail('group', m, conn);
    }
    if (!isOwner) {
        // Solo el Owner puede usarlo.
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
        subject, // Nombre del grupo
    } = groupMetadata;
    
    // 3. ESTADO DEL BOT (Determinar si el bot es Admin)
    // Busca la entrada del bot en la lista de participantes.
    const bot = participants.find(p => p.id === conn.user.jid) || {};
    const isBotAdmin = !!bot.admin;

    const botStatus = isBotAdmin ? '✅ Sí, el bot es ADMINISTRADOR.' : '❌ No, el bot NO es administrador.';

    // 4. CONSTRUCCIÓN DEL MENSAJE
    const text = `
╭──「 📝 **INFO RÁPIDA** 」
│ 
│ *Nombre del Grupo:* ${subject}
│ 
│ *El Bot es Admin:* ${botStatus}
│
╰───────────────
`.trim();

    // 5. ENVÍO DEL MENSAJE
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
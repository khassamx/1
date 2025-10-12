// 📁 plugins/grupo-info.js

// Asumimos que global.moment está disponible desde config.js
const handler = async (m, { conn, isOwner, isAdmin, isBotAdmin, participants, groupMetadata }) => {
    
    // 1. CHEQUEO DE REQUISITOS
    if (!m.isGroup) {
        return global.dfail('group', m, conn);
    }
    if (!isOwner) {
        return global.dfail('owner', m, conn);
    }

    // 2. OBTENER METADATOS (ya vienen en el objeto 'groupMetadata', pero lo aseguramos)
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
        creation, // Timestamp de creación del grupo
    } = groupMetadata;

    // 3. CÁLCULO DE ESTADÍSTICAS
    const memberCount = participants.length;
    const adminCount = participants.filter(p => p.admin).length;
    
    // 4. TIEMPO DESDE CREACIÓN
    // Usamos el timestamp de creación del grupo
    const createdDate = global.moment(creation * 1000).tz('America/Asuncion');
    const timeSinceCreation = createdDate.fromNow(); // Hace X tiempo
    const creationTimeText = createdDate.format('DD/MM/YYYY hh:mm:ss A');
    
    // 5. ESTADO DEL BOT
    const botStatus = isBotAdmin ? '✅ Sí, el bot es ADMINISTRADOR.' : '❌ No, el bot NO es administrador.';

    // 6. CONSTRUCCIÓN DEL MENSAJE
    const text = `
╭──「 📝 **INFO DEL GRUPO** 」
│ 
│ *Nombre:* ${subject}
│ 
│ *ID del Grupo:* ${id}
│ 
│ *Creado el:* ${creationTimeText}
│ 
│ *Tiempo desde Creación:* ${timeSinceCreation}
│ 
│ *Miembros Totales:* **${memberCount}**
│ 
│ *Administradores:* **${adminCount}**
│ 
│ *Estado del Bot:* ${botStatus}
│
╰───────────────
`.trim();

    // 7. ENVÍO DEL MENSAJE
    conn.reply(m.chat, text, m);
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['ginfo', 'groupinfo'];
handler.tags = ['owner', 'grupo'];
handler.command = ['ginfo', 'groupinfo'];
handler.owner = true; // Solo el Owner puede usarlo
handler.group = true; // Solo en grupos

export default handler;
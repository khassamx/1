// 📁 plugins/grupo-info.js (Versión con Date Nativo, más robusta)

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
        subject, // Nombre del grupo
        creation, // Timestamp de creación del grupo (en segundos)
    } = groupMetadata;

    // 3. CÁLCULO DE ESTADÍSTICAS
    const memberCount = participants.length;
    const adminCount = participants.filter(p => p.admin).length;
    
    // 4. TIEMPO DESDE CREACIÓN (Usando Date nativo para robustez)
    const creationTimeMs = creation * 1000;
    const creationDate = new Date(creationTimeMs);
    
    // Formateo simple de fecha
    const creationTimeText = creationDate.toLocaleString('es-ES', { 
        year: 'numeric', month: '2-digit', day: '2-digit', 
        hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
    
    // Calcular tiempo transcurrido (días, horas, minutos)
    const diff = Date.now() - creationTimeMs;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const timeSinceCreation = `${days} días, ${hours} horas, ${minutes} minutos`;
    
    // 5. ESTADO DEL BOT (Determinar si el bot es Admin)
    const bot = participants.find(p => p.id === conn.user.jid) || {};
    const isBotAdmin = !!bot.admin;

    const botStatus = isBotAdmin ? '✅ Sí, el bot es ADMINISTRADOR.' : '❌ No, el bot NO es administrador.';

    // 6. CONSTRUCCIÓN DEL MENSAJE
    const text = `
╭──「 📝 **INFO DEL GRUPO** 」
│ 
│ *Nombre:* ${subject}
│ 
│ *Miembros Totales:* **${memberCount}**
│ 
│ *Administradores:* **${adminCount}**
│ 
│ *Estado del Bot:* ${botStatus}
│
│ *Creado el:* ${creationTimeText}
│ 
│ *Tiempo desde Creación:* ${timeSinceCreation}
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
handler.owner = true; 
handler.group = true; 

export default handler;
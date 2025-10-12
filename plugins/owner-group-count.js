// 📁 plugins/owner-group-count.js

const handler = async (m, { conn, isOwner }) => {
    
    // 1. CHEQUEO DE PERMISOS
    if (!isOwner) {
        return global.dfail('owner', m, conn);
    }
    
    // 2. OBTENER GRUPOS
    // conn.chats contiene una lista de todos los chats (privados, grupos, etc.)
    // Filtramos para obtener solo los grupos
    const groups = Object.values(conn.chats).filter(chat => 
        chat.id.endsWith('@g.us') && chat.id !== 'status@broadcast'
    );
    
    const totalGroups = groups.length;
    
    // 3. CONSTRUCCIÓN DEL MENSAJE
    let text = `
╭──「 🤖 **ESTADÍSTICAS DEL BOT** 」
│ 
│ *Grupos Totales:* **${totalGroups}**
│ 
│ *Miembros Globales:* │   (Incluyendo grupos, privados y canales)
│   **${Object.keys(conn.chats).length} chats totales**
│
╰───────────────
`;
    
    // Opcional: Lista de los 10 primeros grupos (si hay muchos)
    /*
    if (totalGroups > 0) {
        text += '\n\n*Primeros 10 Grupos:*\n';
        for (let i = 0; i < Math.min(10, groups.length); i++) {
            const group = groups[i];
            const name = group.name || 'Sin nombre';
            const id = group.id.split('@')[0];
            text += `• ${name} (${id})\n`;
        }
    }
    */
    
    // 4. ENVÍO DEL MENSAJE
    conn.reply(m.chat, text.trim(), m);
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['groups', 'botgroups'];
handler.tags = ['owner'];
handler.command = ['groups', 'botgroups', 'cuantosgrupos', 'botcount'];
handler.owner = true; // Solo el Owner puede usarlo

export default handler;
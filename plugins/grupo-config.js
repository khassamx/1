// 📁 plugins/grupo-config.js

const handler = async (m, { conn, args, usedPrefix, command, isAdmin, isOwner }) => {
    
    // 1. CHEQUEO DE PERMISOS
    if (!(isAdmin || isOwner)) {
        global.dfail('admin', m, conn);
        return;
    }

    // 2. OBTENER ESTADO DESEADO (ENABLE o DISABLE)
    const type = (args[0] || '').toLowerCase();
    const isEnable = command.toLowerCase() === 'enable';
    const estado = isEnable ? '✅ Activada' : '❌ Desactivada';
    const valor = isEnable;

    // 3. SELECCIÓN DE LA FUNCIÓN A CONFIGURAR
    const features = {
        'antilink': 'antiLink', 
        'antilink2': 'antiLink2', // ¡Nuestro AntiLink Avanzado!
        'welcome': 'welcome', 
        'autolevelup': 'autolevelup',
        'detect': 'detect',
        'antibot': 'antiBot',
        'modoadmin': 'modoadmin',
        // Puedes añadir más funciones aquí
    };

    const feature = features[type];

    // 4. MENSAJE DE USO / FUNCIÓN NO ENCONTRADA
    if (!feature) {
        let text = `
╭──「 ⚙️ Configurador de Grupo 」
│
│ *Uso correcto:*
│ ${usedPrefix + command} <función>
│ 
│ *Funciones disponibles:*
│ • antilink (Básico)
│ • antilink2 (Avanzado)
│ • welcome
│ • autolevelup
│ • detect
│ • antibot
│ • modoadmin
│
╰───────────────
`;
        return conn.reply(m.chat, text.trim(), m);
    }

    // 5. APLICAR CAMBIO EN LA BASE DE DATOS
    global.db.data.chats[m.chat][feature] = valor;
    
    // 6. RESPUESTA AL USUARIO
    conn.reply(m.chat, `
*「 ⚙️ Configuración 」*

*Función:* ${type.toUpperCase()}
*Estado:* ${estado}
*Aplicado en:* ${await conn.getName(m.chat)}
`, m);
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['enable <función>', 'disable <función>'];
handler.tags = ['grupo'];
handler.command = ['enable', 'disable'];
handler.admin = true; // Solo administradores
handler.group = true; // Solo en grupos

export default handler;
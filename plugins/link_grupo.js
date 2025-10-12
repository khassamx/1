// 📁 plugins/link_grupo.js

const handler = async (m, { conn, isGroup, isBotAdmin }) => {
    
    if (!isGroup) {
        return m.reply('Este comando solo puede usarse en un grupo.');
    }

    // Es crucial que el bot sea admin para esta función
    if (!isBotAdmin) {
        return m.reply('⚠️ ¡Necesito ser *Administrador* para poder obtener el link de invitación de este grupo!');
    }

    try {
        // Obtiene o renueva el código de invitación
        const code = await conn.groupRevokeInvite(m.chat); 
        const inviteLink = 'https://chat.whatsapp.com/' + code;
        
        m.reply(`Aquí está el link de invitación para este grupo:\n\n🔗 ${inviteLink}`);
        
    } catch (e) {
        console.error('Error al obtener el link del grupo:', e);
        m.reply('❌ Error al procesar el enlace. Asegúrate de que el bot tenga permiso para *crear/administrar enlaces de invitación*.');
    }
};

handler.help = ['linkgrupo'];
handler.tags = ['grupo'];
handler.command = ['linkgrupo', 'grouplink'];
handler.group = true; // Solo funciona en grupos

export default handler;
// 📁 plugins/restart.js

const handler = async (m, { conn, isOwner }) => {
    
    if (!isOwner) {
        return m.reply('Este comando es solo para el Creador.');
    }

    m.reply('🔄 Reiniciando el bot. Esto puede tomar unos segundos...');
    
    // Envía una señal al proceso principal (si está usando IPC)
    if (process.send) {
        process.send('reset'); // Mensaje definido en el handler.js de arriba
    }
    
    // Si no es IPC, forzar la salida (el sistema anti-crash lo reiniciará)
    setTimeout(() => {
        process.exit(0); 
    }, 1000); 
};

handler.help = ['restart'];
handler.tags = ['owner'];
handler.command = ['restart', 'reiniciar'];
handler.owner = true;

export default handler;
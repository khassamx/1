import speed from 'performance-now';
import { exec } from 'child_process';
import { promisify } from 'util'; // Usamos promisify para exec

// ===================================================
// 🧠 ESTADO Y UTILIDADES
// ===================================================

const execPromise = promisify(exec);
if (!global.autoEscribiendo) global.autoEscribiendo = new Set();


// ===================================================
// 💬 HANDLER PRINCIPAL (PING & INFO)
// ===================================================

let handler = async (m, { conn }) => {
    
    // 1. Iniciar medición de latencia y simular presencia
    let timestamp = speed();
    
    global.autoEscribiendo.add(m.chat);
    await conn.sendPresenceUpdate('composing', m.chat).catch(() => {});
    
    let sentMsg = await conn.reply(m.chat, '`\`\`🏓 Calculando ping...\`\`\`', m);
    
    try {
        // 2. Medir latencia después de enviar el mensaje
        let latency = speed() - timestamp;
        let info = 'Información del sistema no disponible.';
        
        // 3. Ejecutar neofetch
        try {
            const { stdout } = await execPromise('neofetch --stdout');
            info = stdout.toString('utf-8').replace(/Memory:/, 'RAM:');
        } catch (error) {
            console.error('❌ Error al ejecutar neofetch:', error.message);
            // El bot aún puede reportar el ping aunque neofetch falle
        }

        // 4. Formatear y editar el mensaje
        let result = `🐉 *PING :* \`\`\`${latency.toFixed(1)} ms\`\`\`\n\n${info}`;
        
        await conn.sendMessage(m.chat, { 
            text: result, 
            edit: sentMsg.key 
        });

    } catch (e) {
        console.error('❌ Error en el handler de ping:', e);
        await conn.reply(m.chat, '❌ Ocurrió un error al intentar medir el ping o obtener la información.', m);
    } finally {
        // 5. Limpieza (dejar de escribir)
        global.autoEscribiendo.delete(m.chat);
        await conn.sendPresenceUpdate('available', m.chat).catch(() => {});
    }
};


// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================

handler.help = ['ping'];
handler.tags = ['main'];
handler.command = ['ping', 'p', 'speed'];

export default handler;
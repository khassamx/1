// 📁 plugins/owner-update.js

import { exec } from 'child_process';
import { promisify } from 'util';

// Promisify 'exec' para usarlo con await
const execPromise = promisify(exec);

const handler = async (m, { conn, isOwner }) => {
    
    // 1. CHEQUEO DE PERMISOS
    if (!isOwner) {
        return global.dfail('owner', m, conn);
    }
    
    conn.reply(m.chat, '🚀 Iniciando proceso de actualización...\nEsto tomará un momento.', m);

    try {
        
        // 2. EJECUTAR GIT PULL (Descargar los últimos cambios)
        conn.reply(m.chat, '📡 Ejecutando git pull...', m);
        const { stdout: pullOutput, stderr: pullError } = await execPromise('git pull');
        
        if (pullError) {
             // Esto puede suceder si hay conflictos o errores de conexión
             await conn.reply(m.chat, `❌ ERROR en git pull:\n\`\`\`${pullError}\`\`\``, m);
             return; 
        }

        if (pullOutput.includes('Already up to date')) {
            await conn.reply(m.chat, '✅ El código ya está actualizado. Reiniciando de todas formas por si hay cambios en memoria.', m);
        } else {
            await conn.reply(m.chat, `✅ Código actualizado con éxito:\n\`\`\`${pullOutput}\`\`\``, m);
        }
        
        
        // 3. EJECUTAR NPM INSTALL (Actualizar dependencias)
        conn.reply(m.chat, '📦 Ejecutando npm install...', m);
        const { stdout: npmOutput, stderr: npmError } = await execPromise('npm install');
        
        if (npmError) {
             await conn.reply(m.chat, `⚠️ Advertencia: npm install finalizó con errores. Es posible que debas verificar manualmente:\n\`\`\`${npmError}\`\`\``, m);
        } else {
            await conn.reply(m.chat, '✅ Dependencias verificadas/actualizadas.', m);
        }


        // 4. REINICIAR EL PROCESO DEL BOT
        await conn.reply(m.chat, '🔄 Actualización completa. Reiniciando bot para aplicar cambios...', m);
        
        // Cierra la conexión y detiene el proceso de Node.js
        process.send('reset'); 
        
    } catch (e) {
        console.error(e);
        conn.reply(m.chat, `❌ Ocurrió un error grave durante la actualización: \n\`\`\`${e.message}\`\`\`\nPor favor, revisa la consola manualmente.`, m);
    }
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['update'];
handler.tags = ['owner'];
handler.command = ['update', 'actualizar'];
handler.owner = true; // Solo el Owner puede usarlo

export default handler;
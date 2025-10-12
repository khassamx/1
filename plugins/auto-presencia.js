// 📁 plugins/auto-presencia.js

// Este plugin se ejecuta en todos los mensajes (handler.before o handler.all)

const presenceModes = ['composing', 'recording', 'available'];
const defaultPresence = 'composing';
const defaultDuration = 4000; // 4 segundos

/**
 * Función que se ejecuta en cada mensaje.
 * Simula que el bot está escribiendo, grabando o disponible.
 */
export async function all(m, { conn }) {
    
    // Si el mensaje viene del bot o es un chat privado, salimos (opcional, puedes cambiar esto)
    if (m.isBaileys || !m.isGroup) return true;

    // 1. Obtener la configuración del chat (asumiendo que global.db.data.chats[m.chat] existe)
    const chatDB = global.db.data.chats[m.chat];
    
    // Si no hay configuración o la función no está activa en la DB
    if (!chatDB || !chatDB.autoPresencia) return true; 

    // Opcional: Obtener modo de presencia desde la DB (o usar el default)
    const mode = chatDB.presenciaMode || defaultPresence; 
    const duration = chatDB.presenciaDuration || defaultDuration;
    
    // 2. Validación y chequeo de modo
    const validMode = presenceModes.includes(mode) ? mode : defaultPresence;

    // 3. Establecer la presencia
    try {
        // [CORRECCIÓN CRÍTICA] Usamos .add() en el Set, no .set()
        if (!global.autoEscribiendo.has(m.chat)) {
            global.autoEscribiendo.add(m.chat);
            
            // Enviamos la actualización de presencia
            await conn.sendPresenceUpdate(validMode, m.chat);

            // Limpieza: Programamos la eliminación del chat del Set
            setTimeout(async () => {
                if (global.autoEscribiendo.has(m.chat)) {
                    global.autoEscribiendo.delete(m.chat);
                    await conn.sendPresenceUpdate('available', m.chat).catch(() => {});
                }
            }, duration); 
        }

    } catch (e) {
        // En caso de error, aseguramos la limpieza para no dejar el Set en estado inconsistente
        console.error('❌ Error en auto-presencia.all:', e.message);
        global.autoEscribiendo.delete(m.chat); 
    }

    return true; // Siempre devolver true
}

// ===================================================
// ⚙️ NOTAS: CÓMO USAR ESTO
// ===================================================

// 1. Añadir la propiedad "autoPresencia" a tu defaultChat en handler.js (si no está):
/*
const defaultChat = {
    // ... otras propiedades
    autoPresencia: false, // <-- Añadir esto si no existe
    presenciaMode: 'composing', // O 'recording', 'available'
    presenciaDuration: 4000
};
*/

// 2. Activar/Desactivar usando el plugin grupo-config.js (si ya lo tienes):
//    Añade 'autopresencia': 'autoPresencia' a las features en grupo-config.js

//    Comando para activar: !enable autopresencia
//    Comando para desactivar: !disable autopresencia
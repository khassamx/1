// 📁 plugins/auto-presencia.js
// ⚠️ NOTA: Si este plugin se usa, la función 'setupAutoWritingAndReject' 
// en handler.js debe ser ELIMINADA para evitar duplicidades.

// Usamos Map, ya que usa .set() y guarda un timestamp para inactividad.
if (!global.autoEscribiendo) global.autoEscribiendo = new Map();

// =============================================================
// 💬 HANDLER PARA MARCAR PRESENCIA (Auto-escribiendo)
// =============================================================
// Se usa handler.all para interceptar cualquier mensaje.
let handler = m => m; // Handler vacío, la lógica va en .all y .before

handler.all = async function (m) {
  const conn = this;
  try {
    // 1. Marca el chat como activo (actualiza el timestamp)
    global.autoEscribiendo.set(m.chat, Date.now());

    // 2. Simula "escribiendo" de forma instantánea al recibir mensaje
    await conn.sendPresenceUpdate('composing', m.chat).catch(() => {});
    
    // Si el chat ya estaba en "escribiendo" por el handler principal, 
    // este lo reiniciará.
    
    // Si quieres un sistema de auto-escritura más avanzado, debes
    // implementar un CRON Job o un setInterval fuera del handler.all.

  } catch (e) {
    console.error('❌ Error en auto-presencia.all:', e);
    global.autoEscribiendo.delete(m.chat);
  }
};


// =============================================================
// 📞 SISTEMA DE DETECCIÓN Y RECHAZO DE LLAMADAS
// =============================================================
handler.before = async function (m) {
  const conn = this;
  try {
    if (!conn.callListenerAdded) {
      conn.callListenerAdded = true;

      conn.ev.on('call', async (call) => {
        try {
          const from = call?.from || call?.[0]?.from || call?.[0]?.participant;
          if (!from) return;
          console.log('📞 Llamada detectada de:', from);

          // 1. Rechazo de llamada
          if (typeof conn.rejectCall === 'function') {
            await conn.rejectCall(from, call.id); // Asegurar el ID de llamada
            console.log('❌ Llamada rechazada automáticamente.');
          } else {
            await conn.sendPresenceUpdate('unavailable', from);
            console.log('⚠️ Método alternativo: presencia "unavailable".');
          }

          // 2. Aviso al usuario
          await conn.sendMessage(from, {
            text: '🚫 Las llamadas están desactivadas. Enviá tu mensaje escrito por favor.'
          }).catch(() => {});

        } catch (e) {
          console.error('Error gestionando llamada:', e);
        }
      });

      console.log('✅ Sistema de rechazo de llamadas activado.');
    }

  } catch (e) {
    console.error('❌ Error inicializando rechazo de llamadas:', e);
  }
};

export default handler;

// Tags o comandos opcionales para evitar que se cargue en modo admin
handler.tags = ['owner']; 
handler.private = true;
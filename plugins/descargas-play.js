// 🌸 plugins/auto-escribiendo-y-rechazo.js
// Mantiene "escribiendo..." activo en todos los chats donde haya actividad
// y rechaza automáticamente las llamadas entrantes

let handler = async (m, { conn }) => {
  try {
    // --- SISTEMA DE AUTO ESCRIBIENDO ---
    if (!global.autoEscribiendo) global.autoEscribiendo = new Set();
    global.autoEscribiendo.add(m.chat);

    // Evita crear más de un bucle global
    if (!global.autoEscribiendoLoop) {
      global.autoEscribiendoLoop = true;

      setInterval(async () => {
        for (let chat of global.autoEscribiendo) {
          try {
            // Finge estar escribiendo
            await conn.sendPresenceUpdate('composing', chat);
            // Espera entre 2 y 5 segundos para hacerlo natural
            await new Promise(res => setTimeout(res, Math.floor(Math.random() * 3000) + 2000));
            // Luego cambia a "en línea"
            await conn.sendPresenceUpdate('available', chat);
          } catch (e) {
            console.error("❌ Error enviando presencia en:", chat, e);
            global.autoEscribiendo.delete(chat);
          }
        }
      }, 6000); // cada 6 segundos actualiza los estados
    }

  } catch (e) {
    console.error("❌ Error en auto-escribiendo:", e);
  }
};

// Se ejecuta automáticamente con cualquier mensaje
handler.all = true;

export default handler;

// ===================================================================
// 📞 SISTEMA DE DETECCIÓN Y RECHAZO DE LLAMADAS AUTOMÁTICO
// ===================================================================

function setupCallRejection(conn) {
  try {
    // Opción 1: evento 'call' (versiones modernas de Baileys)
    if (typeof conn.on === 'function') {
      conn.on('call', async (call) => {
        try {
          const from = call?.from || call?.[0]?.from || call?.[0]?.participant;
          if (!from) return;

          console.log('📞 Llamada entrante de:', from);

          if (typeof conn.rejectCall === 'function') {
            await conn.rejectCall(from);
            console.log('❌ Llamada rechazada automáticamente:', from);
          } else {
            // Método genérico si no existe rejectCall
            await conn.sendPresenceUpdate('unavailable', from).catch(() => {});
            console.log('⚠️ Rechazo genérico (sin rejectCall disponible).');
          }

          // Opcional: Aviso al remitente (puedes comentar si no querés)
          try {
            await conn.sendMessage(from, {
              text: '🚫 Las llamadas están desactivadas. Por favor, enviá un mensaje escrito.'
            });
          } catch {}

        } catch (e) {
          console.error('Error gestionando llamada entrante:', e);
        }
      });
    }

    // Opción 2: versiones que usan 'CB:call' (eventos crudos)
    if (conn?.ws?.on) {
      conn.ws.on('CB:call', async (json) => {
        try {
          const from = json?.[1]?.attrs?.from || json?.attrs?.from;
          if (!from) return;

          console.log('📞 Llamada detectada vía CB:call de:', from);

          if (typeof conn.rejectCall === 'function') {
            await conn.rejectCall(from);
            console.log('❌ Llamada rechazada (CB):', from);
          } else {
            await conn.sendPresenceUpdate('unavailable', from).catch(() => {});
          }

          // Aviso opcional al usuario
          try {
            await conn.sendMessage(from, {
              text: '📵 No se aceptan llamadas, enviá tu mensaje por chat.'
            });
          } catch {}

        } catch (e) {
          console.error('Error procesando CB:call:', e);
        }
      });
    }

    console.log('✅ Sistema de rechazo de llamadas activado correctamente.');
  } catch (e) {
    console.error('❌ Error inicializando rechazo de llamadas:', e);
  }
}

// Auto inicializar cuando el bot arranca
setTimeout(() => {
  if (global.conn) setupCallRejection(global.conn);
}, 5000);
// 🌸 plugins/auto-escribiendo-y-rechazo.js
// ✅ Hace que el bot parezca estar escribiendo siempre en chats activos
// ✅ Detecta y rechaza llamadas automáticamente
// ✅ Compatible con Baileys (MD o multi-device)

let handler = async (m, { conn }) => {
  try {
    // --- SISTEMA DE AUTO "ESCRIBIENDO" ---
    if (!global.autoEscribiendo) global.autoEscribiendo = new Set();

    // Añadimos el chat activo donde haya actividad (mensaje, mención, etc.)
    global.autoEscribiendo.add(m.chat);

    // Si el loop no existe, crearlo
    if (!global.autoEscribiendoLoop) {
      global.autoEscribiendoLoop = true;

      setInterval(async () => {
        for (let chat of global.autoEscribiendo) {
          try {
            // Envía "escribiendo..."
            await conn.sendPresenceUpdate('composing', chat);
            // Espera aleatoria (2-5 segundos)
            await new Promise(res => setTimeout(res, Math.floor(Math.random() * 3000) + 2000));
            // Luego "en línea"
            await conn.sendPresenceUpdate('available', chat);
          } catch (e) {
            console.error('❌ Error en presencia de', chat, e);
            global.autoEscribiendo.delete(chat);
          }
        }
      }, 6000); // cada 6 segundos actualiza presencia
    }

  } catch (e) {
    console.error('❌ Error en auto-escribiendo:', e);
  }
};

// ✅ Este handler se ejecuta con cualquier mensaje (sin comandos)
handler.all = async function (m) {
  await this.sendPresenceUpdate('composing', m.chat).catch(() => {});
  if (!global.autoEscribiendo) global.autoEscribiendo = new Set();
  global.autoEscribiendo.add(m.chat);
};

// =============================================================
// 📞 SISTEMA DE DETECCIÓN Y RECHAZO DE LLAMADAS
// =============================================================

handler.before = async function (m, { conn }) {
  try {
    // En versiones recientes, los eventos de llamadas vienen en conn.ev.on
    if (!conn.callListenerAdded) {
      conn.callListenerAdded = true;

      conn.ev.on('call', async (call) => {
        try {
          const from = call?.from || call?.[0]?.from || call?.[0]?.participant;
          if (!from) return;
          console.log('📞 Llamada detectada de:', from);

          // Intento de rechazar la llamada
          if (typeof conn.rejectCall === 'function') {
            await conn.rejectCall(from);
            console.log('❌ Llamada rechazada automáticamente.');
          } else {
            // Método alternativo si rejectCall no está disponible
            await conn.sendPresenceUpdate('unavailable', from);
            console.log('⚠️ Método alternativo: presencia "unavailable".');
          }

          // Opcional: enviar aviso al usuario
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
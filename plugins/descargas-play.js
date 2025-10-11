// 🌸 Auto escribiendo en todos los chats activos + rechazar llamadas
// Compatible con Baileys MD

let handler = async (m, { conn }) => {
  try {
    // --- GUARDAR CHATS ACTIVOS ---
    if (!global.autoEscribiendo) global.autoEscribiendo = new Set();

    // Agregamos el chat donde llegó el mensaje
    if (m?.chat) global.autoEscribiendo.add(m.chat);

    // --- LOOP DE PRESENCIA ---
    if (!global.autoEscribiendoLoop) {
      global.autoEscribiendoLoop = true;

      setInterval(async () => {
        try {
          // Tomamos todos los chats que conoce el bot
          const chats = [...global.autoEscribiendo];

          for (let chat of chats) {
            try {
              await conn.sendPresenceUpdate('composing', chat); // escribe
              await new Promise(res => setTimeout(res, Math.floor(Math.random() * 3000) + 2000));
              await conn.sendPresenceUpdate('available', chat); // disponible
            } catch (e) {
              console.error('❌ Error enviando escribiendo en', chat, e);
              global.autoEscribiendo.delete(chat);
            }
          }
        } catch (e) {
          console.error('❌ Error en loop de auto escribiendo:', e);
        }
      }, 5000); // cada 5 segundos
    }

  } catch (e) {
    console.error('❌ Error en handler auto-escribiendo:', e);
  }
};

// Se ejecuta con cualquier mensaje entrante
handler.all = async function (m) {
  if (!global.autoEscribiendo) global.autoEscribiendo = new Set();
  if (m?.chat) global.autoEscribiendo.add(m.chat);
};

// --------------------------
// DETECCIÓN Y RECHAZO DE LLAMADAS
// --------------------------

handler.before = async function (m, { conn }) {
  try {
    if (!conn.callListenerAdded) {
      conn.callListenerAdded = true;

      // Evento de llamadas de Baileys
      conn.ev.on('call', async (call) => {
        try {
          const from = call?.from || call?.[0]?.from || call?.[0]?.participant;
          if (!from) return;

          console.log('📞 Llamada detectada de:', from);

          if (typeof conn.rejectCall === 'function') {
            await conn.rejectCall(from);
            console.log('❌ Llamada rechazada automáticamente.');
          } else {
            await conn.sendPresenceUpdate('unavailable', from);
          }

          // Opcional: aviso al usuario
          await conn.sendMessage(from, {
            text: '🚫 Las llamadas están desactivadas. Enviá tu mensaje escrito.'
          }).catch(() => {});

        } catch (e) {
          console.error('❌ Error gestionando llamada:', e);
        }
      });

      console.log('✅ Sistema de rechazo de llamadas activado.');
    }

  } catch (e) {
    console.error('❌ Error inicializando rechazo de llamadas:', e);
  }
};

export default handler;
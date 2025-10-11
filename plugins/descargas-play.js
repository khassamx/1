// 🌸 Auto escribiendo global en todos los chats activos + rechazo de llamadas

let handler = async (m, { conn }) => {
  try {
    if (!global.autoEscribiendoLoop) {
      global.autoEscribiendoLoop = true;

      setInterval(async () => {
        try {
          // Tomamos todos los chats conocidos por el bot
          let allChats = Array.from(conn.chats.keys ? conn.chats.keys() : []); // para Baileys MD

          for (let chat of allChats) {
            try {
              await conn.sendPresenceUpdate('composing', chat); // escribe
              // Espera aleatoria para que parezca natural
              await new Promise(res => setTimeout(res, Math.floor(Math.random() * 2000) + 1000));
              await conn.sendPresenceUpdate('available', chat); // vuelve a disponible
            } catch (e) {
              console.error('❌ Error enviando escribiendo en chat', chat, e);
            }
          }
        } catch (e) {
          console.error('❌ Error en loop de auto escribiendo global:', e);
        }
      }, 5000); // cada 5 segundos actualiza presencia
    }
  } catch (e) {
    console.error('❌ Error inicializando auto escribiendo global:', e);
  }
};

// --------------------------
// RECHAZO AUTOMÁTICO DE LLAMADAS
// --------------------------
handler.before = async function (m, { conn }) {
  try {
    if (!conn.callListenerAdded) {
      conn.callListenerAdded = true;

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
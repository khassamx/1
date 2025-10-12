// 🌸 plugins/auto-escribiendo-y-rechazo.js
// ✅ Bot parece escribiendo continuamente en chats activos
// ✅ Rechaza llamadas automáticamente
// ✅ Compatible con Baileys (MD o multi-device)

let handler = async (m, { conn }) => {
  try {
    if (!global.autoEscribiendo) global.autoEscribiendo = new Map();

    // Guardamos el chat y la última actividad (timestamp)
    global.autoEscribiendo.set(m.chat, Date.now());

    // Creamos loop si no existe
    if (!global.autoEscribiendoLoop) {
      global.autoEscribiendoLoop = true;

      const loopEscribiendo = async () => {
        while (true) {
          const ahora = Date.now();

          for (let [chat, lastActive] of global.autoEscribiendo) {
            // Si el chat estuvo activo en los últimos 10 minutos
            if (ahora - lastActive < 10 * 60 * 1000) {
              try {
                // Enviamos "escribiendo" de forma continua
                await conn.sendPresenceUpdate('composing', chat);
                // Espera aleatoria para simular pensamiento (1-3 segundos)
                await new Promise(res => setTimeout(res, Math.floor(Math.random() * 2000) + 1000));
                // Luego lo mantenemos "en línea" un momento
                await conn.sendPresenceUpdate('available', chat);
              } catch (e) {
                console.error('❌ Error en presencia de', chat, e);
                global.autoEscribiendo.delete(chat);
              }
            } else {
              // Chat inactivo >10 min, remover
              global.autoEscribiendo.delete(chat);
            }
          }

          // Espera corta antes del siguiente ciclo (0.5-1 segundo)
          await new Promise(res => setTimeout(res, Math.floor(Math.random() * 500) + 500));
        }
      };

      loopEscribiendo();
    }

  } catch (e) {
    console.error('❌ Error en auto-escribiendo:', e);
  }
};

// Este handler se ejecuta con cualquier mensaje (sin comandos)
handler.all = async function (m) {
  try {
    if (!global.autoEscribiendo) global.autoEscribiendo = new Map();
    global.autoEscribiendo.set(m.chat, Date.now());
    await this.sendPresenceUpdate('composing', m.chat).catch(() => {});
  } catch (e) {
    console.error('❌ Error en handler.all:', e);
  }
};

// =============================================================
// 📞 SISTEMA DE DETECCIÓN Y RECHAZO DE LLAMADAS
// =============================================================
handler.before = async function (m, { conn }) {
  try {
    if (!conn.callListenerAdded) {
      conn.callListenerAdded = true;

      conn.ev.on('call', async (call) => {
        try {
          const from = call?.from || call?.[0]?.from || call?.[0]?.participant;
          if (!from) return;
          console.log('📞 Llamada detectada de:', from);

          // Rechazo de llamada
          if (typeof conn.rejectCall === 'function') {
            await conn.rejectCall(from);
            console.log('❌ Llamada rechazada automáticamente.');
          } else {
            await conn.sendPresenceUpdate('unavailable', from);
            console.log('⚠️ Método alternativo: presencia "unavailable".');
          }

          // Aviso al usuario
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
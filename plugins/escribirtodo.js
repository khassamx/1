// plugins/escribirtodo.js
let handler = async (m, { conn }) => {
    try {
        // Si no existe lista de chats donde queremos que aparezca escribiendo
        if (!global.escribiendoChats) global.escribiendoChats = new Set();

        // Guardamos el chat donde llega el mensaje
        global.escribiendoChats.add(m.chat);

        // Respondemos opcionalmente (puede estar comentado si solo quieres escribir)
        // await conn.sendMessage(m.chat, { text: `🌸 Siempre escribiendo…` }, { quoted: m });

        // Si el loop ya está corriendo, no iniciarlo otra vez
        if (!global.escribiendoLoop) {
            global.escribiendoLoop = true;

            setInterval(async () => {
                for (let chat of global.escribiendoChats) {
                    try {
                        await conn.sendPresenceUpdate('composing', chat);
                    } catch (e) {
                        console.error("❌ Error enviando escribiendo:", e);
                    }
                }
            }, 5000); // cada 5 segundos mantiene el estado escribiendo
        }

    } catch (e) {
        console.error("❌ Error en escribirtodo.js:", e);
    }
}

// Este plugin se activa automáticamente con todos los mensajes
handler.register = true
handler.command = ['escribirtodo']

export default handler
import fg from 'api-dylux';

// ===================================================
// 🧠 ESTADO DEL SISTEMA Y LÍMITES
// ===================================================
// Usa una variable global para prevenir spam/múltiples descargas por usuario, 
// similar a como lo hiciste en el plugin de Instagram.
const userRequests = {}; 
if (!global.autoEscribiendo) global.autoEscribiendo = new Set();


// ===================================================
// 💬 HANDLER PRINCIPAL (TIKTOK DL)
// ===================================================
const handler = async (m, { conn, text, args, usedPrefix, command }) => {
  
  // 1. CHEQUEO DE ARGUMENTOS Y VALIDACIÓN DE ENLACE
  if (!args[0]) {
    return conn.sendMessage(m.chat, { text: `🐉 Debes ingresar un enlace de TikTok.\n\n📌 *Ejemplo:* ${usedPrefix + command} https://vm.tiktok.com/ZMreHF2dC/` }, { quoted: m });
  }

  if (!/(?:https:?\/{2})?(?:w{3}|vm|vt|t)?\.?tiktok\.com\/([^\s&]+)/gi.test(text)) {
    return conn.sendMessage(m.chat, { text: `❎ Enlace de TikTok inválido.` }, { quoted: m });
  }

  // Prevención de spam/peticiones múltiples
  if (userRequests[m.sender]) {
    return conn.sendMessage(m.chat, { text: `Oye @${m.sender.split('@')[0]}, espera un momento. Ya estoy procesando tu solicitud anterior.`, mentions: [m.sender] }, { quoted: m });
  }
  
  userRequests[m.sender] = true;
  
  try {
    if (typeof m.react === 'function') m.react('⌛');

    // 2. SIMULACIÓN DE PRESENCIA (Escribiendo)
    global.autoEscribiendo.add(m.chat);
    await conn.sendPresenceUpdate('composing', m.chat).catch(() => {});

    // 3. DESCARGA USANDO API-DYLUX
    let data = await fg.tiktok(args[0]);
    
    // Verificación de resultado
    if (!data || !data.result || !data.result.play) {
      throw new Error("No se pudo obtener el video o la URL de descarga está vacía.");
    }
    
    let { title, play, duration } = data.result;
    let { nickname } = data.result.author;

    // 4. PREPARACIÓN Y ENVÍO DEL MENSAJE
    let caption = `
⚔️ *Descargador de TikTok*

◦ 👤 *Autor:* ${nickname}
◦ 📌 *Título:* ${title || 'Sin Título'}
◦ ⏱️ *Duración:* ${duration || 'N/A'}
`.trim();

    await conn.sendMessage(m.chat, {
      video: { url: play },
      caption: caption
    }, { quoted: m });

    if (typeof m.react === 'function') m.react('✅');
    
  } catch (e) {
    // 5. MANEJO DE ERRORES
    if (typeof m.react === 'function') m.react('❌');
    console.error("❌ Error en el plugin de TikTok:", e.message);
    
    let errorMessage = e.message.includes('No se pudo obtener el video') ? 
                       `❌ *Error al descargar:* No se pudo encontrar un enlace de video válido para esa publicación.` :
                       `❌ *Error inesperado:* ${e.message}`;
                       
    return conn.sendMessage(m.chat, { text: errorMessage }, { quoted: m });
    
  } finally {
    // 6. LIMPIEZA
    delete userRequests[m.sender];
    global.autoEscribiendo.delete(m.chat);
    await conn.sendPresenceUpdate('available', m.chat).catch(() => {});
  }
};

// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ["tiktok"];
handler.tags = ["descargas"];
handler.command = ["tt", "tiktok", "ttdl"];

export default handler;
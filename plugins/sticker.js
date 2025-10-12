import { sticker } from '../lib/sticker.js';
import uploadFile from '../lib/uploadFile.js';
import uploadImage from '../lib/uploadImage.js';
import { webp2png } from '../lib/webp2mp4.js'; // Asumiendo que esta es la ruta correcta

// ===================================================
// 🧠 CONSTANTES GLOBALES Y UTILIDADES
// ===================================================

// Asegúrate de definir estas variables globales en el archivo principal (config.js o similar)
// Si no están definidas globalmente, cámbialas aquí:
const redes = 'https://chat.whatsapp.com/KkAYjIFHOGXKNjUN6IkUqf'; 
const defaultIcon = null; // null si no tienes una imagen para la miniatura

// Función auxiliar para validar URLs de imagen/video
const isUrl = (text) => {
  // Regex más inclusivo para imágenes, videos y webp
  return text.match(new RegExp(/https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/, 'gi'));
};


// ===================================================
// 💬 HANDLER PRINCIPAL
// ===================================================

let handler = async (m, { conn, args, usedPrefix, command }) => {
  let stiker = false;
  
  try {
    let q = m.quoted ? m.quoted : m;
    let mime = (q.msg || q).mimetype || q.mediaType || '';

    // 1. PROCESAMIENTO DE ARCHIVOS ADJUNTOS (IMAGEN/VIDEO/WEBP)
    if (/webp|image|video/g.test(mime)) {
      
      // Chequeo de duración para videos
      if (/video/g.test(mime)) {
        if ((q.msg || q).seconds > 8) {
          return m.reply(`☁️ *¡El video no puede durar más de 8 segundos!*`);
        }
      }

      let img = await q.download?.();
      if (!img) {
        return conn.reply(m.chat, `🐉 *_Error al descargar el archivo. Intenta de nuevo._*`, m);
      }

      let out;
      try {
        // Intento 1: Crear sticker directamente
        stiker = await sticker(img, false, global.packname, global.author);
      } catch (e) {
        console.error('❌ Error al crear sticker (Intento 1):', e);
        
        // Intento 2: Usar funciones auxiliares si falla el intento 1
        if (!stiker) {
            
          // Convertir o subir el archivo a una URL
          if (/webp/g.test(mime)) out = await webp2png(img); // Convertir WEBP a PNG (o URL)
          else if (/image/g.test(mime)) out = await uploadImage(img); // Subir imagen
          else if (/video/g.test(mime)) out = await uploadFile(img); // Subir video
          
          // Si 'out' no es una URL (string), intentar subir como imagen por última vez
          if (typeof out !== 'string') out = await uploadImage(img);
          
          // Crear sticker desde la URL resultante
          if (out) {
              stiker = await sticker(false, out, global.packname, global.author);
          }
        }
      }

    // 2. PROCESAMIENTO DE URL
    } else if (args[0] && isUrl(args[0])) {
      stiker = await sticker(false, args[0], global.packname, global.author);
    } else {
        // No hay archivo adjunto ni URL válida
        return conn.reply(m.chat, '⚡ *_Debes enviar una imagen, video/gif (máx 8s), o responder a uno, o proporcionar una URL de imagen/video._*', m);
    }
    
  } catch (e) {
    console.error('❌ Error general en el handler de sticker:', e);
    // Asignar el error a stiker para mostrar el mensaje de fallo en el finally si no se creó
    if (!stiker) stiker = e; 
  } finally {
    
    // 3. ENVÍO O MENSAJE DE FALLO
    if (stiker) {
      // Si stiker es un Buffer o URL de sticker, lo enviamos
      conn.sendFile(
        m.chat, 
        stiker, 
        'sticker.webp', 
        '', 
        m, 
        true, 
        { 
          contextInfo: { 
            'forwardingScore': 200, 
            'isForwarded': false, 
            externalAdReply: { 
              showAdAttribution: false, 
              title: global.packname, 
              body: `𝚅𝙴𝙶𝙴𝚃𝙰 𝙱𝙾𝚃- 𝙼𝙱 `, 
              mediaType: 2, 
              sourceUrl: redes,
              thumbnail: defaultIcon || Buffer.alloc(0) // Usamos defaultIcon o un Buffer vacío para evitar errores
            }
          }
        }, 
        { quoted: m }
      );
    } else {
      // Mensaje de fallo si stiker nunca se creó
      return conn.reply(m.chat, '❌ *_Fallo al crear el sticker. Asegúrate de que el archivo no esté corrupto y cumple con los límites de tiempo/tamaño._*', m);
    }
  }
};

handler.help = ['stiker <img>', 'sticker <url>'];
handler.tags = ['sticker'];
handler.command = ['s', 'sticker', 'stiker'];

export default handler;
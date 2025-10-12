import fetch from 'node-fetch';
import axios from 'axios';
import { fileTypeFromBuffer } from 'file-type';

// ===================================================
// 🧠 ESTADO DEL SISTEMA Y LÍMITES
// ===================================================
const userRequests = {}; // Mapa para prevenir spam por usuario
// Map usado para el estado de presencia (si no está definido en handler.js)
if (!global.autoEscribiendo) global.autoEscribiendo = new Map(); 


// ===================================================
// 💬 HANDLER PRINCIPAL (INSTAGRAM DL)
// ===================================================
const handler = async (m, { conn, args, command, usedPrefix }) => {
  if (!args[0]) {
    return m.reply(`⚠️ Ingresa el enlace del vídeo de Instagram junto al comando.\n\nEjemplo: *${usedPrefix + command}* https://www.instagram.com/p/C60xXk3J-sb/?igsh=YzljYTk1ODg3Zg==`);
  }

  // 1. Prevención de Spam por Usuario
  if (userRequests[m.sender]) {
    return await conn.reply(
      m.chat,
      `Oye @${m.sender.split('@')[0]}, calma, ya estás descargando algo 😒\nEspera a que termine tu solicitud actual antes de hacer otra...`,
      m
    );
  }

  userRequests[m.sender] = true;
  await m.react('⌛');
  
  // Opcional: Mostrar que el bot está escribiendo
  global.autoEscribiendo.set(m.chat, Date.now());
  await conn.sendPresenceUpdate('composing', m.chat).catch(() => {});

  try {
    const downloadAttempts = [
      async () => {
        const res = await fetch(`https://api.siputzx.my.id/api/d/igdl?url=${args[0]}`);
        const data = await res.json();
        return data.data?.[0]?.url;
      },
      async () => {
        // Asumiendo que 'info' y 'fgmods' son variables globales accesibles
        const res = await fetch(`${info.fgmods.url}/downloader/igdl?url=${args[0]}&apikey=${info.fgmods.key}`);
        const data = await res.json();
        return data.result?.[0]?.url;
      },
      async () => {
        // Asumiendo que 'info' y 'apis' son variables globales accesibles
        const apiUrl = `${info.apis}/download/instagram?url=${encodeURIComponent(args[0])}`;
        const apiResponse = await fetch(apiUrl);
        const delius = await apiResponse.json();
        return delius.data?.[0]?.url;
      },
    ];

    let fileUrl = null;
    for (const attempt of downloadAttempts) {
      try {
        fileUrl = await attempt();
        if (fileUrl) {
            console.log(`✅ URL obtenida del intento #${downloadAttempts.indexOf(attempt) + 1}: ${fileUrl}`);
            break;
        }
      } catch (err) {
        console.error(`❌ Error en intento #${downloadAttempts.indexOf(attempt) + 1}: ${err.message}`);
        continue;
      }
    }

    if (!fileUrl) throw new Error('No se pudo obtener la URL del archivo desde ninguna API.');

    // 2. Descargar y obtener Buffer + Tipo de archivo (Uso de getBuffer)
    const fileResult = await getBuffer(fileUrl);
    
    if (!fileResult) {
        throw new Error('Tipo de archivo no válido (solo MP4, JPG, PNG).');
    }

    const { buffer, detectedType } = fileResult;
    const isVideo = detectedType.mime.startsWith('video');

    const fileName = isVideo ? 'ig.mp4' : 'ig.jpg';
    const caption = isVideo ? '*Aqui está el video de Instagram*' : '_*Aquí tiene tu imagen de Instagram*_';

    // 3. Envío del archivo
    await conn.sendFile(m.chat, buffer, fileName, caption, m);
    await m.react('✅');

  } catch (e) {
    await m.react('❌');
    console.error('❌ Error en el proceso de descarga de IG:', e);
    // Nota: El límite se gestiona mejor con una base de datos global (db.data.users)
    // handler.limit = 0; 
    await conn.reply(m.chat, '❌ Lo siento, no pude descargar el contenido de esa URL.', m);
  } finally {
    // 4. Limpieza
    delete userRequests[m.sender];
    global.autoEscribiendo.delete(m.chat);
    await conn.sendPresenceUpdate('available', m.chat).catch(() => {});
  }
};


// ===================================================
// 💬 FUNCIÓN AUXILIAR ROBUSTA (Mantenida sin cambios)
// ===================================================
const getBuffer = async (url, options = {}) => {
  const res = await axios({
    method: 'get',
    url,
    headers: { 'DNT': 1, 'Upgrade-Insecure-Request': 1 },
    ...options,
    responseType: 'arraybuffer',
  });
  const buffer = Buffer.from(res.data, 'binary');
  const detectedType = await fileTypeFromBuffer(buffer);
  
  if (!detectedType || (detectedType.mime !== 'image/jpeg' && detectedType.mime !== 'image/png' && detectedType.mime !== 'video/mp4')) {
    return null;
  }
  return { buffer, detectedType };
};


// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================
handler.help = ['instagram *<link ig>*'];
handler.tags = ['descargas'];
handler.command = /^(instagramdl|instagram|igdl|ig|instagramdl2|instagram2|igdl2|ig2|instagramdl3|instagram3|igdl3|ig3)$/i;
handler.limit = 1;
handler.register = true;

export default handler;
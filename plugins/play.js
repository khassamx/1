/**
 * Plugin: !play - Busca y descarga audio de YouTube
 * Comando: !play [nombre de la canción]
 * Comando: !playv [nombre del video]
 * Dependencias clave: yt-search, api-dylux (en tu package.json)
 */

import yts from 'yt-search';
import { join } from 'path';
// Importamos 'api-dylux' que está en tu package.json
import dyluxApi from 'api-dylux'; 

// ==========================================================
// 🔥 FUNCIÓN DE DESCARGA IMPLEMENTADA 🔥
// Usaremos la API de dylux que ya está en tu package.json.
// ==========================================================
async function descargarYoutube(url, isVideo = false) {
    if (isVideo) {
        // Usa ytmp4 para videos
        const res = await dyluxApi.ytmp4(url);
        if (!res.result) throw new Error("No se pudo obtener el enlace de video de la API.");
        return { url: res.result, type: 'video/mp4' };
    } else {
        // Usa ytmp3 para audios
        const res = await dyluxApi.ytmp3(url);
        if (!res.result) throw new Error("No se pudo obtener el enlace de audio de la API.");
        return { url: res.result, type: 'audio/mp4' };
    }
}

const plugin = {
    name: "!play", 

    async run(sock, m, from, args) {
        // Determinamos el comando real usado (ya que tu bot carga !play)
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        const rawCmd = text.split(" ")[0].toLowerCase();

        if (args.length === 0 && rawCmd === '!play') {
            await sock.sendMessage(from, { text: "👑 SAIYAJIN, dime qué quieres que reproduzca. Usa: `!play nombre canción` o `!playv nombre video`." }, { quoted: m });
            return;
        }

        const command = rawCmd === '!playv' ? '!playv' : '!play';
        // Ajustamos la query para comandos como "!playv" o "!play"
        const query = rawCmd === '!playv' ? args.join(" ") : args.join(" ");
        const isVideo = command === '!playv';

        if (query.length === 0) {
            await sock.sendMessage(from, { text: "👑 SAIYAJIN, necesito un título para buscar." }, { quoted: m });
            return;
        }

        await sock.sendMessage(from, { text: `🔎 Buscando: *${query}*...` }, { quoted: m });

        try {
            // 1. Búsqueda en YouTube
            const results = await yts(query);
            if (!results.videos.length) {
                await sock.sendMessage(from, { text: "❌ No encontré nada con ese título, intenta con uno diferente." }, { quoted: m });
                return;
            }

            const video = results.videos[0];
            const caption = `
🎶 *TÍTULO:* ${video.title}
👑 *CANAL:* ${video.author.name}
⏱️ *DURACIÓN:* ${video.timestamp}
🔗 *ENLACE:* ${video.url}

${isVideo ? '⬇️ Descargando Video...' : '⬇️ Descargando Audio...'}
            `;
            
            // 2. Notificación y Thumbnail
            await sock.sendMessage(from, {
                image: { url: video.image },
                caption: caption
            }, { quoted: m });

            // 3. Descarga y Envío
            const downloadResult = await descargarYoutube(video.url, isVideo);
            
            const mediaType = isVideo ? 'video' : 'audio';
            const mimeType = isVideo ? 'video/mp4' : 'audio/mp4';

            await sock.sendMessage(from, {
                [mediaType]: { url: downloadResult.url },
                mimetype: mimeType,
                fileName: `${video.title}.${isVideo ? 'mp4' : 'mp3'}`,
                // Para audios, forzamos el modo 'ptt' (Push to Talk)
                ...(mediaType === 'audio' && { ptt: true }) 
            }, { quoted: m });

            await sock.sendMessage(from, { text: "✅ Descarga y envío completados, SAIYAJIN." }, { quoted: m });


        } catch (e) {
            console.error("❌ Error en el plugin !play:", e);
            await sock.sendMessage(from, { text: `⚠️ Error ejecutando la descarga. Asegúrate de tener la dependencia 'api-dylux' instalada. \nDetalle: ${e.message}` }, { quoted: m });
        }
    }
};

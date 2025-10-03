/**
 * Plugin: !tiktok - Descarga videos de TikTok (con o sin marca de agua)
 * Comando: !tiktok [enlace de TikTok]
 * Dependencias clave: api-dylux
 */

import dyluxApi from 'api-dylux';

const plugin = {
    name: "!tiktok", 

    async run(sock, m, from, args) {
        if (args.length === 0) {
            await sock.sendMessage(from, { text: "👑 SAIYAJIN, necesito un enlace de TikTok para descargar. Usa: `!tiktok [enlace]`." }, { quoted: m });
            return;
        }

        const url = args[0];
        
        // Simple validación de URL de TikTok
        if (!/tiktok\.com/i.test(url)) {
            await sock.sendMessage(from, { text: "❌ El enlace no parece ser de TikTok. ¡Inténtalo de nuevo!", }, { quoted: m });
            return;
        }

        await sock.sendMessage(from, { text: "⏳ Analizando y descargando video de TikTok... por favor espera un momento." }, { quoted: m });

        try {
            // Usamos la función 'tiktokdl' de api-dylux para obtener la info
            const res = await dyluxApi.tiktokdl(url);

            if (!res || !res.video.noWatermark) {
                await sock.sendMessage(from, { text: "❌ No se pudo encontrar un enlace de descarga sin marca de agua o el video es privado/restringido. Asegúrate de que la publicación sea pública.", }, { quoted: m });
                return;
            }

            const videoUrl = res.video.noWatermark;
            const captionText = `
✅ *TikTok Descargado*
👑 *Autor:* ${res.author.name} (${res.author.unique_id})
🎶 *Descripción:* ${res.desc || 'Sin descripción'}
            `;

            // Enviamos el video sin marca de agua
            await sock.sendMessage(from, {
                video: { url: videoUrl },
                caption: captionText,
                mimetype: 'video/mp4',
            }, { quoted: m });
            
            await sock.sendMessage(from, { text: "✅ Descarga y envío completados, SAIYAJIN. ¡Video sin marca de agua listo!" }, { quoted: m });


        } catch (e) {
            console.error("❌ Error en el plugin !tiktok:", e);
            await sock.sendMessage(from, { text: `⚠️ Error al procesar el enlace de TikTok. Detalles: ${e.message}` }, { quoted: m });
        }
    }
};

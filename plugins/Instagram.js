/**
 * Plugin: !ig - Descarga contenido de Instagram (Fotos/Videos/Carrusel)
 * Comando: !ig [enlace de Instagram]
 * Dependencias clave: api-dylux
 */

import dyluxApi from 'api-dylux';

const plugin = {
    name: "!ig", 

    async run(sock, m, from, args) {
        if (args.length === 0) {
            await sock.sendMessage(from, { text: "👑 SAIYAJIN, necesito un enlace de Instagram para descargar. Usa: `!ig [enlace]`." }, { quoted: m });
            return;
        }

        const url = args[0];
        
        // Validación de URL de Instagram
        if (!/instagram\.com\/(p|reel|tv|stories)\/[\w-]+/i.test(url)) {
            await sock.sendMessage(from, { text: "❌ El enlace no parece ser de Instagram o el formato es incorrecto." }, { quoted: m });
            return;
        }

        await sock.sendMessage(from, { text: "⏳ Analizando la publicación de Instagram... ¡Prepárate para la descarga!" }, { quoted: m });

        try {
            // Usamos la función 'igdl' de api-dylux
            const res = await dyluxApi.igdl(url);

            if (!res || res.length === 0) {
                await sock.sendMessage(from, { text: "❌ No se pudo encontrar o descargar el contenido. Asegúrate de que la publicación sea **pública** y el enlace esté completo." }, { quoted: m });
                return;
            }

            // Aseguramos que 'mediaList' sea siempre un array, incluso si es un solo archivo
            const mediaList = Array.isArray(res) ? res : [res];
            
            let successfulDownloads = 0;

            for (let i = 0; i < mediaList.length; i++) {
                const media = mediaList[i];
                const isVideo = media.type === 'video';
                const fileUrl = media.url;
                
                // Determinamos el tipo de media para enviarlo correctamente
                const mediaSendKey = isVideo ? 'video' : 'image';
                
                // Construimos el caption (etiqueta)
                let captionText = (mediaList.length > 1) 
                    ? `✅ Descarga completada. *Carrusel ${i + 1} de ${mediaList.length}*` 
                    : '✅ Descarga completada, SAIYAJIN.';

                // El primer elemento del carrusel lleva el mensaje principal
                if (i === 0) {
                    captionText = (mediaList.length > 1) 
                        ? '🔥 *Carrusel detectado.* Enviando todos los elementos...\n' + captionText
                        : captionText;
                }
                
                // Enviamos el mensaje
                await sock.sendMessage(from, {
                    [mediaSendKey]: { url: fileUrl },
                    caption: captionText,
                    mimetype: isVideo ? 'video/mp4' : 'image/jpeg',
                }, { quoted: m });
                
                successfulDownloads++;

                // Pequeña pausa entre elementos de un carrusel para evitar saturar
                if (mediaList.length > 1) await new Promise(resolve => setTimeout(resolve, 800));
            }

            if (successfulDownloads > 0 && mediaList.length > 1) {
                 await sock.sendMessage(from, { text: `👑 Se han enviado *${successfulDownloads} elementos* del carrusel.` }, { quoted: m });
            }


        } catch (e) {
            console.error("❌ Error en el plugin !ig:", e);
            await sock.sendMessage(from, { text: `⚠️ Error al procesar el enlace de Instagram. Puede que la API esté temporalmente caída o el video sea privado. Detalles: ${e.message}` }, { quoted: m });
        }
    }
};

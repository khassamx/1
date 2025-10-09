/**
 * Plugin: !tiktok - Descarga videos de TikTok
 * Autor: Itsuki-IA Adaptado por Keko
 */

import dyluxApi from 'api-dylux'

const plugin = {
  name: "!tiktok",

  async run(sock, m, from, args) {
    if (!args[0]) {
      return sock.sendMessage(from, {
        text: "👑 SAIYAJIN, necesito un enlace de TikTok para descargar. Usa: `!tiktok [enlace]`."
      }, { quoted: m })
    }

    const url = args[0].trim()

    // Validación de URL flexible
    if (!/(tiktok\.com|vm\.tiktok\.com|t\.tiktok\.com)/i.test(url)) {
      return sock.sendMessage(from, {
        text: "❌ El enlace no parece ser válido de TikTok. Inténtalo de nuevo."
      }, { quoted: m })
    }

    await sock.sendMessage(from, { text: "⏳ Analizando y descargando video de TikTok... por favor espera un momento." }, { quoted: m })

    try {
      const res = await dyluxApi.tiktokdl(url)
      if (!res || !res.video) {
        return sock.sendMessage(from, {
          text: "❌ No se pudo descargar el video. Puede que sea privado, eliminado o que la API esté caída."
        }, { quoted: m })
      }

      // Prioridad: video sin marca de agua, luego con marca
      const videoUrl = res.video.noWatermark || res.video.watermark
      const watermarkStatus = res.video.noWatermark ? "sin marca de agua" : "con marca de agua"

      const captionText = `
✅ *TikTok Descargado* (${watermarkStatus})
👑 *Autor:* ${res.author.name || 'Desconocido'} (${res.author.unique_id || 'unknown'})
🎶 *Descripción:* ${res.desc || 'Sin descripción'}
🔗 *Enlace:* ${url}
      `.trim()

      // Envío del video
      await sock.sendMessage(from, {
        video: { url: videoUrl },
        caption: captionText,
        mimetype: 'video/mp4',
      }, { quoted: m })

      await sock.sendMessage(from, {
        text: `✅ Descarga completada, SAIYAJIN. ¡Disfruta tu TikTok ${watermarkStatus}!`
      }, { quoted: m })

    } catch (e) {
      console.error("❌ Error en !tiktok:", e)
      await sock.sendMessage(from, {
        text: `⚠️ Error al procesar el enlace de TikTok. Puede que el video sea privado o la API esté caída.\nDetalles: ${e.message}`
      }, { quoted: m })
    }
  }
}

export default plugin
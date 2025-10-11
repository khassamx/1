/**
 * Plugin: autodetect Instagram Full Pro
 * Autor: KekoOfficial
 * Función: Detecta enlaces de Instagram automáticamente, muestra info y descarga medios (Full versión estable)
 */

const processedLinks = {} // Evita descargas repetidas por chat

const plugin = {
  name: "autodetect-ig-full-pro",
  all: true, // Se ejecuta en todos los mensajes

  async run(sock, m) {
    if (!m.text) return

    // 🔍 Detección de enlaces de Instagram
    const regex = /https?:\/\/(www\.)?instagram\.com\/(p|reel|tv|stories|[^\/]+)\/?[\w-]*/gi
    const urls = m.text.match(regex)
    if (!urls || urls.length === 0) return

    for (let url of urls) {
      if (processedLinks[m.chat]?.includes(url)) continue
      processedLinks[m.chat] = processedLinks[m.chat] || []
      processedLinks[m.chat].push(url)

      // ✨ Aviso de detección
      await sock.sendMessage(m.chat, { text: "⏳ Detecté un enlace de Instagram. Analizando contenido..." }, { quoted: m })

      try {
        // 🔄 API estable (Ryzendesu)
        const res = await fetch(`https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`)
        const data = await res.json()

        if (!data || !data.result || data.result.length === 0) {
          await sock.sendMessage(m.chat, { text: "❌ No se pudo descargar el contenido. Asegúrate que sea público o válido." }, { quoted: m })
          continue
        }

        const mediaList = Array.isArray(data.result) ? data.result : [data.result]

        // 📝 Información (si la API la devuelve)
        const infoText = data.username
          ? `📌 Usuario: ${data.username}\n🆔 ID: ${data.id || 'No disponible'}\n📅 Fecha: ${data.date || 'Desconocida'}\n🔗 Tipo: ${data.type || 'Desconocido'}`
          : '📌 Información no disponible para este post'

        await sock.sendMessage(m.chat, { text: infoText }, { quoted: m })

        // 📤 Envío de archivos
        for (let i = 0; i < mediaList.length; i++) {
          const media = mediaList[i]
          const isVideo = media.type?.includes("video") || media.url?.includes(".mp4")
          const mediaKey = isVideo ? 'video' : 'image'
          const caption = mediaList.length > 1
            ? `🔥 Carrusel detectado: elemento ${i + 1} de ${mediaList.length}`
            : `✅ Descarga completada.`

          await sock.sendMessage(m.chat, {
            [mediaKey]: { url: media.url },
            caption,
            mimetype: isVideo ? 'video/mp4' : 'image/jpeg'
          }, { quoted: m })

          if (mediaList.length > 1) await new Promise(r => setTimeout(r, 1000))
        }

      } catch (e) {
        console.error("❌ Error autodetect Instagram Full Pro:", e)
        await sock.sendMessage(m.chat, { text: `⚠️ Oops~ algo falló 💜\n\n🧩 Detalle técnico: ${e.message}` }, { quoted: m })
      }
    }
  }
}

export default plugin
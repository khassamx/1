import fetch from "node-fetch"

let handler = async (m, { conn, text }) => {
  if (!text) return

  // Regex para detectar links de YouTube
  const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
  const match = text.match(ytRegex)
  if (!match) return  // No es link de YouTube

  const urlVideo = match[0]

  try {
    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } })

    // Intentamos la API principal
    let res, downloadUrl
    try {
      res = await fetch(`https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${encodeURIComponent(urlVideo)}`)
      const data = await res.json()
      downloadUrl = data.download_url ?? data.result?.download_url ?? data.url ?? data.result?.audio
      if (!downloadUrl) throw new Error("No se obtuvo link de audio de la API principal")
      console.log("✅ Usando API principal (Zenkey)")
    } catch (err) {
      // API de respaldo
      console.warn("⚠️ Error con API principal, usando respaldo...")
      res = await fetch(`https://apiadonix.kozow.com/download/ytmp3?apikey=${global.apikey}&url=${encodeURIComponent(urlVideo)}`)
      const data = await res.json()
      downloadUrl = data.url ?? data.data?.download?.url
      if (!downloadUrl) throw new Error("No se obtuvo link de audio de la API de respaldo")
      console.log("✅ Usando API de respaldo (Adonix)")
    }

    // Descargar el audio
    const fileResp = await fetch(downloadUrl)
    const buffer = Buffer.from(await fileResp.arrayBuffer())

    // Enviar el audio
    await conn.sendMessage(
      m.chat,
      {
        audio: buffer,
        mimetype: "audio/mpeg",
        fileName: `audio.mp3`
      },
      { quoted: m }
    )

    console.log(`🎵 Audio enviado correctamente: ${urlVideo}`)

  } catch (e) {
    console.error("❌ Error descargando audio:", e)
    m.reply("❌ No se pudo descargar el audio. Intenta con otro link.")
  }
}

// Handler automático, sin comando
handler.command = []
handler.help = ["Descarga automática si detecta link de YouTube"]
handler.tags = ["descargas"]
handler.customPrefix = /.*/  // permite que cualquier mensaje pase por este handler

export default handler
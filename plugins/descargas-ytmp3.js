import fetch from "node-fetch"

// Este handler se ejecutará en todos los mensajes y detectará URLs de YouTube
let handler = async (m, { conn, text }) => {
  if (!text) return // No hay texto, ignoramos

  // Regex para detectar links de YouTube
  const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
  const match = text.match(ytRegex)
  if (!match) return // No es link de YouTube, ignoramos

  const urlVideo = match[0] // tomamos la URL completa

  try {
    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } })

    let res, fromBackup = false

    try {
      res = await fetch(`https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${encodeURIComponent(urlVideo)}`)
      if (!res.ok) throw new Error("Error en API principal")
      console.log("» Usando API principal (Zenkey)")
    } catch {
      console.warn("» Error con API principal, intentando respaldo...")
      res = await fetch(`https://apiadonix.kozow.com/download/ytmp3?apikey=${global.apikey}&url=${encodeURIComponent(urlVideo)}`)
      if (!res.ok) throw new Error("Error en API de respaldo")
      console.log("» Usando API de respaldo (Adonix)")
      fromBackup = true
    }

    const data = await res.json()
    console.log("📦 Respuesta completa del API:", JSON.stringify(data, null, 2))

    const downloadUrl = fromBackup
      ? data.url
      : (
        data.result?.download_url ??
        data.download_url ??
        data.url ??
        data.result?.url ??
        data.result?.link ??
        data.result?.audio ??
        null
      )

    if (!downloadUrl) return m.reply("❌ No se pudo obtener el audio de la respuesta.")

    const fileResp = await fetch(downloadUrl)
    const buffer = Buffer.from(await fileResp.arrayBuffer())

    await conn.sendMessage(
      m.chat,
      {
        audio: buffer,
        mimetype: "audio/mpeg",
        fileName: `audio.mp3`
      },
      { quoted: m }
    )

    console.log(`✅ Descargado correctamente: ${urlVideo}`)

  } catch (e) {
    console.error("❌ Error descargando audio:", e)
    m.reply("❌ Error al descargar el audio. Intenta con otro link.")
  }
}

// Este handler se activa sin comando, en todos los mensajes
handler.command = []
handler.help = ["Descarga automática si detecta link de YouTube"]
handler.tags = ["descargas"]
handler.customPrefix = /.*/  // esto permite que cualquier mensaje pase por el handler

export default handler
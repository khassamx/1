import fetch from "node-fetch"

let handler = async (m, { conn, args }) => {
  if (!args[0]) return m.reply(`🌸 Ingresa un link de YouTube\n\n📌 Ejemplo: .ytmp3 https://youtu.be/xxxxx`)

  const urlVideo = args[0].trim()

  try {
    await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } })

    let res, data, downloadUrl

    // 🌸 Intento 1: API Zenkey
    try {
      res = await fetch(`https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${encodeURIComponent(urlVideo)}`)
      data = await res.json()
      downloadUrl =
        data.result?.download_url ||
        data.result?.url ||
        data.result?.audio ||
        data.url ||
        null

      if (downloadUrl) console.log("✅ Usando API principal (Zenkey)")
    } catch (e) {
      console.warn("⚠️ Error con API principal:", e)
    }

    // 🌸 Intento 2: API de respaldo (Adonix)
    if (!downloadUrl) {
      try {
        res = await fetch(`https://apiadonix.kozow.com/download/ytmp3?apikey=${global.apikey || 'adonixfree'}&url=${encodeURIComponent(urlVideo)}`)
        data = await res.json()
        downloadUrl =
          data.result?.download_url ||
          data.result?.audio ||
          data.url ||
          data.link ||
          null
        if (downloadUrl) console.log("✅ Usando API de respaldo (Adonix)")
      } catch (e) {
        console.warn("⚠️ Error con API de respaldo:", e)
      }
    }

    // 🌸 Intento 3: API alterna (Ytdl by Violetics)
    if (!downloadUrl) {
      try {
        res = await fetch(`https://violetics.pw/api/downloader/ytmp3?apikey=beta&url=${encodeURIComponent(urlVideo)}`)
        data = await res.json()
        downloadUrl = data.result?.link || data.result?.audio || null
        if (downloadUrl) console.log("✅ Usando API alternativa (Violetics)")
      } catch (e) {
        console.warn("⚠️ Error con API alternativa:", e)
      }
    }

    // ❌ Ninguna funcionó
    if (!downloadUrl) return m.reply("🥲 No se pudo enviar el audio desde ninguna API. Intenta con otro enlace o más tarde.")

    // ✅ Descargar y enviar el audio
    const fileResp = await fetch(downloadUrl)
    const buffer = Buffer.from(await fileResp.arrayBuffer())

    await conn.sendMessage(
      m.chat,
      {
        audio: buffer,
        mimetype: "audio/mpeg",
        fileName: `ytmp3_${Date.now()}.mp3`
      },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } })

  } catch (e) {
    console.error("❌ Error en ytmp3 handler:", e)
    m.reply("❌ Error al descargar el audio. Intenta con otro link.")
  }
}

handler.command = ['ytmp3']
handler.help = ["ytmp3 <link>"]
handler.tags = ["descargas"]

export default handler
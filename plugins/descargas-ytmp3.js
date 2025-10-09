// 📁 plugins/Descargas-ytmp3.js
// 🌸 Adaptado y optimizado para Itsuki-IA 💕

import fetch from "node-fetch"

const handler = async (m, { conn, args }) => {
  if (!args[0])
    return m.reply(`🌸 *Ingresa un link de YouTube*  
\n📌 *Ejemplo:*  
> .ytmp3 https://youtu.be/xxxxxx`)

  const urlVideo = args[0].trim()
  await conn.sendMessage(m.chat, { react: { text: "⏳", key: m.key } })

  let downloadUrl = null
  let source = "❌ Ninguna"

  try {
    // 🌀 1️⃣ API Zenkey (Principal)
    try {
      const res = await fetch(
        `https://api.zenkey.my.id/api/download/ytmp3?apikey=zenkey&url=${encodeURIComponent(urlVideo)}`
      )
      const data = await res.json()
      downloadUrl =
        data.result?.download_url ||
        data.result?.url ||
        data.result?.audio ||
        data.url ||
        null
      if (downloadUrl) source = "✅ Zenkey"
    } catch (err) {
      console.warn("⚠️ Zenkey falló:", err.message)
    }

    // 🌀 2️⃣ API Adonix (Respaldo)
    if (!downloadUrl) {
      try {
        const res = await fetch(
          `https://apiadonix.kozow.com/download/ytmp3?apikey=${global.apikey || "adonixfree"}&url=${encodeURIComponent(urlVideo)}`
        )
        const data = await res.json()
        downloadUrl =
          data.result?.download_url ||
          data.result?.audio ||
          data.url ||
          data.link ||
          null
        if (downloadUrl) source = "✅ Adonix"
      } catch (err) {
        console.warn("⚠️ Adonix falló:", err.message)
      }
    }

    // 🌀 3️⃣ API Violetics (Alternativa)
    if (!downloadUrl) {
      try {
        const res = await fetch(
          `https://violetics.pw/api/downloader/ytmp3?apikey=beta&url=${encodeURIComponent(urlVideo)}`
        )
        const data = await res.json()
        downloadUrl = data.result?.link || data.result?.audio || null
        if (downloadUrl) source = "✅ Violetics"
      } catch (err) {
        console.warn("⚠️ Violetics falló:", err.message)
      }
    }

    // ❌ Si ninguna API devolvió resultado
    if (!downloadUrl)
      return m.reply("🥲 No se pudo descargar el audio desde ninguna API. Intenta con otro enlace o más tarde.")

    console.log(`[INFO] Descarga desde: ${source}`)

    // 📦 Descarga y verificación
    const response = await fetch(downloadUrl)
    if (!response.ok) throw new Error(`Fallo al descargar: ${response.statusText}`)

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("audio") && !contentType.includes("mpeg")) {
      console.warn("⚠️ Tipo MIME inesperado:", contentType)
    }

    const buffer = Buffer.from(await response.arrayBuffer())

    await conn.sendMessage(
      m.chat,
      {
        audio: buffer,
        mimetype: "audio/mpeg",
        fileName: `ytmp3_${Date.now()}.mp3`,
        caption: `🎵 *Descarga completada con éxito*\n> Fuente: ${source}`
      },
      { quoted: m }
    )

    await conn.sendMessage(m.chat, { react: { text: "✅", key: m.key } })
  } catch (err) {
    console.error("❌ Error en ytmp3 handler:", err)
    m.reply("💥 Ocurrió un error al procesar tu solicitud. Intenta con otro link o más tarde.")
    await conn.sendMessage(m.chat, { react: { text: "❎", key: m.key } })
  }
}

handler.command = ["ytmp3"]
handler.help = ["ytmp3 <link>"]
handler.tags = ["descargas"]

export default handler
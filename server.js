import express from "express"
import ytdl from "ytdl-core"

const app = express()
const PORT = process.env.PORT || 3000

app.get("/ytmp3", async (req, res) => {
  const url = req.query.url
  if (!url) return res.status(400).json({ error: "Falta el parámetro ?url=" })

  try {
    const info = await ytdl.getInfo(url)
    const title = info.videoDetails.title

    res.header("Content-Disposition", `attachment; filename="${title}.mp3"`)
    ytdl(url, { filter: "audioonly", quality: "highestaudio" }).pipe(res)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: "Error al convertir el video." })
  }
})

app.listen(PORT, () => console.log(`🚀 Servidor YTMP3 activo en el puerto ${PORT}`))
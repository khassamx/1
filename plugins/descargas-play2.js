import yts from 'yt-search'
import fetch from 'node-fetch'

const API_KEY = 'sylphy-fbb9'

async function getVideo(url) {
  const endpoints = [
    `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(url)}&apikey=${API_KEY}`,
    `https://api.akuari.my.id/downloader/youtube?link=${encodeURIComponent(url)}`,
    `https://api.lolhuman.xyz/api/ytvideo2?apikey=genbotkey&url=${encodeURIComponent(url)}`
  ]

  for (const api of endpoints) {
    try {
      const res = await fetch(api)
      const data = await res.json()
      let link = data?.data?.url || data?.result?.link || data?.result?.url || data?.url
      if (link) {
        return { url: link, title: data?.data?.title || data?.title || 'Video sin título' }
      }
    } catch { continue }
  }
  throw new Error('Ninguna API devolvió resultado válido')
}

let handler = async (m, { conn, text, usedPrefix }) => {
  if (!text) {
    return conn.reply(m.chat, `
🎵 *Descargar desde YouTube*

> Usa el comando:
\`${usedPrefix}play2 <nombre del video>\`

Ejemplo:
> ${usedPrefix}play2 faded
`.trim(), m)
  }

  try {
    await conn.reply(m.chat, '🔍 *Buscando tu video...*', m)

    const search = await yts(text)
    if (!search.videos.length) throw 'No se encontraron resultados'

    const video = search.videos[0]
    const info = await getVideo(video.url)

    const caption = `
🎬 *Título:* ${info.title}
👤 *Autor:* ${video.author.name}
⏱ *Duración:* ${video.timestamp}
🔗 *Link:* ${video.url}

Selecciona qué deseas descargar 👇
`.trim()

    await conn.sendMessage(m.chat, {
      image: { url: video.thumbnail },
      caption,
      buttons: [
        { buttonId: `${usedPrefix}ytv ${video.url}`, buttonText: { displayText: '🎥 Descargar Video' }, type: 1 },
        { buttonId: `${usedPrefix}yta ${video.url}`, buttonText: { displayText: '🎧 Descargar Audio' }, type: 1 }
      ],
      headerType: 4
    }, { quoted: m })

  } catch (e) {
    console.error(e)
    await conn.reply(m.chat, `❌ Error: ${e.message || e}`, m)
  }
}

handler.help = ['play2 <nombre>']
handler.tags = ['descargas']
handler.command = ['play2']

export default handler
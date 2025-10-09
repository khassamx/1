// 📁 plugins/Descargas.tiktok.js
// 🌸 Adaptado con amor para Itsuki-IA 💕

import axios from 'axios'

const handler = async (m, { conn, text, usedPrefix }) => {
  if (!text) {
    return conn.reply(
      m.chat,
      `🌸 *¿Y qué quieres que busque en TikTok sin decirme nada?*  
Dame un enlace o escribe algo lindo, baka~ 💗`,
      m
    )
  }

  const isUrl = /(?:https?:\/\/)?(?:www\.|vm\.|vt\.|t\.)?tiktok\.com\/([^\s&]+)/i.test(text)

  try {
    await m.react('🕒')

    if (isUrl) {
      // ▸ Descarga directa por enlace
      const res = await axios.get(
        `https://www.tikwm.com/api/?url=${encodeURIComponent(text)}&hd=1`
      )
      const data = res.data?.data
      if (!data?.play) return conn.reply(m.chat, 'ꕥ Enlace inválido o sin contenido descargable.', m)

      const { title, duration, author, created_at, type, images, music, play } = data
      const caption = createCaption(title, author, duration, created_at)

      if (type === 'image' && Array.isArray(images)) {
        // Envío de álbum o imágenes
        for (const url of images.slice(0, 10)) {
          await conn.sendMessage(m.chat, { image: { url }, caption }, { quoted: m })
        }

        if (music) {
          await conn.sendMessage(
            m.chat,
            {
              audio: { url: music },
              mimetype: 'audio/mp4',
              fileName: 'tiktok_audio.mp4'
            },
            { quoted: m }
          )
        }
      } else {
        // Envío de video
        await conn.sendMessage(
          m.chat,
          { video: { url: play }, caption },
          { quoted: m }
        )
      }
    } else {
      // ▸ Búsqueda por texto
      const res = await axios.post(
        'https://tikwm.com/api/feed/search',
        new URLSearchParams({ keywords: text, count: 20, cursor: 0, HD: 1 }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'User-Agent':
              'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
          }
        }
      )

      const results = res.data?.data?.videos?.filter(v => v.play) || []
      if (results.length === 0)
        return conn.reply(m.chat, 'ꕥ No encontré videos para eso, intenta con otras palabras 💭', m)

      for (const v of results.slice(0, 5)) {
        const caption = createSearchCaption(v)
        await conn.sendMessage(m.chat, { video: { url: v.play }, caption }, { quoted: m })
      }
    }

    await m.react('✅')
  } catch (e) {
    await m.react('❎')
    await conn.reply(
      m.chat,
      `😵‍💫 *Oops, algo salió mal...*\n💕 Usa *${usedPrefix}report* si quieres informarlo.\n\n${e.message}`,
      m
    )
  }
}

// ▸ Funciones auxiliares
function createCaption(title, author, duration, created_at = '') {
  const name = author?.nickname || author?.unique_id || 'Desconocido'
  const uid = author?.unique_id || 'unknown'
  return (
    `🦋 *Título ›* \`${title || 'No disponible'}\`\n` +
    `> 👑 Autor › *${name}*\n` +
    `> ⏳ Duración › *${duration || 'No disponible'}s*` +
    `${created_at ? `\n> 📆 Creado » ${created_at}` : ''}\n` +
    `> 🎶 Música » [${name}] original sound - ${uid}`
  )
}

function createSearchCaption(data) {
  const name = data.author?.nickname || 'Desconocido'
  const uid = data.author?.unique_id ? `@${data.author.unique_id}` : ''
  return (
    `❀ *Título ›* ${data.title || 'No disponible'}\n\n` +
    `☕︎ *Autor ›* ${name} ${uid}\n` +
    `✧︎ *Duración ›* ${data.duration || 'No disponible'}s\n` +
    `𝅘𝅥𝅮 *Música ›* ${data.music?.title || `[${name}] original sound - ${data.author?.unique_id || 'unknown'}`}`
  )
}

handler.help = ['tiktok', 'tt']
handler.tags = ['downloader']
handler.command = ['tiktok', 'tt', 'tiktoks', 'tts']
handler.group = true

export default handler
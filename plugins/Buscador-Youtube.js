// 📁 plugins/MIMI-BuscarMusica.js
// 💜 MIMI ver. BTS — Buscador de Música con encanto idol 🌸

import yts from 'yt-search'

let handler = async (m, { conn, text, usedPrefix, command }) => {
  const ctxErr = (global.rcanalx || {})
  const ctxWarn = (global.rcanalw || {})
  const ctxOk = (global.rcanalr || {})

  if (global.db?.data?.users?.[m.sender]) {
    global.db.data.users[m.sender].dolares = global.db.data.users[m.sender].dolares || 0
  }

  if (!text) {
    return conn.reply(m.chat, `
💜 안녕~ Soy *MIMI ver. BTS* 🎤✨  
Tu asistente musical con alma de idol 🌸  

🎶 ¿Qué canción te gustaría que busque, oppa~?

📝 Usa el comando así:
${usedPrefix + command} <nombre de la canción>

💡 Ejemplos:
• ${usedPrefix + command} Love Me Like This NMIXX  
• ${usedPrefix + command} Dynamite BTS  
• ${usedPrefix + command} New Jeans ETA  

🌷 ¡Déjame encontrar tu ritmo perfecto! 💫  
    `.trim(), m, ctxWarn)
  }

  try {
    const searchResults = await yts(text)
    if (!searchResults.videos.length) {
      return conn.reply(m.chat, '😿 No pude encontrar esa canción, oppa~ 🎶\n\n💜 ¡Verifica el nombre y lo intento de nuevo! 🌸', m, ctxErr)
    }

    const video = searchResults.videos[0]

    const songInfo = `
🎧✨ *MIMI ver. BTS encontró tu canción* 💜

🎵 Título: ${video.title}
👩‍🎤 Artista / Canal: ${video.author.name}
🕒 Duración: ${video.timestamp}
📅 Publicado: ${video.ago}
📊 Vistas: ${video.views.toLocaleString()}
🔗 Enlace: ${video.url}

💜 ¿Listo para sentir el beat? 🎶
🌸 *MIMI te manda buena vibra musical~!* 🎤✨
    `.trim()

    await conn.sendMessage(m.chat, {
      image: { url: video.thumbnail },
      caption: songInfo
    })

  } catch (error) {
    console.error('Error en búsqueda musical:', error)
    await conn.reply(
      m.chat,
      `❌ Oh no... algo salió mal 💔  
🌸 *MIMI* no pudo buscar tu canción por ahora~  
🔧 Error: ${error.message}  
💜 Intenta de nuevo más tarde, ne~ 🎶`,
      m,
      ctxErr
    )
  }
}

handler.help = ['buscar <canción>', 'song <canción>', 'musica <canción>']
handler.tags = ['musica', 'busqueda']
handler.command = ['buscar', 'song', 'musica', 'music', 'mp3']

handler.limit = false
handler.premium = false
handler.register = false

export default handler
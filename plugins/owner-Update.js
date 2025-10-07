import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// 🌐 Miniatura de contacto
async function makeFkontak() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/WillZek/Storage-CB2/main/images/d110942e81b3.jpg')
    const thumb2 = Buffer.from(await res.arrayBuffer())
    return {
      key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'Mally-Update' },
      message: { locationMessage: { name: '⚙️ Actualización del sistema', jpegThumbnail: thumb2 } },
      participant: '0@s.whatsapp.net'
    }
  } catch {
    return null
  }
}

// 🧮 Contadores globales
global.mallyUpdates = global.mallyUpdates || 0   // Siempre fijo
global.mallyMessages = global.mallyMessages || 0 // Aumenta por cada mensaje

// 💻 Handler principal
let handler = async (m, { conn, args }) => {
  try {
    // 🌸 Aumentar contador de mensajes
    global.mallyMessages++

    // Mensaje inicial bonito con contador
    const initMessage = `
╭┄┄┄┄┄┄┄┄• • • ┄┄┄┄┄┄┄┄
       ⏳ *Buscando actualizaciones...* ⏳
╰┄┄┄┄┄┄┄┄┄• • • ┄┄┄┄┄┄

💬 *Mensajes procesados:* ${global.mallyMessages}
🧮 *Total de actualizaciones:* ${global.mallyUpdates}

🌸 Mally Bot está trabajando para ti 🌸
`
    await conn.reply(m.chat, initMessage, m, rcanalw)

    // Ejecutar git pull
    const cmd = 'git --no-pager pull --rebase --autostash' + (args?.length ? ' ' + args.join(' ') : '')
    const output = execSync(cmd, { cwd: ROOT, encoding: 'utf8' })

    const lower = output.toLowerCase()
    const isUpToDate = lower.includes('already up to date') || lower.includes('up to date')
    let response

    // 🌸 Caso 1: Ya está actualizado
    if (isUpToDate) {
      response = `
✅ *Mally Bot* ya está completamente actualizada 🌸

💬 *Mensajes procesados:* ${global.mallyMessages}
🧮 *Total de actualizaciones:* ${global.mallyUpdates}

✨ Todo está al día y funcionando a la perfección 💖
`
    } 
    // 🌟 Caso 2: Se aplicaron actualizaciones
    else {
      global.mallyUpdates++ // Aumenta solo al aplicar update
      global.mallyMessages++ // Subir también mensajes procesados por el mensaje final

      const changed = []
      const lines = output.split(/\r?\n/)
      for (const ln of lines) {
        const match = ln.match(/^\s*([A-Za-z0-9_\-./]+)\s*\|\s*\d+/)
        if (match && match[1] && !changed.includes(match[1])) changed.push(match[1])
      }

      const banner = [
        '╭┄┄┄┄┄┄┄┄• • • ┄┄┄┄┄┄┄┄',
        '       🌸 *Se han aplicado actualizaciones* 🌸',
        '╰┄┄┄┄┄┄┄┄┄• • • ┄┄┄┄┄┄',
        '',
        '📂 *Archivos actualizados:*'
      ]
      const list = changed.slice(0, 10).map(f => `✅ ${f}`).join('\n') || '✅ Ningún archivo relevante'

      response = `
🆙 *Mally Bot se actualizó correctamente* 🌸

${banner.join('\n')}
${list}

🧮 *Total de actualizaciones:* ${global.mallyUpdates}
💬 *Mensajes procesados:* ${global.mallyMessages}

🚀 *Mally Bot ahora está lista para brillar aún más!* 💖
`
    }

    const fkontak = await makeFkontak().catch(() => null)

    // 📤 Enviar resultado solo al chat/grupo donde esté el dueño
    await conn.reply(m.chat, response.trim(), fkontak || m, rcanalw)

  } catch (error) {
    const msg = /not a git repository/i.test(error?.message || '')
      ? '❌ *Este directorio no es un repositorio Git.*\nUsa `git init` y agrega el remoto antes de usar `update`.'
      : `❌ *Error al actualizar:*\n${error?.message || 'Error desconocido.'}`
    await conn.reply(m.chat, msg, m, rcanalw)
  }
}

// 📚 Metadatos
handler.help = ['update', 'actualizar']
handler.tags = ['owner']
handler.command = /^(update|actualizar|up)$/i
handler.rowner = true

export default handler
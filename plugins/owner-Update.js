// 🌸 Owner-global-typing.js
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import fetch from 'node-fetch'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// 🌐 Miniatura de contacto estilo MIMI
async function makeFkontak() {
  try {
    const res = await fetch('https://raw.githubusercontent.com/WillZek/Storage-CB2/main/images/d110942e81b3.jpg')
    const thumb2 = Buffer.from(await res.arrayBuffer())
    return {
      key: { participants: '0@s.whatsapp.net', remoteJid: 'status@broadcast', fromMe: false, id: 'MIMI-Update' },
      message: { locationMessage: { name: '⚙️ Actualización del sistema MIMI 🌸', jpegThumbnail: thumb2 } },
      participant: '0@s.whatsapp.net'
    }
  } catch {
    return null
  }
}

// 🧮 Contadores globales
global.mimiUpdates = global.mimiUpdates || 0
global.mimiMessages = global.mimiMessages || 0

// 🌍 Loop de escribiendo global
global.typingIntervals = global.typingIntervals || {}
function startGlobalTyping(conn) {
  const chats = Object.keys(conn.chats || {})
  for (const chatId of chats) {
    if (!global.typingIntervals[chatId]) {
      global.typingIntervals[chatId] = setInterval(() => {
        try { conn.sendPresenceUpdate('composing', chatId) } catch {}
      }, 5000) // cada 5 segundos
    }
  }
}

// 💻 Handler principal de update
let handler = async (m, { conn, args }) => {
  try {
    global.mimiMessages++

    const initMessage = `
╭───────────────────
       ⏳ *MIMI está buscando actualizaciones...* 💜
╰───────────────────

💬 *Mensajes procesados:* ${global.mimiMessages}
🧮 *Total de actualizaciones:* ${global.mimiUpdates}

🌸 Tu asistente idol está trabajando para ti 🎀
`
    await conn.reply(m.chat, initMessage, m, rcanalw)

    // Ejecutar git pull
    const cmd = 'git --no-pager pull --rebase --autostash' + (args?.length ? ' ' + args.join(' ') : '')
    const output = execSync(cmd, { cwd: ROOT, encoding: 'utf8' })

    const lower = output.toLowerCase()
    const isUpToDate = lower.includes('already up to date') || lower.includes('up to date')
    let response

    if (isUpToDate) {
      response = `
✅ *MIMI ver. BTS* ya está completamente actualizada 🌸✨

💬 *Mensajes procesados:* ${global.mimiMessages}
🧮 *Total de actualizaciones:* ${global.mimiUpdates}

💖 Todo está al día y lista para brillar con energía idol 🎀
`
    } else {
      global.mimiUpdates++
      global.mimiMessages++

      const changed = []
      const lines = output.split(/\r?\n/)
      for (const ln of lines) {
        const match = ln.match(/^\s*([A-Za-z0-9_\-./]+)\s*\|\s*\d+/)
        if (match && match[1] && !changed.includes(match[1])) changed.push(match[1])
      }

      const banner = [
        '╭───────────────────',
        '       🌸 *Se han aplicado actualizaciones!* 🌸',
        '╰───────────────────',
        '',
        '📂 *Archivos actualizados:*'
      ]
      const list = changed.slice(0, 10).map(f => `✅ ${f}`).join('\n') || '✅ Ningún archivo relevante'

      response = `
🆙 *MIMI ver. BTS se actualizó correctamente!* 🌸🎤

${banner.join('\n')}
${list}

🧮 *Total de actualizaciones:* ${global.mimiUpdates}
💬 *Mensajes procesados:* ${global.mimiMessages}

💖 ¡Ahora MIMI está lista para brillar aún más y ayudarte! 🌸✨
`
    }

    const fkontak = await makeFkontak().catch(() => null)
    await conn.reply(m.chat, response.trim(), fkontak || m, rcanalw)

    // 🌍 Iniciar loop global de “escribiendo” en todos los chats activos
    startGlobalTyping(conn)

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
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'
import fetch from 'node-fetch'

// ===============================
// 🌸 CONFIGURACIÓN BASE
// ===============================
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

// 🌐 Mini función para generar contacto visual
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
global.mallyUpdates = global.mallyUpdates || 0
global.mallyMessages = global.mallyMessages || 0

// ===============================
// 💻 HANDLER PRINCIPAL
// ===============================
let handler = async (m, { conn, args }) => {
  try {
    global.mallyMessages++ // contador de mensajes global 💬

    await conn.reply(m.chat, '⏳ *Buscando actualizaciones...*', m, rcanalw)

    const cmd = 'git --no-pager pull --rebase --autostash' + (args?.length ? ' ' + args.join(' ') : '')
    const output = execSync(cmd, { cwd: ROOT, encoding: 'utf8' })

    const lower = output.toLowerCase()
    const isUpToDate = lower.includes('already up to date') || lower.includes('up to date')
    let response

    // ===============================
    // 🩷 CASO 1: Ya está actualizado
    // ===============================
    if (isUpToDate) {
      response = `
1️⃣ ✅ *Mally Bot* ya está completamente actualizada 🌸

💬 *Mensajes procesados globalmente:* ${global.mallyMessages.toLocaleString()}
🧮 *Total de actualizaciones realizadas:* ${global.mallyUpdates.toLocaleString()}

✨ Todo está al día y funcionando a la perfección 💖
`
    } 
    // ===============================
    // 🌟 CASO 2: Se aplicaron actualizaciones
    // ===============================
    else {
      global.mallyUpdates++
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
2️⃣ 🆙 *Mally Bot se actualizó correctamente* 🌸

${banner.join('\n')}
${list}

🧮 *Total de actualizaciones:* ${global.mallyUpdates.toLocaleString()}
💬 *Mensajes procesados:* ${global.mallyMessages.toLocaleString()}

🚀 *Mally Bot ahora está lista para brillar aún más!* 💖
`
    }

    const fkontak = await makeFkontak().catch(() => null)
    await conn.reply(m.chat, response.trim(), fkontak || m, rcanalw)

  } catch (error) {
    // 🔍 Detectar conflictos locales
    try {
      const status = execSync('git status --porcelain', { cwd: ROOT, encoding: 'utf8' }).trim()
      if (status) {
        const conflictedFiles = status
          .split('\n')
          .filter(Boolean)
          .filter(line => !(
            line.includes('node_modules') ||
            line.includes('sessions') ||
            line.includes('tmp/') ||
            line.includes('.cache') ||
            line.includes('package-lock.json') ||
            line.includes('database.json')
          ))

        if (conflictedFiles.length > 0) {
          const conflictMsg = `
⚠️ *Conflictos detectados en archivos locales:*

${conflictedFiles.map(f => '• ' + f.slice(3)).join('\n')}

💡 *Sugerencia:* realiza un backup y reinstala el bot o actualiza manualmente.
`
          return await conn.reply(m.chat, conflictMsg.trim(), m, rcanalw)
        }
      }
    } catch {}

    const msg = /not a git repository/i.test(error?.message || '')
      ? '❌ *Este directorio no es un repositorio Git.*\nUsa `git init` y agrega el remoto antes de usar `update`.'
      : `❌ *Error al actualizar:*\n${error?.message || 'Error desconocido.'}`
    await conn.reply(m.chat, msg, m, rcanalw)
  }
}

// ===============================
// 📚 METADATOS
// ===============================
handler.help = ['update', 'actualizar']
handler.tags = ['owner']
handler.command = /^(update|actualizar|up)$/i
handler.rowner = true

export default handler
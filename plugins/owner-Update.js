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

// 🧮 Contador global de actualizaciones
global.mallyUpdates = global.mallyUpdates || 0

// ===============================
// 💻 HANDLER PRINCIPAL
// ===============================
let handler = async (m, { conn, args }) => {
  try {
    await conn.reply(m.chat, '⏳ *Buscando actualizaciones...*', m)

    // Ejecutar comando de actualización
    const cmd = 'git --no-pager pull --rebase --autostash' + (args?.length ? ' ' + args.join(' ') : '')
    const output = execSync(cmd, { cwd: ROOT, encoding: 'utf8' })

    const lower = output.toLowerCase()
    const isUpToDate = lower.includes('already up to date') || lower.includes('up to date')
    let response

    if (isUpToDate) {
      response = '✅ *Mally Bot* ya está completamente actualizada 🌸'
    } else {
      global.mallyUpdates++
      const changed = []
      const lines = output.split(/\r?\n/)
      for (const ln of lines) {
        const match = ln.match(/^\s*([A-Za-z0-9_\-./]+)\s*\|\s*\d+/)
        if (match && match[1] && !changed.includes(match[1])) changed.push(match[1])
      }

      const banner = [
        '╭━━━━━━━🌸━━━━━━━╮',
        '     🌟 *Mally Bot Update* 🌟',
        '╰━━━━━━━🌸━━━━━━━╯',
        '',
        `🆙 *Actualización #${global.mallyUpdates} completada*`,
        '📂 *Archivos modificados:*',
        ''
      ]

      const list = changed.slice(0, 10).map(f => `✨ ${f}`).join('\n') || '✅ Ningún archivo relevante'
      response = `${banner.join('\n')}${list}\n\n🚀 *Mally Bot ahora está lista para brillar!* 💖`
    }

    const fkontak = await makeFkontak().catch(() => null)
    await conn.reply(m.chat, response, fkontak || m)
  } catch (error) {
    // 🔍 Detectar conflictos o cambios locales
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
          const conflictMsg = [
            '⚠️ *Conflictos detectados!*',
            '',
            '🧩 Archivos afectados:',
            conflictedFiles.map(f => '• ' + f.slice(3)).join('\n'),
            '',
            '💡 *Sugerencia:* Realiza un backup y reinstala el bot o actualiza manualmente.'
          ].join('\n')
          return await conn.reply(m.chat, conflictMsg, m)
        }
      }
    } catch {}

    // ❌ Error genérico
    const msg = /not a git repository/i.test(error?.message || '')
      ? '❌ *Directorio no es un repositorio Git.*\nUsa `git init` y agrega el remoto antes de actualizar.'
      : `❌ *Error al actualizar:*\n${error?.message || 'Error desconocido.'}`
    await conn.reply(m.chat, msg, m)
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
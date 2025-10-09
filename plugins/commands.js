// ✅ plugins/commands.js
// Módulo: Comandos Generales - Vegeta-Bot-MB

console.log('✅ Plugin cargado: commands.js (Comandos Generales)');

export function handleGeneralCommands(conn, m, args) {
  if (!m.text) return;

  const command = m.text.trim().toLowerCase();

  // 🎯 Lista de comandos principales
  switch (command) {
    case '!menu':
    case '.menu':
    case '/menu':
      sendMenu(conn, m);
      break;

    case '!help':
    case '.help':
    case '/help':
      sendHelp(conn, m);
      break;

    case '!status':
    case '.status':
    case '/status':
      sendStatus(conn, m);
      break;

    // ✳️ Puedes agregar más comandos aquí
    // case '!owner':
    //   conn.sendMessage(m.chat, { text: '👑 Creador: KekoOfficial' }, { quoted: m });
    //   break;

    default:
      break;
  }
}

// 📋 MENÚ PRINCIPAL
function sendMenu(conn, m) {
  const menuText = `
┏━━━🌟 *VEGETA-BOT-MB* 🌟━━━┓
┃
┃ ⚙️ *Comandos Generales*
┃    • !menu — Muestra este menú
┃    • !help — Ayuda básica
┃    • !status — Estado del bot
┃
┃ 🎵 *Descargas*
┃    • !ig [link] — Descargar de Instagram
┃    • !tiktok [link] — Descargar de TikTok
┃    • !play [canción] — Descargar de YouTube
┃
┃ 🛡️ *Administración de Grupo*
┃    • !kick @usuario — Expulsar usuario
┃    • !antilink on/off — Activar o desactivar AntiLink
┃
┗━━━━━━━━━━━━━━━━━━━━━━┛
👑 *Creador:* KekoOfficial
💬 Usa los comandos con prefijo ! o .
  `;
  conn.sendMessage(m.chat, { text: menuText }, { quoted: m });
}

// 🆘 AYUDA
function sendHelp(conn, m) {
  const helpText = `
*📖 AYUDA DEL BOT*

- Escribe *!menu* para ver todos los comandos.
- Usa *!antilink on/off* para proteger el grupo.
- Para reportar errores, contacta con *KekoOfficial*.
`;
  conn.sendMessage(m.chat, { text: helpText }, { quoted: m });
}

// 📊 ESTADO
function sendStatus(conn, m) {
  const statusText = `
✅ *VEGETA-BOT-MB está en línea*  
🕒 Hora del servidor: ${new Date().toLocaleString()}
🧠 Motor: MultiDevice
👑 Creador: KekoOfficial
`;
  conn.sendMessage(m.chat, { text: statusText }, { quoted: m });
}
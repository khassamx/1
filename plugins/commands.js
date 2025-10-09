// ✅ plugins/commands.js
// Módulo: Comandos Generales - Vegeta-Bot-MB
// Autor: KekoOfficial | Versión 2.0

console.log('✅ Plugin cargado: commands.js (Comandos Generales v2.0)');

export async function handleGeneralCommands(conn, m, args) {
  if (!m.text) return;

  const command = m.text.trim().toLowerCase();

  switch (command) {
    case '!menu':
    case '.menu':
    case '/menu':
      await sendMenu(conn, m);
      break;

    case '!help':
    case '.help':
    case '/help':
      await sendHelp(conn, m);
      break;

    case '!status':
    case '.status':
    case '/status':
      await sendStatus(conn, m);
      break;

    case '!owner':
    case '.owner':
    case '/owner':
      await conn.sendMessage(m.chat, { text: '👑 Creador: KekoOfficial' }, { quoted: m });
      break;

    case '!ping':
    case '.ping':
    case '/ping':
      await conn.sendMessage(m.chat, { text: '🏓 Pong! Bot activo y funcionando.' }, { quoted: m });
      break;

    default:
      break;
  }
}

// 📋 MENÚ INTERACTIVO CON BOTONES
async function sendMenu(conn, m) {
  const menuText = `
┏━━━🌟 *VEGETA-BOT-MB* 🌟━━━┓
┃
┃ ⚙️ *Comandos Generales*
┃    • !menu — Mostrar este menú
┃    • !help — Ayuda rápida
┃    • !status — Estado del bot
┃
┃ 🎵 *Descargas*
┃    • !ig [link] — Instagram
┃    • !tiktok [link] — TikTok
┃    • !play [canción] — YouTube Audio
┃    • !play2 [video] — YouTube Video
┃    • !ytmp3 [link] — Audio directo
┃
┃ 🛡️ *Administración de Grupo*
┃    • !kick @usuario — Expulsar
┃    • !antilink on/off — AntiLink
┃
┗━━━━━━━━━━━━━━━━━━━━━━┛
💬 Usa los comandos con prefijo !, . o /
`;

  const buttons = [
    { buttonId: '!help', buttonText: { displayText: '🆘 Ayuda' }, type: 1 },
    { buttonId: '!status', buttonText: { displayText: '🟢 Estado' }, type: 1 },
    { buttonId: '!owner', buttonText: { displayText: '👑 Creador' }, type: 1 }
  ];

  await conn.sendMessage(m.chat, {
    text: menuText,
    buttons,
    headerType: 1
  }, { quoted: m });
}

// 🆘 AYUDA DETALLADA
async function sendHelp(conn, m) {
  const helpText = `
*📖 AYUDA DEL BOT - Vegeta-Bot-MB*

🔹 *Comandos Generales*
• !menu / .menu — Ver menú interactivo
• !help / .help — Ver esta ayuda
• !status / .status — Estado del bot
• !ping — Revisar si el bot está activo
• !owner — Información del creador

🔹 *Descargas*
• !ig [link] — Descargar de Instagram
• !tiktok [link] — Descargar de TikTok
• !play [canción] — Descargar audio YouTube
• !play2 [video] — Descargar video YouTube
• !ytmp3 [link] — Audio directo de YouTube

🔹 *Administración de Grupo*
• !kick @usuario — Expulsar usuario
• !antilink on/off — Activar o desactivar AntiLink

💡 Usa los comandos con prefijo !, . o /
  `;
  await conn.sendMessage(m.chat, { text: helpText }, { quoted: m });
}

// 📊 ESTADO DEL BOT
async function sendStatus(conn, m) {
  const statusText = `
✅ *VEGETA-BOT-MB está en línea*  
🕒 Hora del servidor: ${new Date().toLocaleString()}  
🧠 Motor: MultiDevice  
👑 Creador: KekoOfficial  
💻 Versión: 2.0
`;
  await conn.sendMessage(m.chat, { text: statusText }, { quoted: m });
}
import yts from 'yt-search';
import ytdl from 'ytdl-core';

/* ================================
    🔹 FUNCIÓN PRINCIPAL DE DESCARGA
================================ */
async function getVideo(url) {
  if (!ytdl.validateURL(url)) throw new Error('URL de YouTube inválida.');
  const info = await ytdl.getInfo(url);
  const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });
  if (!format || !format.url) throw new Error('No se pudo obtener el video.');
  return { url: format.url, title: info.videoDetails.title };
}

/* ================================
    🔹 HANDLER DE COMANDO
================================ */
const handler = async (m, { conn, text, usedPrefix }) => {
  if (!text) {
    return conn.reply(m.chat, `
🎬 *Descargar Video de YouTube (MP4)*

📝 *Uso:*
${usedPrefix}play2 <nombre del video>

💡 *Ejemplo:*
${usedPrefix}play2 spy x family opening
    `.trim(), m);
  }

  try {
    await conn.reply(m.chat, '🔍 *Buscando video...* 🎧', m);

    // Buscar en YouTube
    const search = await yts(text);
    if (!search.videos.length) throw new Error('No se encontraron resultados.');

    const video = search.videos[0];
    const { url, title } = await getVideo(video.url);

    const caption = `
🎀 *Mally Bot - Video Encontrado* 🎀

💖 *Título:* ${title}
⏱️ *Duración:* ${video.timestamp}
👤 *Autor:* ${video.author.name}
🔗 *Enlace:* ${video.url}
`.trim();

    // Enviar video
    await conn.sendMessage(
      m.chat,
      {
        video: { url },
        mimetype: 'video/mp4',
        fileName: `${title}.mp4`,
        caption
      },
      { quoted: m }
    );

  } catch (e) {
    console.error('❌ Error en play2:', e);
    await conn.reply(m.chat, `❌ *Error:* ${e.message}`, m);
  }
};

/* ================================
    🔹 METADATOS DEL COMANDO
================================ */
handler.help = ['play2 <nombre>'];
handler.tags = ['descargas'];
handler.command = ['play2'];
handler.register = true;

export default handler;
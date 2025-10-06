import yts from 'yt-search';
import fetch from 'node-fetch';

/* ================================
    🔹 LISTA DE APIS DISPONIBLES
================================ */
const apis = [
  {
    name: 'Adonix',
    url: (videoUrl) => `https://api.sylphy.xyz/download/ytmp4?url=${encodeURIComponent(videoUrl)}&apikey=sylphy-fbb9`,
    parse: async (res) => {
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Adonix no devolvió JSON válido');
      }
      if (!data.status || !data.data?.url) throw new Error('Adonix no devolvió URL válida');
      return { url: data.data.url, title: data.data.title || 'Video sin título', fuente: 'Adonix' };
    }
  },
  {
    name: 'Ryzendesu',
    url: (videoUrl) => `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error('Ryzendesu no devolvió JSON válido');
      }
      if (!data.status || !data.result?.url) throw new Error('Ryzendesu no devolvió URL válida');
      return { url: data.result.url, title: data.result.title || 'Video sin título', fuente: 'Ryzendesu' };
    }
  },
  {
    name: 'YouTube Video Download API',
    url: (videoUrl) => `https://rapidapi.com/ChandanVasu/api/youtube-video-download-api1/playground?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const data = await res.json();
      if (!data.status || !data.data?.url) throw new Error('YouTube Video Download API no devolvió URL válida');
      return { url: data.data.url, title: data.data.title || 'Video sin título', fuente: 'YouTube Video Download API' };
    }
  },
  {
    name: 'YouTube Video Retriever API',
    url: (videoUrl) => `https://zylalabs.com/api-marketplace/top-search/youtube%20video%20downloader%20free?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const data = await res.json();
      if (!data.status || !data.result?.url) throw new Error('YouTube Video Retriever API no devolvió URL válida');
      return { url: data.result.url, title: data.result.title || 'Video sin título', fuente: 'YouTube Video Retriever API' };
    }
  },
  {
    name: 'My YouTube Downloader API',
    url: (videoUrl) => `https://www.reddit.com/r/SideProject/comments/1g6lcb9/my_youtube_downloader_api/?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const data = await res.json();
      if (!data.status || !data.result?.url) throw new Error('My YouTube Downloader API no devolvió URL válida');
      return { url: data.result.url, title: data.result.title || 'Video sin título', fuente: 'My YouTube Downloader API' };
    }
  },
  {
    name: 'YouTube Downloader API',
    url: (videoUrl) => `https://zylalabs.com/api-marketplace/tools/youtube%2Bdownloader%2Bapi/4105?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const data = await res.json();
      if (!data.status || !data.result?.url) throw new Error('YouTube Downloader API no devolvió URL válida');
      return { url: data.result.url, title: data.result.title || 'Video sin título', fuente: 'YouTube Downloader API' };
    }
  },
  {
    name: 'YouTube Video Download Scraper API',
    url: (videoUrl) => `https://www.piloterr.com/library/youtube-video-download?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const data = await res.json();
      if (!data.status || !data.result?.url) throw new Error('YouTube Video Download Scraper API no devolvió URL válida');
      return { url: data.result.url, title: data.result.title || 'Video sin título', fuente: 'YouTube Video Download Scraper API' };
    }
  },
  {
    name: 'YouTube Downloader API (Oxylabs)',
    url: (videoUrl) => `https://developers.oxylabs.io/scraping-solutions/web-scraper-api/targets/youtube/youtube-downloader?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const data = await res.json();
      if (!data.status || !data.result?.url) throw new Error('YouTube Downloader API (Oxylabs) no devolvió URL válida');
      return { url: data.result.url, title: data.result.title || 'Video sin título', fuente: 'YouTube Downloader API (Oxylabs)' };
    }
  },
  {
    name: 'YouTube Video Download API (Apify)',
    url: (videoUrl) => `https://apify.com/streamers/youtube-video-downloader/api?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const data = await res.json();
      if (!data.status || !data.data?.url) throw new Error('YouTube Video Download API (Apify) no devolvió URL válida');
      return { url: data.data.url, title: data.data.title || 'Video sin título', fuente: 'YouTube Video Download API (Apify)' };
    }
  },
  {
    name: 'YouTube Audio Extraction API',
    url: (videoUrl) => `https://zylalabs.com/api-marketplace/top-search/youtube%20downloader?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const data = await res.json();
      if (!data.status || !data.result?.url) throw new Error('YouTube Audio Extraction API no devolvió URL válida');
      return { url: data.result.url, title: data.result.title || 'Video sin título', fuente: 'YouTube Audio Extraction API' };
    }
  },
  {
    name: 'YouTube Video Retriever API',
    url: (videoUrl) => `https://zylalabs.com/api-marketplace/top-search/youtube%20video%20downloader%20free?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const data = await res.json();
      if (!data.status || !data.result?.url) throw new Error('YouTube Video Retriever API no devolvió URL válida');
      return { url: data.result.url, title: data.result.title || 'Video sin título', fuente: 'YouTube Video Retriever API' };
    }
  },
  {
    name: 'YouTube Downloader API',
    url: (videoUrl) => `https://zylalabs.com/api-marketplace/tools/youtube%2Bdownloader%2Bapi/4105?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const data = await res.json();
      if (!data.status || !data.result?.url) throw new Error('YouTube Downloader API no devolvió URL válida');
      return { url: data.result.url, title: data.result.title || 'Video sin título', fuente: 'YouTube Downloader API' };
    }
  },
  {
    name: 'YouTube Video Download Scraper API',
    url: (videoUrl) => `https://www.piloterr.com/library/youtube-video-download?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const data = await res.json();
      if (!data.status || !data.result?.url) throw new Error('YouTube Video Download Scraper API no devolvió URL válida');
      return { url: data.result.url, title: data.result.title || 'Video sin título', fuente: 'YouTube Video Download Scraper API' };
    }
  },
  {
    name: 'YouTube Downloader API (Oxylabs)',
    url: (videoUrl) => `https://developers.oxylabs.io/scraping-solutions/web-scraper-api/targets/youtube/youtube-downloader?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const data = await res.json();
      if (!data.status || !data.result?.url) throw new Error('YouTube Downloader API (Oxylabs) no devolvió URL válida');
      return { url: data.result.url, title: data.result.title || 'Video sin título', fuente: 'YouTube Downloader API (Oxylabs)' };
    }
  },
  {
    name: 'YouTube Video Download API (Apify)',
    url: (videoUrl) => `https://apify.com/streamers/youtube-video-downloader/api?url=${encodeURIComponent(videoUrl)}`,
    parse: async (res) => {
      const data = await res.json();
      if (!data.status || !data.data?.url) throw new Error('YouTube Video Download API (Apify) no devolvió URL válida');
      return { url: data.data.url, title: data.data.title || 'Video sin título', fuente: 'YouTube Video Download API (Apify)' };
    }
  }
];

/* ================================
    🔹 FUNCIÓN PRINCIPAL DE DESCARGA
================================ */
async function getVideo(url) {
  for (const api of apis) {
    try {
      console.log(`🎬 Probando API ${api.name}...`);
      const res = await fetch(api.url(url));
      return await api.parse(res);
    } catch (err) {
      console.warn(`⚠️ Error con ${api.name}:`, err.message);
    }
  }
  throw new Error('❌ Todas las APIs fallaron. No se pudo descargar el video.');
}

/* ================================
    🔹 HANDLER DE COMANDO
================================ */
const handler = async (m, { conn, text, usedPrefix }) => {
  const ctxWarn = global0
  const ctxErr = global.rcanalx || {};
  const ctxWarn = global.rcanalw || {};
  const ctxOk = global.rcanalr || {};

  if (!text) {
    return conn.reply(m.chat, `
🎬 *Descargar Video de YouTube (MP4)*

📝 *Uso:*
${usedPrefix}play2 <nombre del video>

💡 *Ejemplo:*
${usedPrefix}play2 spy x family opening

📽️ *Formato:* MP4 (Alta calidad)
✨ *Bot:* Mally-AI 🎀
    `.trim(), m, ctxWarn);
  }

  try {
    await conn.reply(m.chat, '🔍 *Mally está buscando tu video...* 🎧', m, ctxOk);

    // Buscar en YouTube
    const search = await yts(text);
    if (!search.videos.length) throw new Error('No se encontraron resultados en YouTube.');

    const video = search.videos[0];
    const { url, title, fuente } = await getVideo(video.url);

    const caption = `
🎀 *Mally Bot - Video Encontrado* 🎀

💖 *Título:* ${title}
⏱️ *Duración:* ${video.timestamp}
👤 *Autor:* ${video.author.name}
🔗 *Enlace:* ${video.url}

🌐 *Fuente:* ${fuente}
💬 *Disfruta tu video con Mally 💫*
`.trim();

    // Descargar video
    const buffer = await fetch(url).then(res => res.buffer());

    await conn.sendMessage(
      m.chat,
      {
        video: buffer,
        mimetype: 'video/mp4',
        fileName: `${title}.mp4`,
        caption
      },
      { quoted: m }
    );

  } catch (e) {
    console.error('❌ Error en play2:', e);
    await conn.reply(m.chat, `❌ *Error:* ${e.message}`, m, ctxErr);
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
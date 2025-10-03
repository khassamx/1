// plugins/play.js

console.log('✅ Plugin: play.js (YouTube) cargado');

export function handlePlay(conn, m, args) {
    if (m.text && m.text.startsWith('!play')) {
        conn.sendMessage(m.chat, { text: '▶️ Buscando en YouTube...' }, { quoted: m });
        // Lógica de reproducción o descarga...
    }
}

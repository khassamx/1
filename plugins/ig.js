// plugins/ig.js

console.log('✅ Plugin: ig.js cargado');

// Ejemplo de registro de comando, la lógica real iría aquí.
// La función 'handler' de tu handler.js debe llamar a estas funciones.

export function handleIG(conn, m, args) {
    if (m.text && m.text.startsWith('!ig')) {
        conn.sendMessage(m.chat, { text: '🌐 Buscando en Instagram...' }, { quoted: m });
        // Lógica de descarga...
    }
}

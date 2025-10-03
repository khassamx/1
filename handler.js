/**
 * HANDLER.JS
 * Procesa todos los mensajes entrantes de WhatsApp (Baileys) y los pasa 
 * a la lógica de comandos de los plugins.
 */
import { PREFIX } from './config/config.js';

export async function handler(m) {
    if (!m) return;
    
    // La conexión de Baileys se pasa como 'this' y se almacena en global.conn
    const conn = this; 
    
    // Obtener el texto, si existe
    const text = m.text ? m.text.trim() : '';
    
    // La fuente del prefijo es una expresión regular, obtenemos el texto literal
    const prefixString = PREFIX.source.replace(/[\[\^\]\(\)\.\/\!\#\$]/g, '');

    // 1. Identificar si es un comando (empieza con un prefijo)
    const isCommand = text && text.startsWith(prefixString);
    
    if (!isCommand) {
        // Aquí puedes poner lógica para mensajes que no son comandos (e.g., responder a saludos)
        return; 
    }

    // 2. Procesar el comando
    // Ejemplo: "!play canción"
    const commandText = text.slice(prefixString.length); // "play canción"
    const [command, ...args] = commandText.split(/\s+/); // ["play", "canción"]
    const commandLower = command.toLowerCase();

    
    // 3. Distribución de Comandos a Plugins
    
    // Iterar sobre todos los plugins cargados dinámicamente (global.plugins)
    // Usamos las funciones de manejo que definimos en los plugins (handleIG, handlePlay, etc.)

    for (const pluginName in global.plugins) {
        const plugin = global.plugins[pluginName];
        
        // --- Distribución explícita (Más seguro y directo) ---
        
        // 🚨 IMPORTANTE: El nombre del comando debe coincidir con la función del plugin
        
        if (commandLower === 'ig' && typeof plugin.handleIG === 'function') {
            await plugin.handleIG(conn, m, args);
            return;
        }

        if (commandLower === 'tiktok' && typeof plugin.handleTikTok === 'function') {
            await plugin.handleTikTok(conn, m, args);
            return;
        }

        if (commandLower === 'play' && typeof plugin.handlePlay === 'function') {
            await plugin.handlePlay(conn, m, args);
            return;
        }

        // --- Manejo General (para comandos como 'menu' o 'help') ---
        if (typeof plugin.handleGeneralCommands === 'function') {
            // Pasamos el nombre del comando y los argumentos al manejador general
            // Este manejador decidirá si procesa el comando (ej. si el comando es 'menu')
            await plugin.handleGeneralCommands(conn, m, commandLower, args);
            // No usamos 'return' aquí para dar la oportunidad a otros plugins generales de actuar.
        }
    }
    
    // 4. Comando no encontrado
    if (isCommand) {
        conn.sendMessage(m.chat, { text: `Comando *${prefixString}${commandLower}* no reconocido. Intenta *${prefixString}menu*.` }, { quoted: m });
    }
}
```eof

**Paso a seguir:**

1.  Asegúrate de haber copiado este código en **`handler.js`** (en la raíz).
2.  Asegúrate de que tus plugins (como `plugins/ig.js`) exporten las funciones con el nombre correcto: `export function handleIG(conn, m, args) { ... }`.
3.  ¡Vuelve a ejecutar con **`node index.js`**!

¡Estamos a un paso de la meta! ¡Dime qué sucede al arrancar! 🚀
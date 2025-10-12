import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { smsg } from './utils/simple.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import { logError } from './core/logger.js'; // Asumimos un módulo de logging
// IMPORTACIONES DE CORE
import { ensureUser, ensureChat, ensureSettings } from './core/db-helpers.js'; // Para reducir repetición
import { processMessageQueue } from './core/queue-manager.js'; // Para manejar la cola
import { loadPlugins, matchPrefix } from './core/plugin-loader.js'; // Para cargar y emparejar
import { setupPresenceAndCalls } from './core/presence-system.js'; // Para auto-escribiendo y llamadas

// CONSTANTES Y UTILIDADES
const { proto } = (await import('@whiskeysockets/baileys')).default;
const isNumber = x => typeof x === 'number' && !isNaN(x);
const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');

// Lógica para obtener el JID o el LID, se asume que 'conn' es el socket de Baileys
async function getLidFromJid(id, conn) {
    if (id.endsWith('@lid')) return id;
    const res = await conn.onWhatsApp(id).catch(() => []);
    return res[0]?.lid || id;
}

// Carga de Plugins
const globalPlugins = loadPlugins(___dirname);

/**
 * Handler principal para mensajes entrantes (chatUpdate).
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 * @param {object} chatUpdate
 */
export async function handler(chatUpdate, conn) {
    try {
        if (!chatUpdate) return;
        
        // Inicializar sistemas de CORE (solo en el primer mensaje)
        if (!conn.coreInitialized) {
            setupPresenceAndCalls(conn);
            processMessageQueue(conn);
            conn.coreInitialized = true;
        }

        // Delegar el push de mensajes a Baileys
        conn.pushMessage(chatUpdate.messages).catch(e => logError('Baileys_Push', e));
        
        let m = chatUpdate.messages[chatUpdate.messages.length - 1];
        if (!m) return;

        // Asegurar que la DB esté cargada
        if (global.db.data == null) await global.loadDatabase().catch(e => logError('Database_Load', e));

        // Encolar el procesamiento del mensaje para prevenir spam
        global.messageQueue.push(async () => {
            await processMessage(conn, m, chatUpdate);
        });

    } catch (e) {
        logError('Handler_Entry', e);
    }
}

/**
 * Procesa un único mensaje del Queue.
 * @param {import('@whiskeysockets/baileys').WASocket} conn
 * @param {object} m - Objeto de mensaje crudo.
 * @param {object} chatUpdate - Objeto de actualización de chat.
 */
async function processMessage(conn, m, chatUpdate) {
    try {
        // 1. Pre-procesamiento y Normalización
        m = smsg(conn, m) || m;
        if (!m || m.isBaileys) return;

        global.mconn = m;
        m.exp = 0;
        m.monedas = false;
        if (typeof m.text !== "string") m.text = "";

        // 2. Inicialización de DB (Sistema de Reducción de Repetición - ensure)
        await ensureUser(m.sender, m.name);
        await ensureChat(m.chat);
        await ensureSettings(conn.user.jid);
        
        // Aliases y Referencias
        const chat = global.db.data.chats[m.chat];
        const _user = global.db.data.users[m.sender];
        const settings = global.db.data.settings[conn.user.jid];

        // 3. Roles y Permisos Globales
        const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
        const isROwner = [...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, "") + detectwhat).includes(m.sender);
        const isOwner = isROwner || m.fromMe;
        const isPrems = isROwner || _user.premiumTime > 0;
        const isMods = false; // Se mantiene, pero se recomienda definir la lógica en otro módulo

        // 4. Metadata de Grupo (Optimización de llamadas)
        const senderLid = await getLidFromJid(m.sender, conn);
        const botLid = await getLidFromJid(conn.user.jid, conn);
        
        const groupMetadata = m.isGroup ? 
            (conn.chats[m.chat] || {}).metadata || await conn.groupMetadata(m.chat).catch(() => null) : 
            {};
        
        const participants = m.isGroup && groupMetadata ? (groupMetadata.participants || []) : [];
        const user = participants.find(p => (p?.id === senderLid || p?.jid === senderLid)) || {};
        const bot = participants.find(p => (p?.id === botLid || p?.jid === botLid)) || {};
        
        const isRAdmin = (user && user.admin) === 'superadmin';
        const isAdmin = isRAdmin || ((user && user.admin) === 'admin');
        const isBotAdmin = !!(bot && bot.admin);

        // 5. Bucle de Plugins y Emparejamiento
        for (const name in globalPlugins) {
            const plugin = globalPlugins[name];
            if (!plugin || plugin.disabled) continue;

            const __filename = join(___dirname, name);
            
            // a. Ejecución del método .all (contexto sin comando)
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(conn, m, { chatUpdate, __dirname: ___dirname, __filename });
                } catch (e) {
                    logError(`Plugin_All:${name}`, e);
                }
            }

            // b. Emparejamiento de Prefijos
            const _prefix = (plugin.customPrefix ? [plugin.customPrefix] : []).concat(settings?.prefix || global.prefix);
            const usedPrefix = matchPrefix(m.text, _prefix);
            
            if (usedPrefix) {
                const noPrefix = m.text.slice(usedPrefix.length).trim();
                const [command, ...args] = noPrefix.split(/\s+/).filter(v => v);
                const text = args.join(' ');
                const commandLower = (command || '').toLowerCase();

                const isAccept = plugin.command instanceof RegExp ?
                    plugin.command.test(commandLower) :
                    Array.isArray(plugin.command) ?
                    plugin.command.some(cmd => (cmd instanceof RegExp ? cmd.test(commandLower) : cmd === commandLower)) :
                    typeof plugin.command === 'string' ?
                    plugin.command === commandLower :
                    false;

                if (!isAccept) continue;

                // 6. Pre-Comando (Bloqueos y Requisitos)
                const fail = plugin.fail || global.dfail;
                
                // Mantenimiento, Baneo de Chat/Usuario
                if (chat.isBanned && !isROwner) return; 
                if (_user.banned && !isROwner) {
                    m.reply(`《🐉》Estás baneado/a, no puedes usar comandos en este bot!\n\n${_user.bannedReason ? `☁️ Motivo: ${_user.bannedReason}` : '🔮 *Motivo:* Sin Especificar'}`);
                    return;
                }

                // Permisos
                if (plugin.rowner && !isROwner) { fail('rowner', m, usedPrefix, commandLower, conn); continue; }
                if (plugin.owner && !isOwner) { fail('owner', m, usedPrefix, commandLower, conn); continue; }
                if (plugin.mods && !isMods) { fail('mods', m, usedPrefix, commandLower, conn); continue; }
                if (plugin.premium && !isPrems) { fail('premium', m, usedPrefix, commandLower, conn); continue; }
                if (plugin.group && !m.isGroup) { fail('group', m, usedPrefix, commandLower, conn); continue; }
                if (plugin.botAdmin && !isBotAdmin) { fail('botAdmin', m, usedPrefix, commandLower, conn); continue; }
                if (plugin.admin && !isAdmin) { fail('admin', m, usedPrefix, commandLower, conn); continue; }
                if (plugin.private && m.isGroup) { fail('private', m, usedPrefix, commandLower, conn); continue; }

                // Requisitos de Recursos/Nivel
                m.exp += ('exp' in plugin ? parseInt(plugin.exp) : 10);
                if (!isPrems && plugin.monedas && _user.monedas < plugin.monedas * 1) {
                    conn.reply(m.chat, `❮🔮❯ Se agotaron tus ${plugin.monedas} monedas.`, m); // Usar plugin.monedas para el costo
                    continue;
                }
                if (plugin.level > _user.level) {
                    conn.reply(m.chat, `❮🐉❯ Se requiere el nivel: *${plugin.level}*\n• Tu nivel actual es: *${_user.level}*\n• Usa este comando para subir de nivel:\n*${usedPrefix}levelup*`, m);
                    continue;
                }

                // 7. Preparación y Ejecución de Comando (Sandboxing)
                m.isCommand = true;
                const extra = { match: [usedPrefix], usedPrefix, noPrefix, args, command: commandLower, text, conn, participants, groupMetadata, user, bot, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename };
                
                try {
                    // Timeout para plugins (Sandboxing - 5 segundos)
                    await Promise.race([
                        plugin.call(conn, m, extra),
                        new Promise((_, reject) => setTimeout(() => reject(new Error(`Plugin Timeout: ${name}`)), 5000))
                    ]);

                    m.monedas = m.monedas || plugin.monedas || false;
                } catch (e) {
                    m.error = e;
                    logError(`Plugin_Exec:${name}`, e);
                    
                    // Responder con el error para el usuario (limpiando API keys)
                    if (e) {
                        let errorText = format(e);
                        for (let key of Object.values(global.APIKeys || {}))
                            errorText = errorText.replace(new RegExp(key, 'g'), 'Administrador');
                        m.reply(errorText);
                    }
                } finally {
                    // Post-Comando (after)
                    if (typeof plugin.after === 'function') {
                        try {
                            await plugin.after.call(conn, m, extra);
                        } catch (e) {
                            logError(`Plugin_After:${name}`, e);
                        }
                    }

                    // Actualización de stats y recursos
                    if (m.monedas) {
                        conn.reply(m.chat, `❮🐉❯ Utilizaste ${+m.monedas} monedas.`, m);
                        _user.monedas -= m.monedas * 1;
                    }
                    if (_user) _user.exp += m.exp;
                    
                    // Actualizar estadísticas (stats)
                    updateStats(m, name);
                }
                break; // Romper el bucle al encontrar y ejecutar el comando
            }
        }
        
    } catch (e) {
        logError('Handler_Process', e);
    } finally {
        // Post-Procesamiento Final
        if (settings?.autoread) await conn.readMessages([m.key]).catch(e => logError('Autoread', e));
        
        // Mover print.js a Top-Level Import o mantenerlo en utils
        // Asumimos que utils/print.js está importado arriba o disponible.
        try {
            // Nota: Este import debe ser movido arriba (top-level) idealmente
            if (!conn.printMessage) conn.printMessage = (await import('./utils/print.js')).default;
            if (!opts['noprint']) await conn.printMessage(m, conn); 
        } catch (e) {
            logError('PrintMessage', e);
        }
    }
}

// Función auxiliar para actualizar estadísticas (movida de la parte finally)
function updateStats(m, pluginName) {
    let stats = global.db.data.stats;
    if (pluginName) {
        let now = +new Date;
        let stat = stats[pluginName] = stats[pluginName] || { total: 0, success: 0, last: 0, lastSuccess: 0 };
        
        stat.total += 1;
        stat.last = now;
        
        if (m.error == null) {
            stat.success += 1;
            stat.lastSuccess = now;
        }
    }
}

// Global DFAIL (se mantiene aquí por la lógica de permisos)
global.dfail = (type, m, usedPrefix, command, conn) => {
    const msg = {
        rowner: '🐉El comando solo puede ser usado por los **creadores del bot SAIYAJIN**☁️.',
        owner: '🐉El comando solo puede ser usado por los **desarrolladores del bot SAIYAJIN**☁️.',
        mods: '🐉El comando solo puede ser usado por los **moderadores del bot SAIYAJIN**☁️.',
        premium: '🐉El comando solo puede ser usado por los **usuarios premium SAIYAJIN**☁️.',
        group: '🐉El comando solo puede ser usado en **grupos SAIYAJIN**☁️.',
        private: '🐉El comando solo puede ser usado al **privado SAIYAJIN**☁️.',
        botAdmin: `🐉Necesito ser **Administrador** para ejecutar el comando en este grupo SAIYAJIN☁️.`,
        admin: `🐉El comando es solo para **Administradores** del grupo SAIYAJIN☁️.`,
        unreg: `Para usar el bot, debes registrarte con ${usedPrefix}reg (nombre.edad) SAIYAJIN☁️.`,
    };
    
    // El 'type' de error debe coincidir con una de las claves de 'msg'
    const replyMsg = msg[type] || `⚠️ Error de permiso desconocido: ${type}`;

    conn.reply(m.chat, replyMsg, m);
};
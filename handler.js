// handler.js (Versión Final y Estable)

import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { smsg } from './utils/simple.js'; // Asegúrate de que simple.js existe
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import fs from 'fs';
import chalk from 'chalk';
import ws from 'ws';

// ===================================================
// 💬 FUNCIONES DE UTILIDAD Y CONSTANTES
// ===================================================

const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this)
    resolve()
}, ms))
// Ruta de la carpeta de plugins
const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins') 

// Variable que requiere importación asíncrona
let proto = null;

// ===================================================
// ⚙️ INICIALIZACIÓN DE CORE Y PLUGINS
// ===================================================

/**
 * Inicializa la lógica de auto-escribiendo y rechazo de llamadas (Se ejecuta 1 vez).
 * @param {object} conn Conexión de Baileys (this)
 */
function setupAutoWritingAndReject(conn) {
    if (!global.autoEscribiendo) global.autoEscribiendo = new Set();
    
    // [LÓGICA DE PRESENCIA/AUTO-ESCRIBIENDO]
    if (!conn.presenceListenerAdded) {
        conn.presenceListenerAdded = true;
        conn.ev.on('messages.upsert', async ({ messages }) => {
            const chat = messages[0]?.key?.remoteJid;
            if (chat && global.autoEscribiendo.has(chat)) {
                conn.sendPresenceUpdate('composing', chat).catch(() => global.autoEscribiendo.delete(chat));
                setTimeout(() => {
                    if (global.autoEscribiendo.has(chat)) {
                        global.autoEscribiendo.delete(chat);
                        conn.sendPresenceUpdate('available', chat).catch(() => {});
                    }
                }, 4000); 
            }
        });
    }

    // [LÓGICA DE RECHAZO DE LLAMADAS]
    if (!conn.callListenerAdded) {
        conn.callListenerAdded = true;
        conn.ev.on('call', async (call) => {
            try {
                const from = call?.from || call?.[0]?.from || call?.[0]?.participant;
                if (!from) return;
                console.log(chalk.yellow('📞 Llamada detectada de:'), from);
                await conn.rejectCall(from, call.id).catch(() => conn.sendPresenceUpdate('unavailable', from));
                await conn.sendMessage(from, { text: '🚫 Las llamadas están desactivadas. Por favor, envía un mensaje de texto.' }).catch(() => {});
            } catch (e) {
                console.error(chalk.red('❌ Error gestionando llamada:'), e);
            }
        });
    }
}

/**
 * Carga todos los plugins de la carpeta './plugins'.
 */
async function loadPlugins() {
    const pluginsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');
    global.plugins = {};
    const files = fs.readdirSync(pluginsDir);

    for (let file of files) {
        if (!file.endsWith('.js') || file.startsWith('_')) continue;
        const pluginPath = path.join(pluginsDir, file);
        try {
            // Usamos Date.now para forzar la recarga y evitar el caché del import dinámico
            const module = (await import(`${pluginPath}?update=${Date.now()}`)).default || (await import(`${pluginPath}?update=${Date.now()}`)); 
            global.plugins[file] = module;
            // console.log(chalk.green(`✅ Plugin cargado: ${file}`));
        } catch (e) {
            console.error(chalk.red(`❌ Error cargando plugin ${file}:`), e);
            // Si hay un error, el plugin NO se añade a global.plugins
        }
    }
    console.log(chalk.yellow(`💡 Se cargaron ${Object.keys(global.plugins).length} plugins.`));
}

/**
 * Función de inicialización asíncrona para elementos de nivel superior.
 * 🚨 CORRECCIÓN CLAVE: Envuelve await import para el nivel superior.
 */
async function initHandler() {
    try {
        // Cargar proto de Baileys
        const baileysModule = await import('@whiskeysockets/baileys');
        proto = baileysModule.default?.proto || baileysModule.proto; 
        
        // Cargar plugins
        await loadPlugins();

    } catch (e) {
        console.error(chalk.red("Error crítico al inicializar handler/plugins:"), e);
    }
}

// Ejecutar la inicialización inmediatamente
initHandler().catch(console.error);


// ===================================================
// 🧠 FUNCIONES AUXILIARES DE HANDLER
// (Tu lógica de DB, Roles y Comando)
// ===================================================

/**
 * Define y obtiene los roles y permisos del usuario y bot en el chat.
 */
async function defineRolesAndPermissions(conn, m) {
    const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
    const isROwner = [...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, "") + detectwhat).includes(m.sender);
    const isOwner = isROwner || m.fromMe;
    const isPrems = isROwner || global.db.data.users[m.sender]?.premiumTime > 0; 

    async function getLidFromJid(id, conn) {
        if (id.endsWith('@lid')) return id;
        const res = await conn.onWhatsApp(id).catch(() => []);
        return res[0]?.lid || id;
    }

    const senderLid = await getLidFromJid(m.sender, conn);
    const botLid = await getLidFromJid(conn.user.jid, conn);
    const senderJid = m.sender;
    const botJid = conn.user.jid;

    const groupMetadata = m.isGroup ? ((conn.chats[m.chat] || {}).metadata || await conn.groupMetadata(m.chat).catch(() => null)) : {};
    const participants = m.isGroup && groupMetadata ? (groupMetadata.participants || []) : [];

    // Prioriza la detección por JID real, luego por LID
    const user = participants.find(p => (p?.id === senderJid || p?.jid === senderJid || p?.id === senderLid || p?.jid === senderLid)) || {};
    const bot = participants.find(p => (p?.id === botJid || p?.jid === botJid || p?.id === botLid || p?.jid === botLid)) || {};

    const isRAdmin = (user && user.admin) === 'superadmin';
    const isAdmin = isRAdmin || ((user && user.admin) === 'admin');
    const isBotAdmin = !!(bot && bot.admin);
    const isMods = global.mods?.map(v => v.replace(/[^0-9]/g, "") + detectwhat).includes(m.sender) || false; // Uso seguro

    return { isROwner, isOwner, isPrems, senderLid, botLid, user, bot, isRAdmin, isAdmin, isBotAdmin, participants, groupMetadata, isMods };
}

/**
 * Inicializa y verifica la estructura de la base de datos (DB) para el mensaje.
 */
async function initializeDatabase(conn, m) {
    try {
        if (!global.db.data.users) global.db.data.users = {};
        if (!global.db.data.chats) global.db.data.chats = {};
        if (!global.db.data.settings) global.db.data.settings = {};

        let user = global.db.data.users[m.sender];
        if (typeof user !== 'object') global.db.data.users[m.sender] = {};

        // Valores por defecto para usuarios (solo se inicializan si no existen)
        const defaultUser = {
            exp: 0, coin: 10, joincount: 1, diamond: 3, lastadventure: 0, health: 100, 
            lastclaim: 0, muto: false, registered: false, name: m.name, banned: false, 
            bank: 0, level: 0, role: 'Nuv', premium: false, premiumTime: 0
        };

        for (const key in defaultUser) {
            if (typeof user !== 'object' || !(key in user) || (typeof defaultUser[key] === 'number' && !isNumber(user[key]))) {
                global.db.data.users[m.sender][key] = defaultUser[key];
            }
        }

        let chat = global.db.data.chats[m.chat];
        if (typeof chat !== 'object') global.db.data.chats[m.chat] = {};

        // Valores por defecto para chats
        const defaultChat = {
            isBanned: false, welcome: true, autolevelup: false, autoresponder: false, 
            modoadmin: false, antiLink: false, antiBot: true, autoPresencia: false, presenciaMode: 'composing'
        };

        for (const key in defaultChat) {
             if (typeof chat !== 'object' || !(key in chat)) {
                global.db.data.chats[m.chat][key] = defaultChat[key];
            }
        }

        let settings = global.db.data.settings[conn.user.jid];
        if (typeof settings !== 'object') global.db.data.settings[conn.user.jid] = {};

        // Valores por defecto para settings
        const defaultSettings = {
            self: false, restrict: true, autoread: false, 
        };

        for (const key in defaultSettings) {
             if (typeof settings !== 'object' || !(key in settings)) {
                global.db.data.settings[conn.user.jid][key] = defaultSettings[key];
            }
        }

    } catch (e) {
        console.error(chalk.red('❌ ERROR EN initializeDatabase:'), e);
    }
}

/**
 * Comprueba si el mensaje coincide con el comando de un plugin.
 */
function checkCommand(conn, m, plugin) {
    const str2Regex = str => str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
    let _prefix = (plugin.customPrefix ? [plugin.customPrefix] : []).concat(global.db.data.settings[conn.user.jid]?.prefix || global.prefix);

    let match = (_prefix instanceof RegExp ?
        [[_prefix.exec(m.text), _prefix]] :
        Array.isArray(_prefix) ?
            _prefix.map(p => {
                let re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
                return [re.exec(m.text), re]
            }) :
            typeof _prefix === 'string' ?
                [[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
                [[[], new RegExp]]
    ).find(p => p[1]);

    let usedPrefix = (match?.[0] || '')?.[0];
    let noPrefix = m.text.replace(usedPrefix, '').trim();
    let [command, ...args] = noPrefix.split(/\s+/).filter(v => v);
    let text = args.join(' ');
    command = (command || '').toLowerCase();

    let isAccept = plugin.command instanceof RegExp ?
        plugin.command.test(command) :
        Array.isArray(plugin.command) ?
            plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
            typeof plugin.command === 'string' ?
                plugin.command === command :
                false;

    return { match, usedPrefix, command, noPrefix, args, text, isAccept };
}

/**
 * Verifica los requisitos del plugin (roles, permisos, economía).
 */
function checkPluginRequirements(conn, m, plugin, { isROwner, isOwner, isMods, isPrems, isAdmin, isBotAdmin, _user, usedPrefix }) {
    let fail = plugin.fail || global.dfail; // Asumiendo que dfail está definido globalmente

    if (plugin.rowner && !isROwner) { fail('rowner', m, conn); return false; }
    if (plugin.owner && !isOwner) { fail('owner', m, conn); return false; }
    if (plugin.mods && !isMods) { fail('mods', m, conn); return false; }
    if (plugin.premium && !isPrems) { fail('premium', m, conn); return false; }
    if (plugin.group && !m.isGroup) { fail('group', m, conn); return false; } 
    if (plugin.botAdmin && !isBotAdmin) { fail('botAdmin', m, conn); return false; } 
    if (plugin.admin && !isAdmin) { fail('admin', m, conn); return false; }
    if (plugin.private && m.isGroup) { fail('private', m, conn); return false; }

    if (plugin.level > _user.level) {
        conn.reply(m.chat, `❮🐉❯ Se requiere el nivel: *${plugin.level}*\n\n• Tu nivel actual es: *${_user.level}*\n\n• Usa este comando para subir de nivel:\n*${usedPrefix}levelup*`, m);
        return false;
    }

    return true;
}

/**
 * Lógica que se ejecuta al final del handler (muteo, stats, print, autoread).
 */
async function finalLogic(conn, m) {
    if (m) { 
        let utente = global.db.data.users[m.sender]
        
        // Lógica de Muteo
        if (utente?.muto == true) {
            let bang = m.key.id
            let cancellazzione = m.key.participant
            await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: cancellazzione }})
        }

        // Lógica de Economía y XP
        if (m.sender && global.db.data.users[m.sender]) {
            global.db.data.users[m.sender].exp += (m.exp || 0)
            global.db.data.users[m.sender].monedas -= (m.monedas ? m.monedas * 1 : 0)
        }

        // Lógica de Estadísticas
        if (m.plugin) {
            let now = +new Date
            let stats = global.db.data.stats || (global.db.data.stats = {});
            let stat = stats[m.plugin] = stats[m.plugin] || { total: 0, success: 0, last: now, lastSuccess: now };

            stat.total += 1
            stat.last = now
            if (m.error == null) {
                stat.success += 1
                stat.lastSuccess = now
            }
        }
    }

    // Imprimir el mensaje en la consola (si opts['noprint'] no está activo)
    try {
        if (!global.opts['noprint']) {
            // Asumiendo que utils/print.js existe y exporta por defecto
            await (await import('./utils/print.js')).default(m, conn) 
        }
    } catch (e) {
        console.error("Error al imprimir mensaje:", e)
    }

    // Autoread
    if (global.opts['autoread']) await conn.readMessages([m.key])
}


// ===================================================
// 🎯 EXPORTACIÓN PRINCIPAL (HANDLER)
// ===================================================

export async function handler(chatUpdate) {
    // 1. Inicialización de Core (Auto-escribiendo/Rechazo)
    if (!this.presenceInitialized) {
        setupAutoWritingAndReject(this);
        this.presenceInitialized = true;
    }

    this.msgqueque = this.msgqueque || []
    this.uptime = this.uptime || Date.now()
    if (!chatUpdate || !chatUpdate.messages || chatUpdate.messages.length === 0) return
    this.pushMessage(chatUpdate.messages).catch(console.error)

    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return;
    
    // Carga de DB si no existe
    if (global.db.data == null) await global.loadDatabase()

    try {
        // 2. Conversión y Filtro de Mensajes
        m = smsg(this, m) || m
        if (!m) return
        if (m.isBaileys) return // Ignorar mensajes de Baileys
        
        global.mconn = m
        m.exp = 0
        m.monedas = false

        // 3. Inicialización de la Base de Datos (DB)
        await initializeDatabase(this, m);

        if (typeof m.text !== "string") m.text = ""
        globalThis.setting = global.db.data.settings[this.user.jid]

        // 4. Definición de Roles y Permisos
        const { isROwner, isOwner, isPrems, isRAdmin, isAdmin, isBotAdmin, participants, groupMetadata, isMods } = await defineRolesAndPermissions(this, m);
        let _user = global.db.data.users[m.sender];
        
        // 5. Filtros de Modo Self
        const isSelfMode = global.db.data.settings[this.user.jid]?.self;
        if (isSelfMode && !m.fromMe) return
        
        m.exp += Math.ceil(Math.random() * 10)
        
        // 6. Ejecución de Plugins
        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin || plugin.disabled) continue
            const __filename = join(___dirname, name)

            // -> Función .all() (Ejecutar siempre)
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(this, m, { chatUpdate, conn: this, __dirname: ___dirname, __filename, participants, groupMetadata, isOwner, isROwner }) 
                } catch (e) {
                    console.error(`Error en .all() de ${name}:`, e)
                }
            }
            if (!global.opts['restrict'] && plugin.tags && plugin.tags.includes('admin')) continue

            // -------------------------------------------------------------------------
            // 📌 CONTROL CRÍTICO DE LISTA BLANCA (WHITELIST)
            // -------------------------------------------------------------------------
            global.allowedGroups = global.allowedGroups || new Set();
            if (m.isGroup && !global.allowedGroups.has(m.chat)) {
                const allowedCommands = ['owner', 'addgrupo', 'removegrupo', 'addbotx', 'menu', 'menú', 'help']; 
                const isControlCommand = (plugin.tags && plugin.tags.includes('owner')) || 
                                         allowedCommands.some(cmd => plugin.command && (Array.isArray(plugin.command) ? plugin.command.includes(cmd) : plugin.command === cmd));
                if (!isControlCommand) continue; 
            }
            // -------------------------------------------------------------------------

            // -> Comprobación de Prefijo y Comando
            const { match, usedPrefix, command, noPrefix, args, text, isAccept } = checkCommand(this, m, plugin);

            // -> Función .before() (Ejecutar antes del comando si hay match o texto)
            if (typeof plugin.before === 'function' && (match || m.text)) { 
                const extraBefore = { match, conn: this, participants, groupMetadata, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename };
                if (await plugin.before.call(this, m, extraBefore)) continue
            }
            
            // Si no hay match o el comando no es aceptado, pasar al siguiente plugin
            if (typeof plugin !== 'function' || !match || !usedPrefix || !isAccept) continue;

            m.plugin = name
            global.comando = command

            // -> Comprobación de Baneos y Modo Admin
            const userDB = global.db.data.users[m.sender];
            const chatDB = global.db.data.chats[m.chat];
            
            if (chatDB?.isBanned && !isROwner && !plugin.unbanchat) return; // Si está baneado y no es comando de desban

            if (m.text && userDB?.banned && !isROwner && !plugin.unbanuser) { // Si está baneado y no es comando de desban
                m.reply(`《🐉》@${m.sender.split('@')[0]} estás baneado/a, no puedes usar comandos en este bot!\n\n${userDB.bannedReason ? `☁️ Motivo: ${userDB.bannedReason}` : '🔮 *Motivo:* Sin Especificar'}`, null, { mentions: [m.sender] });
                return;
            }

            let adminMode = global.db.data.chats[m.chat]?.modoadmin;
            if (adminMode && !isOwner && !isROwner && m.isGroup && !isAdmin) continue

            // -> Comprobación de Requisitos (Roles y Economía)
            if (!checkPluginRequirements(this, m, plugin, { isROwner, isOwner, isMods, isPrems, isAdmin, isBotAdmin, _user, usedPrefix })) continue;

            // -> Ejecución Final
            m.isCommand = true
            let xp = 'exp' in plugin ? parseInt(plugin.exp) : 10
            m.exp += xp

            let extra = { match, usedPrefix, noPrefix, args, command, text, conn: this, participants, groupMetadata, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename };
            try {
                // Ejecutar la función principal del plugin
                await plugin.call(this, m, extra); 
                m.error = false
            } catch (e) {
                m.error = e;
                console.error(chalk.red(`❌ Error al ejecutar el comando ${command} en ${name}:`), e);
                m.reply(format(e));
            } finally {
                await finalLogic(this, m);
            }
        }

    } catch (e) {
        console.error(chalk.red("Error General en Handler (Fuera de Plugin):"), e)
        m.reply(format(e))
    } finally {
        // Ejecutar guardado de DB al final
        global.db.write()
    }
}


// ===================================================
// 7. LÓGICA DE MONITOREO DE PLUGINS (Hot Reload)
// ===================================================

const file = join(path.dirname(fileURLToPath(import.meta.url)), 'handler.js')
watchFile(file, () => {
    unwatchFile(file)
    console.log(chalk.redBright('«Update»'), chalk.greenBright(file))
    // Recargar el handler forzando un nuevo import
    import(`${file}?update=${Date.now()}`) 
})
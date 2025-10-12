// handler.js (Versión Completa y Refactorizada)

import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { smsg } from './utils/simple.js';
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
const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')

// Variables que requieren importación asíncrona
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
 * 🚨 CORRECCIÓN CLAVE: Esta función es ahora 'async' para poder usar 'await import()'.
 */
async function loadPlugins() {
    const pluginsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');
    global.plugins = {};
    const files = fs.readdirSync(pluginsDir);

    for (let file of files) {
        if (!file.endsWith('.js') || file.startsWith('_')) continue;
        const pluginPath = path.join(pluginsDir, file);
        try {
            const module = (await import(`${pluginPath}?update=${Date.now()}`)).default; // Usar Date.now para evitar caché
            global.plugins[file] = module;
            // console.log(chalk.green(`✅ Plugin cargado: ${file}`));
        } catch (e) {
            console.error(chalk.red(`❌ Error cargando plugin ${file}:`), e);
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
        // Cargar proto
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
// ===================================================

// [Resto de las funciones auxiliares de tu código: defineRolesAndPermissions, initializeDatabase, checkCommand, checkPluginRequirements, finalLogic]

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

    const user = participants.find(p => (p?.id === senderLid || p?.id === senderJid || p?.jid === senderLid || p?.jid === senderJid)) || {};
    const bot = participants.find(p => (p?.id === botLid || p?.id === botJid || p?.jid === botLid || p?.jid === botJid)) || {};

    const isRAdmin = (user && user.admin) === 'superadmin';
    const isAdmin = isRAdmin || ((user && user.admin) === 'admin');
    const isBotAdmin = !!(bot && bot.admin);
    const isMods = global.mods.map(v => v.replace(/[^0-9]/g, "") + detectwhat).includes(m.sender);

    return { isROwner, isOwner, isPrems, senderLid, botLid, user, bot, isRAdmin, isAdmin, isBotAdmin, participants, groupMetadata, isMods };
}

/**
 * Inicializa y verifica la estructura de la base de datos (DB) para el mensaje.
 */
async function initializeDatabase(conn, m) {
    try {
        let user = global.db.data.users[m.sender];
        if (typeof user !== 'object') global.db.data.users[m.sender] = {};

        const defaultUser = {
            exp: 0, coin: 10, joincount: 1, diamond: 3, lastadventure: 0, health: 100, 
            lastclaim: 0, lastcofre: 0, lastdiamantes: 0, lastcode: 0, lastduel: 0, 
            lastpago: 0, lastmining: 0, lastcodereg: 0, muto: false, registered: false, 
            genre: '', birth: '', marry: '', description: '', packstickers: null, 
            name: m.name, age: -1, regTime: -1, afk: -1, afkReason: '', banned: false, 
            useDocument: false, bank: 0, level: 0, role: 'Nuv', premium: false, premiumTime: 0
        };

        for (const key in defaultUser) {
            if (typeof user !== 'object' || !(key in user) || (typeof defaultUser[key] === 'number' && !isNumber(user[key]))) {
                global.db.data.users[m.sender][key] = defaultUser[key];
            }
        }

        let chat = global.db.data.chats[m.chat];
        if (typeof chat !== 'object') global.db.data.chats[m.chat] = {};

        const defaultChat = {
            isBanned: false, sAutoresponder: '', welcome: true, autolevelup: false, autoresponder: false, 
            delete: false, autoAceptar: true, autoRechazar: true, detect: true, antiBot: true, 
            antiBot2: true, modoadmin: false, antiLink: false, antiLink2: false, antifake: false, 
            reaction: false, nsfw: false, expired: 0, antiLag: false, per: [], autoPresencia: false, presenciaMode: 'composing'
        };

        for (const key in defaultChat) {
             if (typeof chat !== 'object' || !(key in chat)) {
                global.db.data.chats[m.chat][key] = defaultChat[key];
            }
        }

        let settings = global.db.data.settings[conn.user.jid];
        if (typeof settings !== 'object') global.db.data.settings[conn.user.jid] = {};

        const defaultSettings = {
            self: false, restrict: true, jadibotmd: true, antiPrivate: false, autoread: false, status: 0
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

    if ((m.id.startsWith('NJX-') || (m.id.startsWith('BAE5') && m.id.length === 16) || (m.id.startsWith('B24E') && m.id.length === 20))) {
        isAccept = false;
    }

    return { match, usedPrefix, command, noPrefix, args, text, isAccept };
}

/**
 * Verifica los requisitos del plugin (roles, permisos, economía).
 */
function checkPluginRequirements(conn, m, plugin, { isROwner, isOwner, isMods, isPrems, isAdmin, isBotAdmin, _user, usedPrefix }) {
    let fail = plugin.fail || global.dfail;

    if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) { fail('owner', m, conn); return false; }
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
 * Lógica que se ejecuta al final del handler (cola, muteo, stats).
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
            global.db.data.users[m.sender].exp += m.exp
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

    try {
        if (!opts['noprint']) await (await import('./utils/print.js')).default(m, conn)
    } catch (e) {
        console.error("Error en utils/print.js:", e)
    }

    if (opts['autoread']) await conn.readMessages([m.key])
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
    
    // 2. Control de Mensajes (Cola, Uptime)
    this.msgqueque = this.msgqueque || []
    this.uptime = this.uptime || Date.now()
    if (!chatUpdate || !chatUpdate.messages || chatUpdate.messages.length === 0) return
    this.pushMessage(chatUpdate.messages).catch(console.error)

    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return;
    if (global.db.data == null) await global.loadDatabase()

    try {
        // 3. Conversión del mensaje
        m = smsg(this, m) || m
        if (!m) return
        if (m.isBaileys) return // Ignorar mensajes de Baileys
        
        global.mconn = m
        m.exp = 0
        m.monedas = false

        // 4. Inicialización de la Base de Datos (DB)
        await initializeDatabase(this, m);

        if (typeof m.text !== "string") m.text = ""
        const chat = global.db.data.chats[m.chat]
        globalThis.setting = global.db.data.settings[this.user.jid]

        // 5. Definición de Roles y Permisos
        const { isROwner, isOwner, isPrems, senderLid, botLid, user, bot, isRAdmin, isAdmin, isBotAdmin, participants, groupMetadata, isMods } = await defineRolesAndPermissions(this, m);
        let _user = global.db.data.users[m.sender];
        
        // 6. Filtros de Modo Self
        if (global.db.data.settings[this.user.jid].self && !m.fromMe) return
        if (global.db.data.settings[this.user.jid].self === false && !m.fromMe) return
        
        m.exp += Math.ceil(Math.random() * 10)
        
        // 7. Ejecución de Plugins
        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin || plugin.disabled) continue
            const __filename = join(___dirname, name)

            // -> Función .all()
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(this, m, { chatUpdate, conn: this, __dirname: ___dirname, __filename, participants, groupMetadata, isOwner, isROwner }) 
                } catch (e) {
                    console.error(`Error en .all() de ${name}:`, e)
                }
            }
            if (!opts['restrict'] && plugin.tags && plugin.tags.includes('admin')) continue

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

            // -> Función .before()
            if (typeof plugin.before === 'function' && (match || m.text)) { 
                const extraBefore = { match, conn: this, participants, groupMetadata, user, bot, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename };
                if (await plugin.before.call(this, m, extraBefore)) continue
            }
            if (typeof plugin !== 'function' || !match || !(usedPrefix) || !isAccept) continue;

            m.plugin = name
            global.comando = command

            // -> Comprobación de Baneos y Modo Admin
            const userDB = global.db.data.users[m.sender];
            const chatDB = global.db.data.chats[m.chat];
            
            if (chatDB?.isBanned && !isROwner && !['grupo-unbanchat.js'].includes(name)) return;
            if (m.text && userDB?.banned && !isROwner && name !== 'owner-unbanuser.js') {
                m.reply(`《🐉》@${m.sender.split('@')[0]} estás baneado/a, no puedes usar comandos en este bot!\n\n${userDB.bannedReason ? `☁️ Motivo: ${userDB.bannedReason}` : '🔮 *Motivo:* Sin Especificar'}`, null, { mentions: [m.sender] });
                return;
            }

            let adminMode = global.db.data.chats[m.chat].modoadmin
            let mini = (plugin.botAdmin || plugin.admin || plugin.group || plugin.command || noPrefix || usedPrefix ||  m.text.slice(0, 1) == usedPrefix) 
            if (adminMode && !isOwner && !isROwner && m.isGroup && !isAdmin && mini) continue

            // -> Comprobación de Requisitos (Roles y Economía)
            if (!checkPluginRequirements(this, m, plugin, { isROwner, isOwner, isMods, isPrems, isAdmin, isBotAdmin, _user, usedPrefix })) continue;

            // -> Ejecución Final del Plugin
            m.isCommand = true
            let xp = 'exp' in plugin ? parseInt(plugin.exp) : 10
            m.exp += xp

            let extra = { match, usedPrefix, noPrefix, args, command, text, conn: this, participants, groupMetadata, user, bot, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename };
            try {
                // El plugin real es la función exportada por defecto, la llamamos aquí.
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
    } finally {
        // Ejecutar guardado de DB al final
        global.db.write()
    }
}


// ===================================================
// 8. LÓGICA DE MONITOREO DE PLUGINS (Hot Reload)
// ===================================================

const file = join(path.dirname(fileURLToPath(import.meta.url)), 'handler.js')
watchFile(file, () => {
    unwatchFile(file)
    console.log(chalk.redBright('«Update»'), chalk.greenBright(file))
    // Recargar el handler
    import(`${file}?update=${Date.now()}`)
})
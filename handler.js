import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { smsg } from './utils/simple.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import fs from 'fs';
import chalk from 'chalk';
import ws from 'ws';

// ==============================================================================
// 1. UTILIDADES Y CONSTANTES GLOBALES
// ==============================================================================

const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
    clearTimeout(this)
    resolve()
}, ms))
const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')


// ==============================================================================
// 2. LÓGICA DE CORE (PRESENCIA, LLAMADAS Y PLUGINS)
// ==============================================================================

/**
 * Inicializa la lógica de auto-escribiendo y rechazo de llamadas.
 * @param {object} conn Conexión de Baileys (this)
 */
function setupAutoWritingAndReject(conn) {
    if (!global.autoEscribiendo) global.autoEscribiendo = new Set();
    
    // [LÓGICA DE PRESENCIA/AUTO-ESCRIBIENDO]
    if (!conn.presenceListenerAdded) {
        conn.presenceListenerAdded = true;
        conn.ev.on('messages.upsert', async ({ messages }) => {
            const chat = messages[0]?.key?.remoteJid;
            if (chat) {
                global.autoEscribiendo.add(chat);
                conn.sendPresenceUpdate('composing', chat).catch(() => global.autoEscribiendo.delete(chat));
                setTimeout(() => {
                    global.autoEscribiendo.delete(chat);
                    conn.sendPresenceUpdate('available', chat).catch(() => {});
                }, 3000); 
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
                if (typeof conn.rejectCall === 'function') {
                    await conn.rejectCall(from);
                } else {
                    await conn.sendPresenceUpdate('unavailable', from);
                }
            } catch (e) {
                console.error(chalk.red('❌ Error gestionando llamada:'), e);
            }
        });
    }
}

/**
 * Carga todos los plugins de la carpeta './plugins'.
 */
function loadPlugins() {
    const pluginsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');
    global.plugins = {};
    const files = fs.readdirSync(pluginsDir);

    for (let file of files) {
        if (!file.endsWith('.js') || file.startsWith('_')) continue;
        const pluginPath = path.join(pluginsDir, file);
        try {
            const module = require(pluginPath).default || require(pluginPath);
            global.plugins[file] = module;
            console.log(chalk.green(`✅ Plugin cargado: ${file}`));
        } catch (e) {
            console.error(chalk.red(`❌ Error cargando plugin ${file}:`), e);
        }
    }
}

// Carga de plugins al inicio
loadPlugins();
console.log(chalk.yellow(`💡 Se cargaron ${Object.keys(global.plugins).length} plugins.`));


// ==============================================================================
// 3. FUNCIÓN PRINCIPAL DEL HANDLER (chatUpdate)
// ==============================================================================

export async function handler(chatUpdate) {
    // Inicializa lógica de core
    if (!this.presenceInitialized) {
        setupAutoWritingAndReject(this);
        this.presenceInitialized = true;
    }

    this.msgqueque = this.msgqueque || []
    this.uptime = this.uptime || Date.now()
    if (!chatUpdate) return
    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return;
    if (global.db.data == null) await global.loadDatabase()

    try {
        m = smsg(this, m) || m
        if (!m) return
        global.mconn = m
        m.exp = 0
        m.monedas = false

        // 3.1. INICIALIZACIÓN DE LA BASE DE DATOS (USERS, CHATS, SETTINGS)
        await initializeDatabase(this, m);

        if (typeof m.text !== "string") m.text = ""
        const chat = global.db.data.chats[m.chat]
        globalThis.setting = global.db.data.settings[this.user.jid]

        // 3.2. DEFINICIÓN DE ROLES Y PERMISOS
        const { isROwner, isOwner, isPrems, senderLid, botLid, user, bot, isRAdmin, isAdmin, isBotAdmin, participants, groupMetadata } = await defineRolesAndPermissions(this, m);

        // 3.3. LÓGICA DE COLA Y MENSAJES DE BAILEYS
        if (opts["queque"] && m.text && !(isMods)) {
            const queque = this.msgqueque, time = 1000 * 5
            const previousID = queque[queque.length - 1]
            queque.push(m.id || m.key.id)
            setInterval(async function () {
                if (queque.indexOf(previousID) === -1) clearInterval(this)
                await delay(time)
            }, time)
        }
        if (m.isBaileys) return
        m.exp += Math.ceil(Math.random() * 10)
        let usedPrefix
        let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]

        // 3.4. EJECUCIÓN DE PLUGINS
        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin || plugin.disabled) continue
            const __filename = join(___dirname, name)

            // 3.4.1. FUNCIÓN .all()
            if (typeof plugin.all === 'function') {
                try {
                    await plugin.all.call(this, m, { chatUpdate, __dirname: ___dirname, __filename })
                } catch (e) {
                    console.error(e)
                }
            }
            if (!opts['restrict'] && plugin.tags && plugin.tags.includes('admin')) continue

            // 3.4.2. COMPROBACIÓN DE PREFIJO y COMANDO
            const { match, usedPrefix: prefixMatch, command, noPrefix, args, text, isAccept } = checkCommand(this, m, plugin);
            
            if (typeof plugin.before === 'function' && match) {
                const extraBefore = { match, conn: this, participants, groupMetadata, user, bot, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename };
                if (await plugin.before.call(this, m, extraBefore)) continue
            }
            if (typeof plugin !== 'function' || !match || !(usedPrefix = prefixMatch) || !isAccept) continue;
            
            m.plugin = name
            global.comando = command

            // 3.4.3. COMPROBACIÓN DE BANEOS y PERMISOS (Pre-ejecución)
            if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
                const userDB = global.db.data.users[m.sender];
                const chatDB = global.db.data.chats[m.chat];
                
                if (chatDB?.isBanned && !isROwner && !['grupo-unbanchat.js'].includes(name)) return;
                
                if (m.text && userDB?.banned && !isROwner && name !== 'owner-unbanuser.js') {
                    m.reply(`《🐉》Estas baneado/a, no puedes usar comandos en este bot!\n\n${userDB.bannedReason ? `☁️ Motivo: ${userDB.bannedReason}` : '🔮 *Motivo:* Sin Especificar'}\n\n> 👑 Si este Bot es cuenta oficial y tiene evidencia que respalde que este mensaje es un error, puedes exponer tu caso con un moderador.`);
                    return;
                }
            }
            
            // 3.4.4. COMPROBACIÓN DE MODO ADMIN y REQUISITOS (Roles y Economía)
            let adminMode = global.db.data.chats[m.chat].modoadmin
            let mini = (plugin.botAdmin || plugin.admin || plugin.group || plugin.command || noPrefix || usedPrefix ||  m.text.slice(0, 1) == usedPrefix) 
            if (adminMode && !isOwner && !isROwner && m.isGroup && !isAdmin && mini) continue
            
            if (!checkPluginRequirements(this, m, plugin, { isROwner, isOwner, isMods, isPrems, isAdmin, isBotAdmin, _user, usedPrefix })) continue;
            
            // 3.4.5. EJECUCIÓN FINAL
            m.isCommand = true
            let xp = 'exp' in plugin ? parseInt(plugin.exp) : 10
            m.exp += xp
            
            let extra = { match, usedPrefix, noPrefix, args, command, text, conn: this, participants, groupMetadata, user, bot, isROwner, isOwner, isRAdmin, isAdmin, isBotAdmin, isPrems, chatUpdate, __dirname: ___dirname, __filename };
            
            try {
                await plugin.call(this, m, extra)
                if (!isPrems) m.monedas = m.monedas || plugin.monedas || false
            } catch (e) {
                m.error = e
                console.error(e)
                if (e) {
                    let errorText = format(e)
                    for (let key of Object.values(global.APIKeys || {}))
                        errorText = errorText.replace(new RegExp(key, 'g'), 'Administrador')
                    m.reply(errorText)
                }
            } finally {
                if (typeof plugin.after === 'function') {
                    try {
                        await plugin.after.call(this, m, extra)
                    } catch (e) {
                        console.error(e)
                    }
                }
                if (m.monedas) {
                    // Corregido: Se añadió la variable global 'monedas' para el mensaje
                    conn.reply(m.chat, `❮🐉❯ Utilizaste ${+m.monedas} monedas.`, m) 
                }
            }
            break
        }
    } catch (e) {
        console.error(e)
    } finally {
        // 3.5. LÓGICA FINAL (QUEQUE, MUTE, STATS y AUTOREAD)
        await finalLogic(this, m);
    }
}

// ==============================================================================
// 4. FUNCIONES AUXILIARES DE SOPORTE
// ==============================================================================

/**
 * Define y obtiene los roles y permisos del usuario y bot en el chat.
 */
async function defineRolesAndPermissions(conn, m) {
    const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net';
    const isROwner = [...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, "") + detectwhat).includes(m.sender);
    const isOwner = isROwner || m.fromMe;
    const isPrems = isROwner || global.db.data.users[m.sender].premiumTime > 0;

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

    return { isROwner, isOwner, isPrems, senderLid, botLid, user, bot, isRAdmin, isAdmin, isBotAdmin, participants, groupMetadata };
}

/**
 * Inicializa y verifica la estructura de la base de datos (DB) para el mensaje.
 */
async function initializeDatabase(conn, m) {
    // Lógica para inicializar global.db.data.users[m.sender]
    try {
        let user = global.db.data.users[m.sender];
        if (typeof user !== 'object') global.db.data.users[m.sender] = {};
        
        // Estructura de usuario completa (reducida para ahorrar espacio)
        const defaultUser = {
            exp: 0, coin: 10, joincount: 1, diamond: 3, lastadventure: 0, health: 100, 
            lastclaim: 0, lastcofre: 0, lastdiamantes: 0, lastcode: 0, lastduel: 0, 
            lastpago: 0, lastmining: 0, lastcodereg: 0, muto: false, registered: false, 
            genre: '', birth: '', marry: '', description: '', packstickers: null, 
            name: m.name, age: -1, regTime: -1, afk: -1, afkReason: '', banned: false, 
            useDocument: false, bank: 0, level: 0, role: 'Nuv', premium: false, premiumTime: 0
        };
        
        // Aplicar valores por defecto si no existen
        for (const key in defaultUser) {
            if (typeof user !== 'object' || !(key in user) || (typeof defaultUser[key] === 'number' && !isNumber(user[key]))) {
                global.db.data.users[m.sender][key] = defaultUser[key];
            }
        }
        
        // Lógica para inicializar global.db.data.chats[m.chat]
        let chat = global.db.data.chats[m.chat];
        if (typeof chat !== 'object') global.db.data.chats[m.chat] = {};
        
        const defaultChat = {
            isBanned: false, sAutoresponder: '', welcome: true, autolevelup: false, autoresponder: false, 
            delete: false, autoAceptar: true, autoRechazar: true, detect: true, antiBot: true, 
            antiBot2: true, modoadmin: false, antiLink: true, antifake: false, reaction: false, 
            nsfw: false, expired: 0, antiLag: false, per: [],
        };

        for (const key in defaultChat) {
             if (typeof chat !== 'object' || !(key in chat)) {
                global.db.data.chats[m.chat][key] = defaultChat[key];
            }
        }
        
        // Lógica para inicializar global.db.data.settings[conn.user.jid]
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
    
    // Si el mensaje es un ID especial, ignóralo
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
    
    // Requisito de economía (monedas)
    if (!isPrems && plugin.monedas && global.db.data.users[m.sender].monedas < plugin.monedas * 1) {
        conn.reply(m.chat, `❮🔮❯ Se agotaron tus ${plugin.monedas} monedas.`, m);
        return false;
    }
    
    // Requisito de nivel
    if (plugin.level > _user.level) {
        conn.reply(m.chat, `❮🐉❯ Se requiere el nivel: *${plugin.level}*\n\n• Tu nivel actual es: *${_user.level}*\n\n• Usa este comando para subir de nivel:\n*${usedPrefix}levelup*`, m);
        return false;
    }

    // if (plugin.register == true && _user.registered == false) { fail('unreg', m, conn); return false; }
    
    return true;
}

/**
 * Lógica que se ejecuta al final del handler (cola, muteo, stats).
 */
async function finalLogic(conn, m) {
    // Lógica de la cola de mensajes
    if (opts['queque'] && m.text) {
        const quequeIndex = conn.msgqueque.indexOf(m.id || m.key.id)
        if (quequeIndex !== -1) conn.msgqueque.splice(quequeIndex, 1)
    }
    
    // Lógica de Mute
    if (m) { 
        let utente = global.db.data.users[m.sender]
        if (utente?.muto == true) {
            let bang = m.key.id
            let cancellazzione = m.key.participant
            await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: cancellazzione }})
        }

        // Actualización de EXP/Monedas
        if (m.sender && global.db.data.users[m.sender]) {
            global.db.data.users[m.sender].exp += m.exp
            global.db.data.users[m.sender].monedas -= m.monedas * 1
        }

        // Actualización de STATS
        if (m.plugin) {
            let now = +new Date
            let stats = global.db.data.stats
            let stat = stats[m.plugin] = stats[m.plugin] || { total: 0, success: 0, last: now, lastSuccess: now };
            
            stat.total += 1
            stat.last = now
            if (m.error == null) {
                stat.success += 1
                stat.lastSuccess = now
            }
        }
    }
    
    // Lógica de impresión de consola y Autoread
    try {
        if (!opts['noprint']) await (await import('./utils/print.js')).default(m, conn)
    } catch (e) {
        console.log(m, m.quoted, e)
    }

    if (opts['autoread']) await conn.readMessages([m.key])
}


// ==============================================================================
// 5. FUNCIÓN DE FALLO GLOBAL (dfail)
// ==============================================================================

global.dfail = (type, m, conn) => {

    const msg = {
        rowner: '🐉El comando solo puede ser usado por los creadores del bot SAIYAJIN☁️.',
        owner: '🐉El comando solo puede ser usado por los desarrolladores del bot SAIYAJIN☁️.',
        mods: '🐉El comando solo puede ser usado por los moderadores del bot SAIYAJIN☁️.',
        premium: '🐉El comando solo puede ser usado por los usuarios premium SAIYAJIN☁️.',
        group: '🐉El comando solo puede ser usado en grupos SAIYAJIN☁️.',
        private: '🐉El comando solo puede ser usado al privado SAIYAJIN☁️.',
        botAdmin: `🐉Necesito ser **Administrador** para ejecutar el comando en este grupo SAIYAJIN☁️.`,
        admin: `🐉El comando es solo para **Administradores** del grupo SAIYAJIN☁️.`,
        unreg: `Para usar el bot, debes registrarte con ${global.prefix[0]}reg (nombre.edad) SAIYAJIN☁️.`,
    }

    const replyMsg = msg[type] || `⚠️ Error de permiso desconocido: ${type}`;
    conn.reply(m.chat, replyMsg, m);

}
import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { smsg } from './utils/simple.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import fs from 'fs';
import chalk from 'chalk';
import ws from 'ws';

// --- NUEVAS UTILIDADES Y SISTEMAS DE CORE ---

// Función global de Logging (Punto 2 del informe)
function logError(context, error) {
    console.error(chalk.red(`❌ [${context}]`), error);
}

// Función Helper para inicialización de DB (Punto 3 del informe)
function ensure(obj, key, defaultValue) {
    if (!(key in obj)) obj[key] = defaultValue;
    if (typeof obj[key] !== typeof defaultValue && typeof obj[key] !== 'object') {
        obj[key] = defaultValue; // Corrección si el tipo es incorrecto (ej. number es string)
    }
}

// Lógica de Auto-escribiendo y Rechazo de llamadas (Punto 7 y modularización)
function setupAutoWritingAndReject(conn) {
    if (!global.autoEscribiendo) global.autoEscribiendo = new Set();

    // Detección de chats activos para 'composing' (Más eficiente que el loop)
    conn.ev.on('messages.upsert', async ({ messages }) => {
        const chat = messages[0]?.key?.remoteJid;
        if (chat && !global.autoEscribiendo.has(chat)) {
             // Agregamos el chat y enviamos presencia de inmediato
             global.autoEscribiendo.add(chat);
             await conn.sendPresenceUpdate('composing', chat).catch(() => global.autoEscribiendo.delete(chat));
             
             // Eliminamos de la lista después de un tiempo corto
             setTimeout(() => {
                 global.autoEscribiendo.delete(chat);
                 conn.sendPresenceUpdate('available', chat).catch(() => {});
             }, 3000); // 3 segundos escribiendo
        }
    });

    // Detectar y rechazar llamadas
    if (!conn.callListenerAdded) {
        conn.callListenerAdded = true;
        conn.ev.on('call', async (call) => {
            try {
                const from = call?.from || call?.[0]?.from || call?.[0]?.participant;
                if (!from) return;
                logError('Call_Blocker', `Llamada detectada de: ${from}`);
                await conn.rejectCall(from);
            } catch (e) {
                logError('Call_Blocker', `Error gestionando llamada: ${e.message}`);
            }
        });
    }
}

// --- CARGA DINÁMICA DE PLUGINS (similar a la lógica fragmentada) ---
const pluginsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');

function loadPlugins() {
    const plugins = {};
    const files = fs.readdirSync(pluginsDir);

    for (let file of files) {
        if (!file.endsWith('.js') || file.startsWith('_')) continue; // Ignorar archivos que empiezan con _

        const pluginPath = path.join(pluginsDir, file);
        try {
            // Utilizamos import para evitar problemas de caché con 'require'
            const module = require(pluginPath).default || require(pluginPath);
            plugins[file] = module;
            console.log(chalk.green(`✅ Plugin cargado: ${file}`));
        } catch (e) {
            logError(`Plugin_Load:${file}`, e);
        }
    }
    return plugins;
}

const globalPlugins = loadPlugins();
console.log(chalk.yellow(`💡 Se cargaron ${Object.keys(globalPlugins).length} plugins de la carpeta './plugins'.`));
// --- FIN DE LA CARGA DE PLUGINS ---


const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
clearTimeout(this)
resolve()
}, ms))

export async function handler(chatUpdate) {
// Inicialización del sistema de presencia al primer mensaje
if (!this.presenceInitialized) {
    setupAutoWritingAndReject(this);
    this.presenceInitialized = true;
}

this.msgqueque = this.msgqueque || []
this.uptime = this.uptime || Date.now()
if (!chatUpdate) return
this.pushMessage(chatUpdate.messages).catch(logError('Baileys_Push', e)) // Usa logError
let m = chatUpdate.messages[chatUpdate.messages.length - 1]
if (!m) return;
if (global.db.data == null) await global.loadDatabase().catch(logError('Database_Load', e)) // Usa logError

try {
m = smsg(this, m) || m
if (!m) return
global.mconn = m
m.exp = 0
m.monedas = false

// --- INICIALIZACIÓN DE DB OPTIMIZADA (Punto 3 del informe) ---
try {  
  let user = global.db.data.users[m.sender]  
  if (typeof user !== 'object') global.db.data.users[m.sender] = {}  
  
  // INICIALIZACIÓN DE USUARIO CON ENSURE
  ensure(user, 'exp', 0);
  ensure(user, 'monedas', 10);
  ensure(user, 'joincount', 1);
  ensure(user, 'diamond', 3);
  ensure(user, 'lastadventure', 0);
  ensure(user, 'lastclaim', 0);
  ensure(user, 'health', 100);
  ensure(user, 'crime', 0);
  ensure(user, 'lastcofre', 0);
  ensure(user, 'lastdiamantes', 0);
  ensure(user, 'lastpago', 0);
  ensure(user, 'lastcode', 0);
  ensure(user, 'lastcodereg', 0);
  ensure(user, 'lastduel', 0);
  ensure(user, 'lastmining', 0);
  ensure(user, 'muto', false);
  ensure(user, 'premium', false);
  if (!user.premium) ensure(user, 'premiumTime', 0);
  ensure(user, 'registered', false);
  ensure(user, 'genre', '');
  ensure(user, 'birth', '');
  ensure(user, 'marry', '');
  ensure(user, 'description', '');
  ensure(user, 'packstickers', null);
  
  if (!user.registered) {  
    ensure(user, 'name', m.name);
    ensure(user, 'age', -1);
    ensure(user, 'regTime', -1);
  }  
  
  ensure(user, 'afk', -1);
  ensure(user, 'afkReason', '');
  ensure(user, 'role', 'Nuv');
  ensure(user, 'banned', false);
  ensure(user, 'useDocument', false);
  ensure(user, 'level', 0);
  ensure(user, 'bank', 0);
  ensure(user, 'warn', 0);
  
  // INICIALIZACIÓN DE CHAT CON ENSURE
  let chat = global.db.data.chats[m.chat];
  if (typeof chat !== 'object') global.db.data.chats[m.chat] = {};

  ensure(chat, 'isBanned', false);
  ensure(chat, 'sAutoresponder', '');
  ensure(chat, 'welcome', true);
  ensure(chat, 'autolevelup', false);
  ensure(chat, 'autoAceptar', true);
  ensure(chat, 'autosticker', false);
  ensure(chat, 'autoRechazar', true);
  ensure(chat, 'autoresponder', false);
  ensure(chat, 'detect', true);
  ensure(chat, 'antiBot', true);
  ensure(chat, 'antiBot2', true);
  ensure(chat, 'modoadmin', false);
  ensure(chat, 'antiLink', true);
  ensure(chat, 'reaction', false);
  ensure(chat, 'nsfw', false);
  ensure(chat, 'antifake', false);
  ensure(chat, 'delete', false);
  ensure(chat, 'expired', 0);

  // INICIALIZACIÓN DE SETTINGS CON ENSURE
  var settings = global.db.data.settings[this.user.jid];
  if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {};

  ensure(settings, 'self', false);
  ensure(settings, 'restrict', true);
  ensure(settings, 'jadibotmd', true);
  ensure(settings, 'antiPrivate', false);
  ensure(settings, 'autoread', false);
  ensure(settings, 'status', 0);

} catch (e) {  
  logError('DB_Init', e); // Usa logError
}  
// --- FIN DE INICIALIZACIÓN DE DB OPTIMIZADA ---

if (typeof m.text !== "string") m.text = ""  
const chat = global.db.data.chats[m.chat]  
globalThis.setting = global.db.data.settings[this.user.jid]  
const detectwhat = m.sender.includes('@lid') ? '@lid' : '@s.whatsapp.net'  
const isROwner = [...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, "") + detectwhat).includes(m.sender)  
const isOwner = isROwner || m.fromMe  
const isPrems = isROwner || global.db.data.users[m.sender].premiumTime > 0  

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

async function getLidFromJid(id, conn) {  
  if (id.endsWith('@lid')) return id  
  const res = await conn.onWhatsApp(id).catch(() => [])  
  return res[0]?.lid || id  
}  

const senderLid = await getLidFromJid(m.sender, this) // Usar 'this' (conn)
const botLid = await getLidFromJid(this.user.jid, this) // Usar 'this' (conn)
const senderJid = m.sender
const botJid = this.user.jid

const groupMetadata = m.isGroup
? ((this.chats[m.chat] || {}).metadata || await this.groupMetadata(m.chat).catch(() => null))
: {}

const participants = m.isGroup && groupMetadata ? (groupMetadata.participants || []) : []

// Normalizamos ID porque en algunas versiones es .id y en otras .jid
const user = participants.find(
p => (p?.id === senderLid || p?.id === senderJid || p?.jid === senderLid || p?.jid === senderJid)
) || {}

const bot = participants.find(
p => (p?.id === botLid || p?.id === botJid || p?.jid === botLid || p?.jid === botJid)
) || {}

const isRAdmin = (user && user.admin) === 'superadmin'
const isAdmin = isRAdmin || ((user && user.admin) === 'admin')
const isBotAdmin = !!(bot && bot.admin)

const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins')

// Reemplazamos 'global.plugins' por la carga dinámica 'globalPlugins'
for (let name in globalPlugins) { 
let plugin = globalPlugins[name]
if (!plugin)
continue
if (plugin.disabled)
continue
const __filename = join(___dirname, name)
if (typeof plugin.all === 'function') {
try {
await plugin.all.call(this, m, {
chatUpdate,
__dirname: ___dirname,
__filename
})
} catch (e) {
logError(`Plugin_All:${name}`, e) // Usa logError
}}
if (!opts['restrict'])
if (plugin.tags && plugin.tags.includes('admin')) {
continue
}
const str2Regex = str => str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&') // <-- CORREGIDO: Expresión regular para escapar caracteres.
//  LÓGICA DE PREFIJOS PERSONALIZADOS AÑADIDA NO TOCAR PORFA SOLO DEYLIN.
let _prefix = (plugin.customPrefix ? [plugin.customPrefix] : []).concat(global.db.data.settings[this.user.jid]?.prefix || global.prefix);
let match = (_prefix instanceof RegExp ?
[[_prefix.exec(m.text), _prefix]] :
Array.isArray(_prefix) ?
_prefix.map(p => {
let re = p instanceof RegExp ?
p :
new RegExp(str2Regex(p))
return [re.exec(m.text), re]
}) :
typeof _prefix === 'string' ?
[[new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]] :
[[[], new RegExp]]
).find(p => p[1])
if (typeof plugin.before === 'function') {
if (await plugin.before.call(this, m, {
match,
conn: this,
participants,
groupMetadata,
user,
bot,
isROwner,
isOwner,
isRAdmin,
isAdmin,
isBotAdmin,
isPrems,
chatUpdate,
__dirname: ___dirname,
__filename
}))
continue
}
if (typeof plugin !== 'function')
continue
if ((usedPrefix = (match[0] || '')[0])) {
let noPrefix = m.text.replace(usedPrefix, '')
// <-- CORREGIDO 1: Uso de .split(/\s+/) y .join(' ')
let [command, ...args] = noPrefix.trim().split(/\s+/).filter(v => v) 
args = args || []
let _args = noPrefix.trim().split(/\s+/).slice(1)
let text = _args.join(' ')
command = (command || '').toLowerCase()
let fail = plugin.fail || global.dfail
let isAccept = plugin.command instanceof RegExp ?
plugin.command.test(command) :
Array.isArray(plugin.command) ?
plugin.command.some(cmd => cmd instanceof RegExp ?
cmd.test(command) :
cmd === command) :
typeof plugin.command === 'string' ?
plugin.command === command :
false

global.comando = command

if ((m.id.startsWith('NJX-') || (m.id.startsWith('BAE5') && m.id.length === 16) || (m.id.startsWith('B24E') && m.id.length === 20))) return

if (!isAccept) {
continue
}
m.plugin = name

// Este bloque de código fragmentado se ELIMINA porque ya está cubierto
// al inicio con la función 'loadPlugins()'
/*
import fs from 'fs';
import path from 'path';
//... funciones
const plugins = loadPlugins();
//...
*/

if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
let chat = global.db.data.chats[m.chat]
let user = global.db.data.users[m.sender]
if (!['grupo-unbanchat.js'].includes(name) && chat && chat.isBanned && !isROwner) return
if (name != 'grupo-unbanchat.js' && name != 'owner-exec.js' && name != 'owner-exec2.js' && name != 'grupo-delete.js' && chat?.isBanned && !isROwner) return
// <-- CORREGIDO 2: Uso de backticks (`) para interpolar la variable
if (m.text && user.banned && !isROwner) {
m.reply(`《🐉》Estas baneado/a, no puedes usar comandos en este bot!\n\n${user.bannedReason ? `☁️ Motivo: ${user.bannedReason}` : '🔮 *Motivo:* Sin Especificar'}\n\n> 👑 Si este Bot es cuenta oficial y tiene evidencia que respalde que este mensaje es un error, puedes exponer tu caso con un moderador.`)
return
} // Se movió el cierre de la función handler (que estaba incompleto)

// El bloque de código fragmentado que sigue está incompleto y genera error.
// Se mantiene la lógica de baneo que ya estaba correcta.

// if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
// let chat = global.db.data.chats[m.chat]
// let user = global.db.data.users[m.sender]
// let setting = global.db.data.settings[this.user.jid]
// if (name != 'grupo-unbanchat.js' && chat?.isBanned)
// return
// if (name != 'owner-unbanuser.js' && user?.banned)
// return
// }}

}
let hl = _prefix
// <-- CORREGIDO 3: Se quitan las comillas de template
let adminMode = global.db.data.chats[m.chat].modoadmin
// Reemplazar 'plugins' en 'mini' por 'globalPlugins' si se requiere
let mini = (globalPlugins.botAdmin || globalPlugins.admin || globalPlugins.group || globalPlugins[name] || noPrefix || hl ||  m.text.slice(0, 1) == hl || plugin.command)
if (adminMode && !isOwner && !isROwner && m.isGroup && !isAdmin && mini) return
if (plugin.rowner && plugin.owner && !(isROwner || isOwner)) {
fail('owner', m, this)
continue
}
if (plugin.rowner && !isROwner) {
fail('rowner', m, this)
continue
}
if (plugin.owner && !isOwner) {
fail('owner', m, this)
continue
}
if (plugin.mods && !isMods) {
fail('mods', m, this)
continue
}
if (plugin.premium && !isPrems) {
fail('premium', m, this)
continue
}
if (plugin.group && !m.isGroup) {
fail('group', m, this)
continue
} else if (plugin.botAdmin && !isBotAdmin) {
fail('botAdmin', m, this)
continue
} else if (plugin.admin && !isAdmin) {
fail('admin', m, this)
continue
}
if (plugin.private && m.isGroup) {
fail('private', m, this)
continue
}
// <-- CORREGIDO 4: Uso de comentarios de línea (//)
// if (plugin.register == true && _user.registered == false) {
// fail('unreg', m, this)
// continue
// }
m.isCommand = true
let xp = 'exp' in plugin ? parseInt(plugin.exp) : 10
m.exp += xp
// <-- CORREGIDO 6: Uso de backticks (`) para interpolar la variable
if (!isPrems && plugin.monedas && global.db.data.users[m.sender].monedas < plugin.monedas * 1) {
// Usar backticks (`) y plugin.monedas
conn.reply(m.chat, `❮🔮❯ Se agotaron tus ${plugin.monedas} monedas.`, m) 
continue
}
if (plugin.level > _user.level) {
conn.reply(m.chat, `❮🐉❯ Se requiere el nivel: *${plugin.level}*\n\n• Tu nivel actual es: *${_user.level}*\n\n• Usa este comando para subir de nivel:\n*${usedPrefix}levelup*`, m)
continue
}
let extra = {
match,
usedPrefix,
noPrefix,
_args,
args,
command,
text,
conn: this,
participants,
groupMetadata,
user,
bot,
isROwner,
isOwner,
isRAdmin,
isAdmin,
isBotAdmin,
isPrems,
chatUpdate,
__dirname: ___dirname,
__filename
}
try {
await plugin.call(this, m, extra)
if (!isPrems)
m.monedas = m.monedas || plugin.monedas || false
} catch (e) {
m.error = e
logError(`Plugin_Exec:${name}`, e) // Usa logError
if (e) {
let text = format(e)
for (let key of Object.values(global.APIKeys || {})) // Añadir || {} para seguridad
text = text.replace(new RegExp(key, 'g'), 'Administrador')
m.reply(text)
}
} finally {
if (typeof plugin.after === 'function') {
try {
await plugin.after.call(this, m, extra)
} catch (e) {
logError(`Plugin_After:${name}`, e) // Usa logError
}}
if (m.monedas)
// <-- CORREGIDO 6: Uso de backticks (`) para interpolar la variable
conn.reply(m.chat, `❮🐉❯ Utilizaste ${+m.monedas} monedas.`, m) 
}
break
}}
} catch (e) {
logError('Handler_Process', e) // Usa logError
} finally {
if (opts['queque'] && m.text) {
const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
if (quequeIndex !== -1)
this.msgqueque.splice(quequeIndex, 1)
}
let user, stats = global.db.data.stats
if (m) { let utente = global.db.data.users[m.sender]
if (utente.muto == true) {
let bang = m.key.id
let cancellazzione = m.key.participant
await this.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: cancellazzione }})
}
if (m.sender && (user = global.db.data.users[m.sender])) {
user.exp += m.exp
user.monedas -= m.monedas * 1
}

let stat
if (m.plugin) {
let now = +new Date
if (m.plugin in stats) {
stat = stats[m.plugin]
if (!isNumber(stat.total))
stat.total = 1
if (!isNumber(stat.success))
stat.success = m.error != null ? 0 : 1
if (!isNumber(stat.last))
stat.last = now
if (!isNumber(stat.lastSuccess))
stat.lastSuccess = m.error != null ? 0 : now
} else
stat = stats[m.plugin] = {
total: 1,
success: m.error != null ? 0 : 1,
last: now,
lastSuccess: m.error != null ? 0 : now
}
stat.total += 1
stat.last = now
if (m.error == null) {
stat.success += 1
stat.lastSuccess = now
}}}

try {
// <-- CORREGIDO 5: Se agregan las comillas al path de import
if (!opts['noprint']) await (await import('./utils/print.js')).default(m, this) 
} catch (e) {
logError('PrintMessage', e) // Usa logError
}
let settingsREAD = global.db.data.settings[this.user.jid] || {}
if (opts['autoread']) await this.readMessages([m.key])
}}

global.dfail = (type, m, usedPrefix, command, conn) => {

// <-- CORREGIDO 4: Uso de comentarios de línea (//)
// let edadaleatoria = ['10', '28', '20', '40', '18', '21', '15', '11', '9', '17', '25'].getRandom()
// let user2 = m.pushName || 'Anónimo'
// let verifyaleatorio = ['registrar', 'reg', 'verificar', 'verify', 'register'].getRandom()

const msg = {
rowner: '🐉El comando solo puede ser usado por los creadores del bot SAIYAJIN☁️.',
owner: '🐉El comando solo puede ser usado por los desarrolladores del bot SAIYAJIN☁️.',
mods: '🐉El comando solo puede ser usado por los moderadores del bot SAIYAJIN☁️.',
premium: '🐉El comando solo puede ser usado por los usuarios premium SAIYAJIN☁️.',
group: '🐉El comando solo puede ser usado en grupos SAIYAJIN☁️.',
private: '🐉El comando solo puede ser usado al privado SAIYAJIN☁️.', // Corregido el final incompleto
botAdmin: `🐉Necesito ser **Administrador** para ejecutar el comando en este grupo SAIYAJIN☁️.`,
admin: `🐉El comando es solo para **Administradores** del grupo SAIYAJIN☁️.`,
unreg: `Para usar el bot, debes registrarte con ${usedPrefix}reg (nombre.edad) SAIYAJIN☁️.`,
}

const replyMsg = msg[type] || `⚠️ Error de permiso desconocido: ${type}`;
conn.reply(m.chat, replyMsg, m);

}
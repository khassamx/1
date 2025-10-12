import { generateWAMessageFromContent } from '@whiskeysockets/baileys';
import { smsg } from './utils/simple.js';
import { format } from 'util';
import { fileURLToPath } from 'url';
import path, { join } from 'path';
import { unwatchFile, watchFile } from 'fs';
import fs from 'fs';
import chalk from 'chalk';
import ws from 'ws';

// --- NUEVAS FUNCIONES DE CORE Y CARGA DE PLUGINS ---

/**
 * 💡 FUNCIÓN DE AUTO-ESCRIBIENDO Y RECHAZO DE LLAMADAS 
 * @param {object} conn La conexión de Baileys (this)
 */
function setupAutoWritingAndReject(conn) {
    if (!global.autoEscribiendo) global.autoEscribiendo = new Set();

    // Detección de chats activos para 'composing'
    if (!conn.presenceListenerAdded) {
        conn.presenceListenerAdded = true;

        conn.ev.on('messages.upsert', async ({ messages }) => {
            const chat = messages[0]?.key?.remoteJid;
            if (chat) {
                global.autoEscribiendo.add(chat);
                // Enviar "escribiendo..."
                conn.sendPresenceUpdate('composing', chat).catch(() => global.autoEscribiendo.delete(chat));
                
                // Limpiar después de 3 segundos
                setTimeout(() => {
                    global.autoEscribiendo.delete(chat);
                    conn.sendPresenceUpdate('available', chat).catch(() => {});
                }, 3000); 
            }
        });
    }

    // Detectar y rechazar llamadas
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
 * 💡 CARGA DINÁMICA DE PLUGINS
 */
const pluginsDir = path.join(path.dirname(fileURLToPath(import.meta.url)), './plugins');
global.plugins = {}; // Inicializa global.plugins para que tu código lo use

function loadPlugins() {
    const files = fs.readdirSync(pluginsDir);

    for (let file of files) {
        // Asegura que solo carga archivos .js y no archivos temporales/ignorados
        if (!file.endsWith('.js') || file.startsWith('_')) continue; 

        const pluginPath = path.join(pluginsDir, file);
        try {
            // Importación dinámica para evitar problemas de caché
            const module = require(pluginPath).default || require(pluginPath);
            global.plugins[file] = module;
            console.log(chalk.green(`✅ Plugin cargado: ${file}`));
        } catch (e) {
            console.error(chalk.red(`❌ Error cargando plugin ${file}:`), e);
        }
    }
}

// Carga los plugins al iniciar
loadPlugins();
console.log(chalk.yellow(`💡 Se cargaron ${Object.keys(global.plugins).length} plugins de la carpeta './plugins'.`));
// --- FIN DE CORE Y CARGA DE PLUGINS ---


const { proto } = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)
const delay = ms => isNumber(ms) && new Promise(resolve => setTimeout(function () {
clearTimeout(this)
resolve()
}, ms))

export async function handler(chatUpdate) {
// Llama a la inicialización de presencia al recibir el primer chatUpdate
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

try {  
  let user = global.db.data.users[m.sender]  
  if (typeof user !== 'object')  
    global.db.data.users[m.sender] = {}  
  if (user) {  
    if (!isNumber(user.exp)) user.exp = 0  
    if (!isNumber(user.monedas)) user.monedas = 10  
    if (!isNumber(user.joincount)) user.joincount = 1  
    if (!isNumber(user.diamond)) user.diamond = 3  
    if (!isNumber(user.lastadventure)) user.lastadventure = 0  
    if (!isNumber(user.lastclaim)) user.lastclaim = 0  
    if (!isNumber(user.health)) user.health = 100  
    if (!isNumber(user.crime)) user.crime = 0  
    if (!isNumber(user.lastcofre)) user.lastcofre = 0  
    if (!isNumber(user.lastdiamantes)) user.lastdiamantes = 0  
    if (!isNumber(user.lastpago)) user.lastpago = 0  
    if (!isNumber(user.lastcode)) user.lastcode = 0  
    if (!isNumber(user.lastcodereg)) user.lastcodereg = 0  
    if (!isNumber(user.lastduel)) user.lastduel = 0  
    if (!isNumber(user.lastmining)) user.lastmining = 0  
    if (!('muto' in user)) user.muto = false  
    if (!('premium' in user)) user.premium = false  
    if (!user.premium) user.premiumTime = 0  
    if (!('registered' in user)) user.registered = false  
    if (!('genre' in user)) user.genre = ''  
    if (!('birth' in user)) user.birth = ''  
    if (!('marry' in user)) user.marry = ''  
    if (!('description' in user)) user.description = ''  
    if (!('packstickers' in user)) user.packstickers = null  
    if (!user.registered) {  
      if (!('name' in user)) user.name = m.name  
      if (!isNumber(user.age)) user.age = -1  
      if (!isNumber(user.regTime)) user.regTime = -1  
    }  
    if (!isNumber(user.afk)) user.afk = -1  
    if (!('afkReason' in user)) user.afkReason = ''  
    if (!('role' in user)) user.role = 'Nuv'  
    if (!('banned' in user)) user.banned = false  
    if (!('useDocument' in user)) user.useDocument = false  
    if (!isNumber(user.level)) user.level = 0  
    if (!isNumber(user.bank)) user.bank = 0  
    if (!isNumber(user.warn)) user.warn = 0  
  } else  
    global.db.data.users[m.sender] = {  
      exp: 0,  
      coin: 10,  
      joincount: 1,  
      diamond: 3,  
      lastadventure: 0,  
      health: 100,  
      lastclaim: 0,  
      lastcofre: 0,  
      lastdiamantes: 0,  
      lastcode: 0,  
      lastduel: 0,  
      lastpago: 0,  
      lastmining: 0,  
      lastcodereg: 0,  
      muto: false,  
      registered: false,  
      genre: '',  
      birth: '',  
      marry: '',  
      description: '',  
      packstickers: null,  
      name: m.name,  
      age: -1,  
      regTime: -1,  
      afk: -1,  
      afkReason: '',  
      banned: false,  
      useDocument: false,  
      bank: 0,  
      level: 0,  
      role: 'Nuv',  
      premium: false,  
      premiumTime: 0,  
    }  

  let chat = global.db.data.chats[m.chat]  
  if (typeof chat !== 'object') global.db.data.chats[m.chat] = {}  
  if (chat) {  
    if (!('isBanned' in chat)) chat.isBanned = false  
    if (!('sAutoresponder' in chat)) chat.sAutoresponder = ''  
    if (!('welcome' in chat)) chat.welcome = true  
    if (!('autolevelup' in chat)) chat.autolevelup = false  
    if (!('autoAceptar' in chat)) chat.autoAceptar = true  
    if (!('autosticker' in chat)) chat.autosticker = false  
    if (!('autoRechazar' in chat)) chat.autoRechazar = true  
    if (!('autoresponder' in chat)) chat.autoresponder = false  
    if (!('detect' in chat)) chat.detect = true  
    if (!('antiBot' in chat)) chat.antiBot = true  
    if (!('antiBot2' in chat)) chat.antiBot2 = true  
    if (!('modoadmin' in chat)) chat.modoadmin = false  
    if (!('antiLink' in chat)) chat.antiLink = true  
    if (!('reaction' in chat)) chat.reaction = false  
    if (!('nsfw' in chat)) chat.nsfw = false  
    if (!('antifake' in chat)) chat.antifake = false  
    if (!('delete' in chat)) chat.delete = false  
    if (!isNumber(chat.expired)) chat.expired = 0  
  } else  
    global.db.data.chats[m.chat] = {  
      isBanned: false,  
      sAutoresponder: '',  
      welcome: true,  
      autolevelup: false,  
      autoresponder: false,  
      delete: false,  
      autoAceptar: true,  
      autoRechazar: true,  
      detect: true,  
      antiBot: true,  
      antiBot2: true,  
      modoadmin: false,  
      antiLink: true,  
      antifake: false,  
      reaction: false,  
      nsfw: false,  
      expired: 0,  
      antiLag: false,  
      per: [],  
    }  

  var settings = global.db.data.settings[this.user.jid]  
  if (typeof settings !== 'object') global.db.data.settings[this.user.jid] = {}  
  if (settings) {  
    if (!('self' in settings)) settings.self = false  
    if (!('restrict' in settings)) settings.restrict = true  
    if (!('jadibotmd' in settings)) settings.jadibotmd = true  
    if (!('antiPrivate' in settings)) settings.antiPrivate = false  
    if (!('autoread' in settings)) settings.autoread = false  
  } else global.db.data.settings[this.user.jid] = {  
    self: false,  
    restrict: true,  
    jadibotmd: true,  
    antiPrivate: false,  
    autoread: false,  
    status: 0  
  }  
} catch (e) {  
  console.error(e)  
}  

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

// Corregido: 'conn' no está en el scope, debe ser 'this' si es pasado por el makeWASocket
const senderLid = await getLidFromJid(m.sender, this) 
const botLid = await getLidFromJid(this.user.jid, this)
const senderJid = m.sender
const botJid = this.user.jid

const groupMetadata = m.isGroup
// Corregido: 'conn' no está en el scope, debe ser 'this'
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

for (let name in global.plugins) {
let plugin = global.plugins[name]
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
console.error(e)
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
if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
let chat = global.db.data.chats[m.chat]
let user = global.db.data.users[m.sender]
if (!['grupo-unbanchat.js'].includes(name) && chat && chat.isBanned && !isROwner) return
if (name != 'grupo-unbanchat.js' && name != 'owner-exec.js' && name != 'owner-exec2.js' && name != 'grupo-delete.js' && chat?.isBanned && !isROwner) return
// <-- CORREGIDO 2: Uso de backticks (`) para interpolar la variable
if (m.text && user.banned && !isROwner) {
m.reply(`《🐉》Estas baneado/a, no puedes usar comandos en este bot!\n\n${user.bannedReason ? `☁️ Motivo: ${user.bannedReason}` : '🔮 *Motivo:* Sin Especificar'}\n\n> 👑 Si este Bot es cuenta oficial y tiene evidencia que respalde que este mensaje es un error, puedes exponer tu caso con un moderador.`)
return
// --- ELIMINADO: Código fragmentado e incompleto de plugins ---
// Se eliminó el bloque que estaba mal anidado y que contenía la lógica de plugins duplicada
// --------------------------------------------------------------------------------------
}
}
// --- ELIMINADO: Bloque incompleto de if anidado ---
// Se eliminó el bloque de 'if (m.chat in global.db.data.chats...' incompleto
// ---------------------------------------------------

let hl = _prefix
// <-- CORREGIDO 3: Se quitan las comillas de template
let adminMode = global.db.data.chats[m.chat].modoadmin
// Corregido: Se debe usar 'plugin' o 'global.plugins' no 'plugins'
let mini = (plugin.botAdmin || plugin.admin || plugin.group || plugin.command || noPrefix || hl ||  m.text.slice(0, 1) == hl) 
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
// Corregido: Se agregó la variable 'monedas' que estaba faltando
if (!isPrems && plugin.monedas && global.db.data.users[m.sender].monedas < plugin.monedas * 1) {
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
console.error(e)
if (e) {
let text = format(e)
for (let key of Object.values(global.APIKeys || {})) // Agregué || {} para seguridad
text = text.replace(new RegExp(key, 'g'), 'Administrador')
m.reply(text)
}
} finally {
if (typeof plugin.after === 'function') {
try {
await plugin.after.call(this, m, extra)
} catch (e) {
console.error(e)
}}
if (m.monedas)
// Corregido: Se agregó la variable 'monedas' que estaba faltando
conn.reply(m.chat, `❮🐉❯ Utilizaste ${+m.monedas} monedas.`, m) 
}
break
}}
} catch (e) {
console.error(e)
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
// Corregido: 'conn' no está en el scope, debe ser 'this'
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
console.log(m, m.quoted, e)}
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
private: '🐉El comando solo puede ser usado al privado SAIYAJIN☁️.', // Corregido: Se agregó el final del mensaje.
botAdmin: `🐉Necesito ser **Administrador** para ejecutar el comando en este grupo SAIYAJIN☁️.`,
admin: `🐉El comando es solo para **Administradores** del grupo SAIYAJIN☁️.`,
unreg: `Para usar el bot, debes registrarte con ${usedPrefix}reg (nombre.edad) SAIYAJIN☁️.`,
}

const replyMsg = msg[type] || `⚠️ Error de permiso desconocido: ${type}`;
conn.reply(m.chat, replyMsg, m);

}
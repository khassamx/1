// index.js (CORE FINAL)
// Centraliza la inicialización, conexión de Baileys, LowDB y carga de plugins.
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'

// --- 1. Importaciones del Sistema y de Baileys ---
import { fork } from 'cluster'
import { readdirSync, existsSync, mkdirSync, readFileSync, watch } from 'fs'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import yargs from 'yargs'
import { spawn } from 'child_process'
import lodash from 'lodash'
import syntaxerror from 'syntax-error'
import { format } from 'util'
import P from 'pino'
import pino from 'pino'
import Pino from 'pino'
import path, { join } from 'path'
import { Boom } from '@hapi/boom'
import NodeCache from 'node-cache'
import readline from 'readline'
import pkg from 'google-libphonenumber'
const { PhoneNumberUtil } = pkg

// Importaciones esenciales de Baileys
const { DisconnectReason, useMultiFileAuthState, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers, makeWASocket, makeInMemoryStore, fetchLatestBaileysVersion } = await import('@whiskeysockets/baileys')

// --- 2. Importaciones de Módulos Locales ---
// Importaciones críticas de tus carpetas reestructuradas
import { BOT_NAME, SESSIONS_FOLDER, JADIBOT_FOLDER, PREFIX, BOT_NUMBER, COLORS } from './config/config.js'; 
import { loadDatabase, db } from './utils/db.js'; // LowDB CORREGIDO

// ==========================================================
// 3. FUNCIONES CRÍTICAS GLOBALES
// ==========================================================

// Store (Caché de mensajes) - Esencial para Baileys
const store = makeInMemoryStore({})
const connectStore = (conn) => {
    store.bind(conn.ev)
}

// Funciones globales de ruta (Necesarias para Baileys y carga dinámica)
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
}; 
global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true))
}; 
global.__require = function require(dir = import.meta.url) {
    return createRequire(dir)
}

// ==========================================================
// 4. INICIALIZACIÓN DE LA APLICACIÓN
// ==========================================================

const __dirname = global.__dirname(import.meta.url)

// Asignaciones globales para el resto de los módulos
global.vegetasessions = SESSIONS_FOLDER
global.jadi = JADIBOT_FOLDER
global.db = db;
global.loadDatabase = loadDatabase;

global.timestamp = {start: new Date}
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = PREFIX

// Cargar la base de datos (LowDB v3+ con JSONFile importado correctamente)
loadDatabase()

console.log(COLORS.main(`
╔═══════════════════════════════════════╗
║   ⚡ ${BOT_NAME} ACTIVADO ⚡         ║
║  ʕ•ᴥ•ʔ ¡Prepárate para la batalla!    ║
╚═══════════════════════════════════════╝
`))

// --- Configuración de Baileys ---
const {state, saveState, saveCreds} = await useMultiFileAuthState(global.vegetasessions)
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const { version } = await fetchLatestBaileysVersion()
let phoneNumber = BOT_NUMBER

const methodCodeQR = process.argv.includes("qr")
const methodCode = !!phoneNumber || process.argv.includes("code")

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

let opcion
if (methodCodeQR) {
opcion = '1'
}
if (!methodCodeQR && !methodCode && !existsSync(`./${global.vegetasessions}/creds.json`)) {
do {
opcion = await question(COLORS.main("Seleccione una opción:\n") + COLORS.main("1. 👑Con código QR🐉\n") + COLORS.main("2. ☁️Con código de texto de 8 dígitos🐉\n--> "))
if (!/^[1-2]$/.test(opcion)) {
console.log(COLORS.error(`☁️No se permiten numeros que no sean 1 o 2, tampoco letras o símbolos especiales SAIYAJIN🔮🐉.`))
}} while (opcion !== '1' && opcion !== '2' || existsSync(`./${global.vegetasessions}/creds.json`))
} 

console.info = () => { }
console.debug = () => { }

const connectionOptions = {
    logger: pino({ level: 'silent' }),
    printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
    browser: opcion == '1' ? Browsers.macOS("Desktop") : methodCodeQR ? Browsers.macOS("Desktop") : Browsers.macOS("Chrome"), 
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, Pino({ level: "fatal" }).child({ level: "fatal" })),
    },
    markOnlineOnConnect: false, 
    generateHighQualityLinkPreview: true, 
    syncFullHistory: false,
    getMessage: async (key) => {
        try {
            let jid = jidNormalizedUser(key.remoteJid);
            let msg = await store.loadMessage(jid, key.id)
            return msg?.message || ""
        } catch (error) {
            return ""
        }},
    msgRetryCounterCache: msgRetryCounterCache || new Map(),
    userDevicesCache: userDevicesCache || new Map(),
    defaultQueryTimeoutMs: undefined,
    cachedGroupMetadata: (jid) => globalThis.conn.chats[jid] ?? {},
    version: version, 
    keepAliveIntervalMs: 55000, 
    maxIdleTimeMs: 60000, 
}

global.conn = makeWASocket(connectionOptions)
connectStore(global.conn) // CONEXIÓN DE CACHÉ DE MENSAJES
conn.isInit = false

// --- Lógica de Manejo de Conexión (Reducción por brevedad) ---
async function connectionUpdate(update) {
    const {connection, lastDisconnect, isNewLogin} = update
    global.stopped = connection
    if (isNewLogin) conn.isInit = true

    if (connection === "open") {
        const userName = conn.user.name || conn.user.verifiedName || "Desconocido"
        console.log(COLORS.qr(` 🐉Conectado a: ${userName}☁️`))
    }

    let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
    if (connection === 'close') {
        if (reason === DisconnectReason.loggedOut) {
            console.log(COLORS.error(`\n🐉Sin conexión, borra la session principal del Bot, y conectate nuevamente SAIYAJIN☁️.`))
        } else {
            console.log(COLORS.error(`\n 🐉Conexión cerrada inesperadamente (${reason || 'Desconocido'}). Reiniciando SAIYAJIN☁️.`))
            await global.reloadHandler(true).catch(console.error);
        }
    }
}
process.on('uncaughtException', console.error)

// ==========================================================
// 5. CARGA Y RECARGA DINÁMICA DE PLUGINS
// ==========================================================

let isInit = true
// Cargar el handler.js que creamos en el paso anterior (el cerebro)
let handler = await import('./handler.js') 

global.reloadHandler = async function(restatConn) {
    try {
        // Forzar la recarga del handler con un timestamp para evitar caché
        const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error); 
        if (Object.keys(Handler || {}).length) handler = Handler
    } catch (e) {
        console.error(e);
    }
    if (restatConn) {
        const oldChats = global.conn.chats
        try {
            global.conn.ws.close()
        } catch { }
        conn.ev.removeAllListeners()
        global.conn = makeWASocket(connectionOptions, {chats: oldChats})
        connectStore(global.conn) // VUELVE A CONECTAR EL STORE
        isInit = true
    }
    if (!isInit) {
        conn.ev.off('messages.upsert', conn.handler)
        conn.ev.off('connection.update', conn.connectionUpdate)
        conn.ev.off('creds.update', conn.credsUpdate)
    }
    
    conn.handler = handler.handler.bind(global.conn)
    conn.connectionUpdate = connectionUpdate.bind(global.conn)
    conn.credsUpdate = saveCreds.bind(global.conn, true)

    conn.ev.on('messages.upsert', conn.handler)
    conn.ev.on('connection.update', conn.connectionUpdate)
    conn.ev.on('creds.update', conn.credsUpdate)
    isInit = false
    return true
}

// --- Lógica de Carga de Plugins Dinámica ---
const pluginFolder = global.__dirname(join(__dirname, './plugins'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}

async function filesInit() {
    for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
        try {
            const file = global.__filename(join(pluginFolder, filename))
            const module = await import(file)
            global.plugins[filename] = module.default || module
        } catch (e) {
            console.error(COLORS.error(`Error al cargar plugin: ${filename}`), e)
            delete global.plugins[filename]
        }
    }
}

filesInit().then((_) => Object.keys(global.plugins)).catch(console.error)

// Lógica para detectar cambios en la carpeta plugins/ y recargar
global.reload = async (_ev, filename) => {
    if (pluginFilter(filename)) {
        const dir = global.__filename(join(pluginFolder, filename), true);
        if (filename in global.plugins) {
            if (existsSync(dir)) console.log(` updated plugin - '${filename}'`)
            else {
                console.warn(`deleted plugin - '${filename}'`)
                return delete global.plugins[filename]
            }
        } else console.log(`new plugin - '${filename}'`)

        const err = syntaxerror(readFileSync(dir), filename, {
            sourceType: 'module',
            allowAwaitOutsideFunction: true,
        });

        if (err) console.error(COLORS.error(`syntax error while loading '${filename}'\n${format(err)}`))
        else {
            try {
                // Forzar la recarga con un parámetro de query timestamp
                const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`)); 
                global.plugins[filename] = module.default || module;
            } catch (e) {
                console.error(COLORS.error(`error require plugin '${filename}\n${format(e)}'`))
            } finally {
                global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
            }
        }
    }
}

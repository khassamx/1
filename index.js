// index.js (VEGETA-BOT-MB - Versión Optimizada FINAL)
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1'
import './config/config.js'
import { setupMaster, fork } from 'cluster'
import { createRequire } from 'module'
import { fileURLToPath, pathToFileURL } from 'url'
import { platform } from 'process'
import * as ws from 'ws'
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, readFileSync, rmSync, watch } from 'fs'
import yargs from 'yargs'
import { spawn } from 'child_process'
import lodash from 'lodash'
import { vegetaJadiBot } from './plugins/jadibot-serbot.js'
import chalk from 'chalk'
import { tmpdir } from 'os'
import { format } from 'util'
import path, { join } from 'path'
import { protoType, serialize } from './utils/simple.js'
import { Low, JSONFile } from 'lowdb'
import store from './utils/store.js'
import readline from 'readline'
import { startConnection, connectionUpdate } from './utils/connection.js' // ⬅️ IMPORTACIÓN DESDE UTILS
import { isValidPhoneNumber, redefineConsoleMethod, reloadPlugins } from './utils/helper.js' // ⬅️ IMPORTACIÓN DESDE UTILS

const { chain } = lodash
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000

// ===========================================
// 1. DEFINICIONES GLOBALES MÍNIMAS
// ===========================================
global.fs = fs 
global.path = path 
global.store = store
global.timestamp = { start: new Date }
global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
}; 
global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true))
}; 
global.__require = function require(dir = import.meta.url) {
    return createRequire(dir)
}
const __dirname = global.__dirname(import.meta.url)
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse())
global.prefix = new RegExp('^[#!./]')

// Opciones de colores e Input
const colors = chalk.bold.blueBright 
const qrOption = chalk.blueBright 
const textOption = chalk.blueBright 
const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver))

// Parámetros para la función startConnection
const globalVariables = {
    global, rl, question, 
    methodCodeQR: process.argv.includes("qr"), 
    methodCode: !!global.botNumber || process.argv.includes("code"), 
    phoneNumber: global.botNumber, 
    vegetasessions: global.vegetasessions || 'vegetasessions'
}
const options = {
    MethodMobile: process.argv.includes("mobile"), colors, qrOption, textOption, isValidPhoneNumber
}

// Filtro de errores de Baileys (Usando la función externa)
const filterStrings = [
    "Q2xvc2luZyBzdGFsZSBvcGVu", "Q2xvc2luZyBvcGVuIHNlc3Npb24=", "RmFpbGVkIHRvIGRlY3J5cHQ=", 
    "U2Vzc2lvbiBlcnJvcg==", "RXJyb3I6IEJhZCBNQUM=", "RGVjcnlwdGVkIG1lc3NhZ2U="
]
console.info = () => { }
console.debug = () => { }
['log', 'warn', 'error'].forEach(methodName => redefineConsoleMethod(methodName, filterStrings))

// ===========================================
// 2. INICIALIZACIÓN DE BASE DE DATOS
// ===========================================
global.db = new Low(/https?:\/\//.test(opts['db'] || '') ? new cloudDBAdapter(opts['db']) : new JSONFile('database.json'))
global.DATABASE = global.db; 
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) {
        return new Promise((resolve) => setInterval(async function() {
        if (!global.db.READ) {
        clearInterval(this);
        resolve(global.db.data == null ? global.loadDatabase() : global.db.data)
        }}, 1 * 1000))
    }
    if (global.db.data !== null) return
    global.db.READ = true
    await global.db.read().catch(console.error)
    global.db.READ = null
    global.db.data = {
    users: {}, chats: {}, stats: {}, msgs: {}, sticker: {}, settings: {},
    ...(global.db.data || {}),
    }
    global.db.chain = chain(global.db.data)
}
loadDatabase()

// ===========================================
// 3. LÓGICA DEL HANDLER Y PLUGINS
// ===========================================
let isInit = true
let handler = await import('./handler.js')

global.reloadHandler = async function(restatConn) {
    try {
        const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
        if (Object.keys(Handler || {}).length) handler = Handler
    } catch (e) {
        console.error(e);
    }
    if (restatConn) {
        const oldChats = global.conn.chats
        try { global.conn.ws.close() } catch { }
        global.conn.ev.removeAllListeners()
        isInit = true
    }
    if (!isInit) {
        global.conn.ev.off('messages.upsert', global.conn.handler)
    }
    global.conn.handler = handler.handler.bind(global.conn)
    global.conn.ev.on('messages.upsert', global.conn.handler)
    isInit = false
    return true
}

const pluginFolder = global.__dirname(join(__dirname, './plugins/index'))
const pluginFilter = (filename) => /\.js$/.test(filename)
global.plugins = {}

async function filesInit() {
    for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
        try {
            const file = global.__filename(join(pluginFolder, filename))
            const module = await import(file)
            global.plugins[filename] = module.default || module
        } catch (e) {
            global.conn.logger.error(e)
            delete global.plugins[filename]
        }
    }
}

// Enlazamos la función de recarga de plugins desde helper.js
global.reload = reloadPlugins.bind(null, global.conn, global.handler, pluginFolder, pluginFilter)
watch(pluginFolder, global.reload)

// ===========================================
// 4. FUNCIÓN PRINCIPAL DE INICIO
// ===========================================
async function startVEGETABot() {
    protoType()
    serialize()
    
    // Mensaje de bienvenida
    console.log(chalk.bold.blueBright(`
╔═══════════════════════════════════════╗
║   ⚡ VEGETA-BOT-MB ACTIVADO ⚡         ║
║  ʕ•ᴥ•ʔ ¡Prepárate para la batalla!    ║
╚═══════════════════════════════════════╝
    `))
    console.log(chalk.bold.blueBright('╔═══════════════════════════════════════╗'))
    console.log(chalk.bold.blueBright('║       Desarrollado por BrayanOFC 👑   ║'))
    console.log(chalk.bold.blueBright('╚═══════════════════════════════════════╝\n'))

    // 🚨 Llamada a la función de conexión externa
    await startConnection(globalVariables, { reloadHandler, connectionUpdate }, options)

    await filesInit()
    await global.reloadHandler()
    
    // Intervalo de guardado de DB y limpieza de TMP
    if (!opts['test']) {
        if (global.db) setInterval(async () => {
        if (global.db.data) await global.db.write()
        if (opts['autocleartmp'] && (global.support || {}).find) (tmp = [tmpdir(), 'tmp', `${jadi}`], tmp.forEach((filename) => spawn('find', [filename, '-amin', '3', '-type', 'f', '-delete'], {stdio: 'inherit'})))
        }, 30 * 1000)
    }
    
    // Intervalo de reinicio (10800000 ms = 3 horas)
    setInterval(() => {
        console.log('[ 🐉 ]  Reiniciando...');
        process.exit(0)
    }, 10800000)

    // Lógica JadiBot
    let rtU = join(__dirname, `./${jadi}`)
    if (!existsSync(rtU)) { mkdirSync(rtU, { recursive: true }) }
    global.rutaJadiBot = join(__dirname, `./${jadi}`)
    // ... (El resto de la lógica de JadiBot, si existe)
}

// 🚨 Ejecución del Bot
startVEGETABot().catch(console.error)
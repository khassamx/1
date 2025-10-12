// adaptado y optimizado por Keko / basado en Khassam
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config/config.js';
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import { platform } from 'process';
import * as ws from 'ws';
import fs, { readdirSync, readFileSync, watch } from 'fs';
import yargs from 'yargs';
import { spawn } from 'child_process';
import lodash from 'lodash';
import chalk from 'chalk';
import syntaxerror from 'syntax-error';
import { tmpdir } from 'os';
import { format } from 'util';
import path, { join } from 'path';
import { Boom } from '@hapi/boom';
import { makeWASocket, protoType, serialize } from './utils/simple.js';
import { Low, JSONFile } from 'lowdb';
import store from './utils/store.js';
import pkg from 'google-libphonenumber';
const { PhoneNumberUtil } = pkg;
const phoneUtil = PhoneNumberUtil.getInstance();
import pino from 'pino';
import NodeCache from 'node-cache';
const { DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers } = await import('@whiskeysockets/baileys');

const { CONNECTING } = ws;
const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

// ===========================================
// FUNCIÓN PARA VALIDAR NÚMERO DE TELÉFONO
// ===========================================
async function isValidPhoneNumber(phoneNumber) {
    if (typeof phoneNumber !== 'string') return false;
    try {
        const parsedNumber = phoneUtil.parseAndKeepRawInput(phoneNumber);
        return phoneUtil.isValidNumber(parsedNumber);
    } catch (e) {
        return false;
    }
}

// ===========================================
// CONFIGURACIÓN DE RUTAS Y GLOBALES
// ===========================================

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};
global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true));
};
global.__require = function require(dir = import.meta.url) {
    return createRequire(dir);
};

const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[#!./]');

// ===========================================
// INICIALIZACIÓN DE BASE DE DATOS (LOWDB)
// ===========================================

global.db = new Low(new JSONFile('database.json'));
global.DATABASE = global.db; 
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) {
        return new Promise((resolve) => setInterval(async function() {
            if (!global.db.READ) {
                clearInterval(this);
                resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
            }
        }, 1000));
    }
    if (global.db.data !== null) return;
    global.db.READ = true;
    await global.db.read().catch(console.error);
    global.db.READ = null;
    global.db.data = {
        users: {},
        chats: {},
        stats: {},
        msgs: {},
        sticker: {},
        settings: {},
        ...(global.db.data || {}),
    };
    global.db.chain = chain(global.db.data);
};
loadDatabase();

// ===========================================
// CONFIGURACIÓN DE BAILYS
// ===========================================

const {state, saveState, saveCreds} = await useMultiFileAuthState(global.vegetasessions);
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
const { version } = await fetchLatestBaileysVersion();
let phoneNumber = global.botNumber;
const methodCodeQR = process.argv.includes("qr");
const methodCode = !!phoneNumber || process.argv.includes("code");
const MethodMobile = process.argv.includes("mobile");

// Configuración de Terminal
const colors = chalk.bold.blueBright;
const qrOption = chalk.blueBright;
const textOption = chalk.blueBright;
const readline = (await import('readline')).default;
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (texto) => new Promise((resolver) => rl.question(texto, resolver));

// Lógica de elección QR/Código
let opcion;
if (methodCodeQR) {
    opcion = '1';
}
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${global.vegetasessions}/creds.json`)) {
    opcion = '2'; // Forzamos a código de texto por defecto si no hay sesión
} 
if (!opcion) {
    do {
        opcion = await question(colors("Seleccione una opción:\n") + qrOption("1. 👑Con código QR🐉\n") + textOption("2. ☁️Con código de texto de 8 dígitos🐉\n--> "));
        if (!/^[1-2]$/.test(opcion)) {
            console.log(chalk.bold.redBright(`☁️No se permiten numeros que no sean 1 o 2, tampoco letras o símbolos especiales SAIYAJIN🔮🐉.`));
        }
    } while (opcion !== '1' && opcion !== '2');
}

// Opciones de Conexión
const connectionOptions = {
    logger: pino({ level: 'silent' }),
    printQRInTerminal: opcion == '1' || methodCodeQR,
    mobile: MethodMobile, 
    browser: opcion == '1' || methodCodeQR ? Browsers.macOS("Desktop") : Browsers.macOS("Chrome"), 
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
    },
    markOnlineOnConnect: false, 
    generateHighQualityLinkPreview: true, 
    syncFullHistory: false,
    getMessage: async (key) => {
        try {
            let jid = jidNormalizedUser(key.remoteJid);
            return await store.loadMessage(jid, key.id)?.message || "";
        } catch (error) {
            return "";
        }
    },
    msgRetryCounterCache: msgRetryCounterCache,
    userDevicesCache: userDevicesCache,
    defaultQueryTimeoutMs: undefined,
    cachedGroupMetadata: (jid) => globalThis.conn.chats[jid] ?? {},
    version: version, 
    keepAliveIntervalMs: 55000, 
    maxIdleTimeMs: 60000, 
};

global.conn = makeWASocket(connectionOptions);
protoType(); // Aseguramos que se ejecuten después de makeWASocket
serialize(); // Aseguramos que se ejecuten después de makeWASocket

// Lógica de Código de 8 Dígitos
if (!fs.existsSync(`./${global.vegetasessions}/creds.json`)) {
    if (opcion === '2' || methodCode) {
        if (!global.conn.authState.creds.registered) {
            let addNumber;
            if (!!phoneNumber) {
                addNumber = phoneNumber.replace(/[^0-9]/g, '');
            } else {
                let inputNumber;
                do {
                    inputNumber = await question(chalk.bold.blueBright(chalk.bold.blueBright(`[ ✿ ]  Por favor, Ingrese el número de WhatsApp.\n${chalk.bold.blueBright('---> ')}`)));
                    inputNumber = inputNumber.replace(/\D/g,'');
                    if (!inputNumber.startsWith('+')) {
                        inputNumber = `+${inputNumber}`;
                    }
                } while (!await isValidPhoneNumber(inputNumber));
                rl.close();
                addNumber = inputNumber.replace(/\D/g, '');
            }
            
            setTimeout(async () => {
                let codeBot = await global.conn.requestPairingCode(addNumber);
                codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
                console.log(chalk.bold.white(chalk.blueBright(`[🐉]  Código:`)), chalk.bold.blueBright(chalk.blueBright(codeBot)));
            }, 3000);
        }
    }
}

global.conn.isInit = false;
global.conn.well = false;
global.conn.logger.info(`[ ✿ ]  H E C H O\n`);

// Escritura de DB y Autocleartmp (Optimizado)
if (!global.opts['test']) {
    if (global.db) setInterval(async () => {
        if (global.db.data) await global.db.write();
        if (global.opts['autocleartmp']) {
            const tempDir = join(tmpdir(), 'tmp');
            try {
                spawn('find', [tempDir, '-amin', '3', '-type', 'f', '-delete'], { stdio: 'inherit' });
            } catch (e) {
                console.error('Error al limpiar tmp:', e);
            }
        }
    }, 30 * 1000);
}

// ===========================================
// GESTIÓN DE CONEXIÓN
// ===========================================

async function connectionUpdate(update) {
    const {connection, lastDisconnect, isNewLogin} = update;
    global.stopped = connection;
    if (isNewLogin) global.conn.isInit = true;
    
    // Reconexión por errores
    const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
    if (code && code !== DisconnectReason.loggedOut && global.conn?.ws.socket == null) {
        await global.reloadHandler(true).catch(console.error);
        global.timestamp.connect = new Date;
    }
    
    if (global.db.data == null) loadDatabase();
    
    if (update.qr != 0 && update.qr != undefined || methodCodeQR) {
        if (opcion == '1' || methodCodeQR) {
            console.log(chalk.green.bold(` 👑Escanea este código QR☁️`));
        }
    }
    
    if (connection === "open") {
        const userJid = jidNormalizedUser(global.conn.user.id);
        const userName = global.conn.user.name || global.conn.user.verifiedName || "Desconocido";
        console.log(chalk.green.bold(` 🐉Conectado a: ${userName}☁️`));
    }
    
    let reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
    if (connection === 'close') {
        const reconnectReasons = [
            DisconnectReason.connectionClosed, 
            DisconnectReason.connectionLost, 
            DisconnectReason.restartRequired, 
            DisconnectReason.timedOut
        ];

        if (reconnectReasons.includes(reason)) {
            console.log(chalk.bold.magentaBright(`\n👑 Desconexión temporal (${reason}), reconectando SAIYAJIN🐉...`));
            await global.reloadHandler(true).catch(console.error);
        } else if (reason === DisconnectReason.badSession || reason === DisconnectReason.loggedOut || reason === DisconnectReason.connectionReplaced) {
            console.log(chalk.bold.redBright(`\n🐉Sesión inválida o reemplazada, por favor borra la carpeta: ${global.vegetasessions} e inicia de nuevo.☁️.`));
        } else {
             console.log(chalk.bold.redBright(`\n 🐉Conexión cerrada, error desconocido: ${reason}☁️.`));
        }
    }
}

process.on('uncaughtException', console.error);

// ===========================================
// GESTIÓN DE HANDLER Y PLUGINS
// ===========================================

let isInit = true;
let handler = await import('./handler.js');

global.reloadHandler = async function(restatConn) {
    try {
        const Handler = await import(`./handler.js?update=${Date.now()}`).catch(console.error);
        if (Object.keys(Handler || {}).length) handler = Handler;
    } catch (e) {
        console.error(e);
    }
    
    if (restatConn) {
        const oldChats = global.conn.chats;
        try {
            global.conn.ws.close();
        } catch {}
        global.conn.ev.removeAllListeners();
        global.conn = makeWASocket(connectionOptions, {chats: oldChats});
        isInit = true;
    }
    
    if (!isInit) {
        global.conn.ev.off('messages.upsert', global.conn.handler);
        global.conn.ev.off('connection.update', global.conn.connectionUpdate);
        global.conn.ev.off('creds.update', global.conn.credsUpdate);
    }
    
    global.conn.handler = handler.handler.bind(global.conn);
    global.conn.connectionUpdate = connectionUpdate.bind(global.conn);
    global.conn.credsUpdate = saveCreds.bind(global.conn, true);
    
    global.conn.ev.on('messages.upsert', global.conn.handler);
    global.conn.ev.on('connection.update', global.conn.connectionUpdate);
    global.conn.ev.on('creds.update', global.conn.credsUpdate);
    isInit = false;
    return true;
};

// Reinicio programado
setInterval(() => {
    console.log('[ 🐉 ]  Reiniciando...');
    process.exit(0);
}, 10800000); // 3 horas

// Creación de carpetas Jadibot (si aplica)
global.rutaJadiBot = join(__dirname, `./${global.jadi}`);
if (global.Jadibts) {
    if (!fs.existsSync(global.rutaJadiBot)) {
        fs.mkdirSync(global.rutaJadiBot, { recursive: true }); 
        console.log(chalk.bold.cyan(`ꕥ ☁️La carpeta: ${global.jadi} se creó correctamente SAIYAJIN🐉.`));
    } else {
        console.log(chalk.bold.cyan(` 🐉La carpeta: ${global.jadi} ya está creada SAIYAJIN👑.`)); 
    }
    // Lógica para reanudar sesiones jadibot (omitida por ser compleja y no crítica para la conexión principal)
    // Se asume que el plugin jadibot-serbot se encarga de esto.
}

const pluginFolder = global.__dirname(join(__dirname, './plugins'));
const pluginFilter = (filename) => /\.js$/.test(filename);
global.plugins = {};

async function filesInit() {
    for (const filename of readdirSync(pluginFolder).filter(pluginFilter)) {
        try {
            const file = global.__filename(join(pluginFolder, filename));
            const module = await import(file);
            global.plugins[filename] = module.default || module;
        } catch (e) {
            global.conn.logger.error(`Error cargando plugin ${filename}:`, e);
            delete global.plugins[filename];
        }
    }
}
filesInit().then((_) => Object.keys(global.plugins)).catch(console.error);

global.reload = async (_ev, filename) => {
    if (pluginFilter(filename)) {
        const dir = global.__filename(join(pluginFolder, filename), true);
        if (filename in global.plugins) {
            if (fs.existsSync(dir)) global.conn.logger.info(` updated plugin - '${filename}'`);
            else {
                global.conn.logger.warn(`deleted plugin - '${filename}'`);
                return delete global.plugins[filename];
            }
        } else global.conn.logger.info(`new plugin - '${filename}'`);
        
        const err = syntaxerror(readFileSync(dir), filename, {
            sourceType: 'module',
            allowAwaitOutsideFunction: true,
        });
        
        if (err) global.conn.logger.error(`syntax error while loading '${filename}'\n${format(err)}`);
        else {
            try {
                const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
                global.plugins[filename] = module.default || module;
            } catch (e) {
                global.conn.logger.error(`error require plugin '${filename}\n${format(e)}'`);
            } finally {
                global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)));
            }
        }
    }
};
Object.freeze(global.reload);
watch(pluginFolder, global.reload);
await global.reloadHandler();
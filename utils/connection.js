// utils/connection.js

import { DisconnectReason, useMultiFileAuthState, makeCacheableSignalKeyStore, jidNormalizedUser, Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import pino from 'pino'
import Pino from 'pino'
import NodeCache from 'node-cache'
import chalk from 'chalk'
import { makeWASocket } from './simple.js' // ⬅️ RUTA AJUSTADA: Ahora busca 'simple.js' en la misma carpeta 'utils'

// Cache para Baileys
const msgRetryCounterCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })
const userDevicesCache = new NodeCache({ stdTTL: 0, checkperiod: 0 })

// 🚨 La función principal de conexión
export async function startConnection(globalVariables, handlers, options) {
    const { global, rl, question, methodCodeQR, methodCode, phoneNumber, vegetasessions } = globalVariables
    const { reloadHandler, connectionUpdate } = handlers
    const { MethodMobile, colors, qrOption, textOption, isValidPhoneNumber } = options
    
    // 🚨 Credenciales y Versión (Usando await dentro de la función async)
    const {state, saveState, saveCreds} = await useMultiFileAuthState(vegetasessions)
    const { version } = await fetchLatestBaileysVersion()
    
    let opcion = methodCodeQR ? '1' : null;
    
    if (!methodCodeQR && !methodCode && !global.fs.existsSync(`./${vegetasessions}/creds.json`)) {
        do {
            opcion = await question(colors("Seleccione una opción:\n") + qrOption("1. 👑Con código QR🐉\n") + textOption("2. ☁️Con código de texto de 8 dígitos🐉\n--> "))
            if (!/^[1-2]$/.test(opcion)) {
                console.log(chalk.bold.redBright(`☁️No se permiten numeros que no sean 1 o 2, tampoco letras o símbolos especiales SAIYAJIN🔮🐉.`))
            }
        } while (opcion !== '1' && opcion !== '2' || global.fs.existsSync(`./${vegetasessions}/creds.json`))
    } 

    const connectionOptions = {
        logger: pino({ level: 'silent' }),
        printQRInTerminal: opcion == '1' ? true : methodCodeQR ? true : false,
        mobile: MethodMobile, 
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
                let msg = await global.store.loadMessage(jid, key.id)
                return msg?.message || ""
            } catch (error) {
                return ""
            }
        },
        msgRetryCounterCache: msgRetryCounterCache || new Map(),
        userDevicesCache: userDevicesCache || new Map(),
        defaultQueryTimeoutMs: undefined,
        cachedGroupMetadata: (jid) => global.conn.chats[jid] ?? {},
        version: version, 
        keepAliveIntervalMs: 55000, 
        maxIdleTimeMs: 60000, 
    }

    global.conn = makeWASocket(connectionOptions)

    // 🚨 Lógica del código de 8 dígitos
    if (!global.fs.existsSync(`./${vegetasessions}/creds.json`)) {
        if (opcion === '2' || methodCode) {
            opcion = '2'
            if (!global.conn.authState.creds.registered) {
                let addNumber
                if (!!phoneNumber) {
                    addNumber = phoneNumber.replace(/[^0-9]/g, '')
                } else {
                    let pn;
                    do {
                        pn = await question(chalk.bold.blueBright(chalk.bold.blueBright(`[ ✿ ]  Por favor, Ingrese el número de WhatsApp.\n${chalk.bold.blueBright('---> ')}`)))
                        pn = pn.replace(/\D/g,'')
                        if (!pn.startsWith('+')) {
                            pn = `+${pn}`
                        }
                    } while (!await isValidPhoneNumber(pn))
                    rl.close()
                    addNumber = pn.replace(/\D/g, '')
                    setTimeout(async () => {
                        let codeBot = await global.conn.requestPairingCode(addNumber)
                        codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot
                        console.log(chalk.bold.white(chalk.blueBright(`[🐉]  Código:`)), chalk.bold.blueBright(chalk.blueBright(codeBot)))
                    }, 3000)
                }
            }
        }
    }
    
    global.conn.isInit = false
    global.conn.well = false
    global.conn.logger.info(`[ ✿ ]  H E C H O\n`)

    global.conn.credsUpdate = saveCreds.bind(global.conn, true)
    
    // 🚨 Conexión y Reconexión
    global.conn.connectionUpdate = connectionUpdate(reloadHandler).bind(global.conn)
    global.conn.ev.on('connection.update', global.conn.connectionUpdate)
    global.conn.ev.on('creds.update', global.conn.credsUpdate)
    
    return global.conn
}


// 🚨 Lógica de reconexión
export const connectionUpdate = (reloadHandler) => {
    return (update) => {
        const { connection, lastDisconnect, isNewLogin } = update
        global.stopped = connection
        if (isNewLogin) global.conn.isInit = true
        
        // ... (El resto de tu lógica de conexión/reconexión)
        const code = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
        if (code && code !== DisconnectReason.loggedOut && global.conn?.ws.socket == null) {
            reloadHandler(true).catch(console.error);
            global.timestamp.connect = new Date
        }
        
        let reason = new Boom(lastDisconnect?.error)?.output?.statusCode
        if (connection === 'close') {
            if (reason === DisconnectReason.badSession) {
                console.log(chalk.bold.cyanBright(`\n ☁️Sin conexión, borra la session principal del Bot, y conectate nuevamente SAIYAJIN🐉.`))
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.bold.redBright(`\n🐉Sin conexión, borra la session principal del Bot, y conectate nuevamente SAIYAJIN☁️.`))
                reloadHandler(true).catch(console.error)
            } else {
                console.log(chalk.bold.redBright(`\n 🐉Conexión cerrada, conectese nuevamente SAIYAJIN☁️. Razón: ${reason}`))
                reloadHandler(true).catch(console.error)
            }
        } else if (connection === "open") {
            const userJid = jidNormalizedUser(global.conn.user.id)
            const userName = global.conn.user.name || global.conn.user.verifiedName || "Desconocido"
            console.log(chalk.green.bold(` 🐉Conectado a: ${userName}☁️`))
        }
    }
}
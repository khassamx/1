
import { useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, Browsers } from "@whiskeysockets/baileys"
import qrcode from "qrcode"
import NodeCache from "node-cache"
import fs from "fs"
import path from "path"
import pino from 'pino'
import chalk from 'chalk'
import * as ws from 'ws'
import { fileURLToPath } from 'url'
import { makeWASocket } from '../utils/simple.js'

const { exec } = await import('child_process')
const { CONNECTING } = ws

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let crm1 = "Y2QgcGx1Z2lucy"
let crm2 = "A7IG1kNXN1b"
let crm3 = "SBpbmZvLWRvbmFyLmpz"
let crm4 = "IF9hdXRvcmVzcG9uZGVyLmpzIGluZm8tYm90Lmpz"

let drm1 = ""
let drm2 = ""

let rtx = `╭───────────────✎  
│  ツ 𝚅𝙴𝙶𝙴𝚃𝙰 𝙱𝙾𝚃 𝙼𝙱 ➳  
╰───────────────✎  
> ★ 𝗖𝗼𝗻𝗲𝘅𝗶ó𝗻 𝗦𝘂𝗯-𝗕𝗼𝘁 (𝗠𝗼𝗱𝗼 𝗤𝗥) ✈  

⟿ 𝐄𝐬𝐜𝐚𝐧𝐞𝐚 𝐞𝐬𝐭𝐞 𝐂𝐨́𝐝𝐢𝐠𝐨 𝐐𝐑 𝐜𝐨𝐧 𝐨𝐭𝐫𝐨 𝐜𝐞𝐥𝐮𝐥𝐚𝐫  
𝐨 𝐝𝐞𝐬𝐝𝐞 𝐥𝐚 𝐏𝐂 𝐩𝐚𝐫𝐚 𝐜𝐨𝐧𝐯𝐞𝐫𝐭𝐢𝐫𝐭𝐞 𝐞𝐧 𝐮𝐧 *𝗦𝘂𝗯-𝗕𝗼𝘁 𝗧𝗲𝗺𝗽𝗼𝗿𝗮𝗹*.  

➥ ❶ 𓂃 Toca los tres puntos en la esquina superior derecha.  
➥ ❷ 𓂃 Ve a *"Dispositivos vinculados"*.  
➥ ❸ 𓂃 Escanea este QR y conéctate al bot.  

⚠ 𝐄𝐬𝐭𝐞 𝐜𝐨́𝐝𝐢𝐠𝐨 𝐐𝐑 𝐞𝐱𝐩𝐢𝐫𝐚 𝐞𝐧 ❺❹ 𝐬𝐞𝐠𝐮𝐧𝐝𝐨𝐬. 𝐍𝐨 𝐩𝐢𝐞𝐫𝐝𝐚𝐬 𝐭𝐢𝐞𝐦𝐩𝐨.  
`;

let rtx2 = `╭───────────────⍰  
│  ✭ 𝚅𝙴𝙶𝙴𝚃𝙰 𝙱𝙾𝚃 𝙼𝙱 ✰  
╰───────────────⍰ 
> ✰ 𝗖𝗼𝗻𝗲𝘅𝗶ó𝗻 𝗦𝘂𝗯-𝗕𝗼𝘁 (𝗠𝗼𝗱𝗼 𝗖𝗼́𝗱𝗶𝗴𝗼) 

⟿ 𝐔𝐬𝐚 𝐞𝐬𝐭𝐞 𝐜𝐨́𝐝𝐢𝐠𝐨 𝐩𝐚𝐫𝐚 𝐜𝐨𝐧𝐯𝐞𝐫𝐭𝐢𝐫𝐭𝐞 𝐞𝐧 𝐮𝐧 *𝗦𝘂𝗯-𝗕𝗼𝘁 𝗧𝗲𝗺𝗽𝗼𝗿𝗮𝗹*.  

➥ ❶ 𓂃 Toca los tres puntos en la esquina superior derecha.  
➥ ❷ 𓂃 Ve a *"Dispositivos vinculados"*.  
➥ ❸ 𓂃 Selecciona *Vincular con el número de teléfono*.  
➥ ❹ 𓂃 Ingresa el código y conéctate al bot.  

⚠ 𝐒𝐢 𝐲𝐚 𝐞𝐬𝐭á𝐬 𝐜𝐨𝐧𝐞𝐜𝐭𝐚𝐝𝐨 𝐚 𝐨𝐭𝐫𝐚 𝐬𝐞𝐬𝐢ó𝐧, 𝐬𝐞 𝐫𝐞𝐜𝐨𝐦𝐢𝐞𝐧𝐝𝐚  
𝐪𝐮𝐞 𝐭𝐞 𝐝𝐞𝐬𝐜𝐨𝐧𝐞𝐜𝐭𝐞𝐬. 𝐄𝐬𝐭𝐚𝐫 𝐞𝐧 𝐝𝐨𝐬 𝐩𝐮𝐞𝐝𝐞 𝐜𝐚𝐮𝐬𝐚𝐫 𝐞𝐫𝐫𝐨𝐫𝐞𝐬  
𝐲 𝐮𝐧 𝐩𝐨𝐬𝐢𝐛𝐥𝐞 𝐛𝐚𝐧𝐞𝐨 𝐝𝐞 𝗪𝗵𝗮𝘁𝘀𝗔𝗽𝗽.  
`;

let imagenUrl = 'https://qu.ax/RRMde.jpg';

const maxSubBots = 324

let vegetaJBOptions = {}

if (!global.conns) global.conns = []

function msToTime(duration) {
  var seconds = Math.floor((duration / 1000) % 60),
      minutes = Math.floor((duration / (1000 * 60)) % 60)
  minutes = (minutes < 10) ? '0' + minutes : minutes
  seconds = (seconds < 10) ? '0' + seconds : seconds
  return minutes + ' m y ' + seconds + ' s '
}

let handler = async (m, { conn, args, usedPrefix, command }) => {
  if (!globalThis.db.data.settings[conn.user.jid].jadibotmd) {
    return m.reply(`El Comando *${command}* está desactivado temporalmente.`)
  }

  let time = global.db.data.users[m.sender].Subs + 120000
  if (new Date() - global.db.data.users[m.sender].Subs < 120000) {
    return conn.reply(m.chat, `⏳ Debes esperar ${msToTime(time - new Date())} para volver a vincular un *Sub-Bot.*`, m)
  }

  const subBots = [...new Set(
    global.conns.filter(c =>
      c.user && c.ws.socket && c.ws.socket.readyState !== ws.CLOSED
    ).map(c => c)
  )]

  const subBotsCount = subBots.length

  if (subBotsCount >= maxSubBots) {
    return m.reply(`❌ No se han encontrado espacios para *Sub-Bots* disponibles.`)
  }

  const availableSlots = maxSubBots - subBotsCount

  let who = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender
  let id = `${who.split('@')[0]}`
  let pathvegetaJadiBot = path.join(`./vegetaJadiBot/`, id)

  if (!fs.existsSync(pathvegetaJadiBot)) {
    fs.mkdirSync(pathvegetaJadiBot, { recursive: true })
  }

  vegetaJBOptions.pathvegetaJadiBot = pathvegetaJadiBot
  vegetaJBOptions.m = m
  vegetaJBOptions.conn = conn
  vegetaJBOptions.args = args
  vegetaJBOptions.usedPrefix = usedPrefix
  vegetaJBOptions.command = command
  vegetaJBOptions.fromCommand = true

  await vegetaJadiBot(vegetaJBOptions)

  global.db.data.users[m.sender].Subs = new Date() * 1
}

handler.help = ['qr', 'code']
handler.tags = ['serbot']
handler.command = ['qr', 'code']

export default handler

export async function vegetaJadiBot(options) {
  let { pathvegetaJadiBot, m, conn, args, usedPrefix, command } = options
  if (command === 'code') {
    command = 'qr'
    args.unshift('code')
  }
  const mcode = args[0] && /(--code|code)/.test(args[0].trim())
    ? true
    : args[1] && /(--code|code)/.test(args[1].trim())
      ? true
      : false
  let txtCode, codeBot, txtQR
  if (mcode) {
    args[0] = args[0].replace(/^--code$|^code$/, "").trim()
    if (args[1]) args[1] = args[1].replace(/^--code$|^code$/, "").trim()
    if (args[0] == "") args[0] = undefined
  }
  const pathCreds = path.join(pathvegetaJadiBot, "creds.json")
  if (!fs.existsSync(pathvegetaJadiBot)) {
    fs.mkdirSync(pathvegetaJadiBot, { recursive: true })
  }
  try {
    if (args[0] && args[0] != undefined) {
      fs.writeFileSync(pathCreds, JSON.stringify(JSON.parse(Buffer.from(args[0], "base64").toString("utf-8")), null, '\t'))
    }
  } catch {
    conn.reply(m.chat, `⚠️ Use correctamente el comando » ${usedPrefix + command}`, m)
    return
  }

  const comb = Buffer.from(crm1 + crm2 + crm3 + crm4, "base64")
  exec(comb.toString("utf-8"), async (err, stdout, stderr) => {
    const { version } = await fetchLatestBaileysVersion()
    const msgRetry = () => { }
    const msgRetryCache = new NodeCache()
    const { state, saveState, saveCreds } = await useMultiFileAuthState(pathvegetaJadiBot)

    const connectionOptions = {
      logger: pino({ level: "fatal" }),
      printQRInTerminal: false,
      auth: { creds: state.creds, keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })) },
      msgRetry,
      msgRetryCache,
      browser: mcode ? Browsers.macOS("Chrome") : Browsers.macOS("Desktop"),
      version: version,
      generateHighQualityLinkPreview: true
    }

    let sock = makeWASocket(connectionOptions)
    sock.isInit = false
    let isInit = true

    async function connectionUpdate(update) {
      const { connection, lastDisconnect, isNewLogin, qr } = update
      if (isNewLogin) sock.isInit = false
      if (qr && !mcode) {
        if (m?.chat) {
          txtQR = await conn.sendMessage(m.chat, { image: await qrcode.toBuffer(qr, { scale: 8 }), caption: rtx.trim() }, { quoted: m })
        } else {
          return
        }
        if (txtQR && txtQR.key) {
          setTimeout(() => { conn.sendMessage(m.sender, { delete: txtQR.key }) }, 30000)
        }
        return
      }
      if (qr && mcode) {
        let secret = await sock.requestPairingCode((m.sender.split('@')[0]))
        secret = secret.match(/.{1,4}/g)?.join("-")
        txtCode = await conn.sendMessage(m.chat, { text: rtx2 }, { quoted: m })
        codeBot = await m.reply(secret)
        console.log(secret)
      }
      if (txtCode && txtCode.key) {
        setTimeout(() => { conn.sendMessage(m.sender, { delete: txtCode.key }) }, 30000)
      }
      if (codeBot && codeBot.key) {
        setTimeout(() => { conn.sendMessage(m.sender, { delete: codeBot.key }) }, 30000)
      }
      const endSesion = async (loaded) => {
        if (!loaded) {
          try {
            sock.ws.close()
          } catch { }
          sock.ev.removeAllListeners()
          let i = global.conns.indexOf(sock)
          if (i < 0) return
          delete global.conns[i]
          global.conns.splice(i, 1)
        }
      }

      const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode
      if (connection === 'close') {
        if (reason === 428 || reason === 408) {
          console.log(chalk.bold.magentaBright(`\n╭─────────────────────────\n│ La conexión (+${path.basename(pathvegetaJadiBot)}) fue cerrada inesperadamente o expiró. Intentando reconectar...\n╰─────────────────────────`))
          await creloadHandler(true).catch(console.error)
        }
        if (reason === 440) {
          console.log(chalk.bold.magentaBright(`\n╭─────────────────────────\n│ La conexión (+${path.basename(pathvegetaJadiBot)}) fue reemplazada por otra sesión activa.\n╰─────────────────────────`))
          try {
            if (options.fromCommand) m?.chat ? await conn.sendMessage(`${path.basename(pathvegetaJadiBot)}@s.whatsapp.net`, { text: 'HEMOS DETECTADO UNA NUEVA SESIÓN, BORRE LA NUEVA SESIÓN PARA CONTINUAR\n\n> SI HAY ALGÚN PROBLEMA VUELVA A CONECTARSE' }, { quoted: m || null }) : ""
          } catch (error) {
            console.error(chalk.bold.yellow(`Error 440 no se pudo enviar mensaje a: +${path.basename(pathvegetaJadiBot)}`))
          }
        }
        if (reason == 405 || reason == 401) {
          console.log(chalk.bold.magentaBright(`\n╭─────────────────────────\n│ La sesión (+${path.basename(pathvegetaJadiBot)}) fue cerrada. Credenciales no válidas o dispositivo desconectado manualmente.\n╰─────────────────────────`))
          try {
            if (options.fromCommand) m?.chat ? await conn.sendMessage(`${path.basename(pathvegetaJadiBot)}@s.whatsapp.net`, { text: 'SESIÓN PENDIENTE\n\n> INTENTÉ NUEVAMENTE VOLVER A SER SUB-BOT' }, { quoted: m || null }) : ""
          } catch (error) {
            console.error(chalk.bold.yellow(`Error 405 no se pudo enviar mensaje a: +${path.basename(pathvegetaJadiBot)}`))
          }
          fs.rmdirSync(pathvegetaJadiBot, { recursive: true })
        }
        if (reason === 500) {
          console.log(chalk.bold.magentaBright(`\n╭─────────────────────────\n│ Conexión perdida en la sesión (+${path.basename(pathvegetaJadiBot)}). Borrando datos...\n╰─────────────────────────`))
          if (options.fromCommand) m?.chat ? await conn.sendMessage(`${path.basename(pathvegetaJadiBot)}@s.whatsapp.net`, { text: 'CONEXIÓN PÉRDIDA\n\n> INTENTÉ MANUALMENTE VOLVER A SER SUB-BOT' }, { quoted: m || null }) : ""
          return creloadHandler(true).catch(console.error)
        }
        if (reason === 515) {
          console.log(chalk.bold.magentaBright(`\n╭─────────────────────────\n│ Reinicio automático para la sesión (+${path.basename(pathvegetaJadiBot)}).\n╰─────────────────────────`))
          await creloadHandler(true).catch(console.error)
        }
        if (reason === 403) {
          console.log(chalk.bold.magentaBright(`\n╭─────────────────────────\n│ Sesión cerrada o cuenta en soporte para la sesión (+${path.basename(pathvegetaJadiBot)}).\n╰─────────────────────────`))
          fs.rmdirSync(pathvegetaJadiBot, { recursive: true })
        }
      }
      if (connection == 'open') {
        if (!global.db.data) loadDatabase()
        if (!global.db.data?.users) loadDatabase()
        let userName = sock.authState.creds.me.name || 'Anónimo'
        let userJid = sock.authState.creds.me.jid || `${path.basename(pathvegetaJadiBot)}@s.whatsapp.net`
        console.log(chalk.bold.cyanBright(`\n❒────────────【• SUB-BOT •】────────────❒\n│\n│ 🟢 ${userName} (+${path.basename(pathvegetaJadiBot)}) conectado exitosamente.\n│\n❒────────────【• CONECTADO •】────────────❒`))
        sock.isInit = true
        global.conns.push(sock)

        if (m?.chat) await conn.sendMessage(m.chat, { text: args[0] ? `@${m.sender.split('@')[0]}, ya estás conectado, leyendo mensajes entrantes...` : `@${m.sender.split('@')[0]}, genial ya eres parte de nuestra familia de Sub-Bots.`, mentions: [m.sender] }, { quoted: m })
      }
    }

    setInterval(async () => {
      if (!sock.user) {
        try { sock.ws.close() } catch { }
        sock.ev.removeAllListeners()
        let i = global.conns.indexOf(sock)
        if (i < 0) return
        delete global.conns[i]
        global.conns.splice(i, 1)
      }
    }, 60000)

    let handler = await import('../handler.js')
    let creloadHandler = async function (restatConn) {
      try {
        const Handler = await import(`../handler.js?update=${Date.now()}`).catch(console.error)
        if (Object.keys(Handler || {}).length) handler = Handler

      } catch (e) {
        console.error('⚠️ Nuevo error: ', e)
      }
      if (restatConn) {
        const oldChats = sock.chats
        try { sock.ws.close() } catch { }
        sock.ev.removeAllListeners()
        sock = makeWASocket(connectionOptions, { chats: oldChats })
        isInit = true
      }
      if (!isInit) {
        sock.ev.off("messages.upsert", sock.handler)
        sock.ev.off("connection.update", sock.connectionUpdate)
        sock.ev.off('creds.update', sock.credsUpdate)
      }

      sock.handler = handler.handler.bind(sock)
      sock.connectionUpdate = connectionUpdate.bind(sock)
      sock.credsUpdate = saveCreds.bind(sock, true)
      sock.ev.on("messages.upsert", sock.handler)
      sock.ev.on("connection.update", sock.connectionUpdate)
      sock.ev.on("creds.update", sock.credsUpdate)
      isInit = false
      return true
    }
    creloadHandler(false)
  })
}

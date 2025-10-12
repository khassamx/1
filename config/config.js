import { watchFile, unwatchFile } from 'fs' 
import chalk from 'chalk'
import { fileURLToPath } from 'url'
import fs from 'fs'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone' 

// ===================================================
// 👤 CONFIGURACIÓN DE PROPIETARIOS Y ROLES
// ===================================================

// BETA: Número del bot (solo para la opción de código de texto de 8 dígitos)
global.botNumber = '' 

// Dueños del Bot (ID, Nombre, EsOwnerVerificado)
global.owner = [
  // <-- Número @s.whatsapp.net -->
  ['595984495031', '☆ 𝐶𝑟𝑒𝑎𝑑𝑜𝑟 ☆', true],
  ['5216641784469', 'BrayanOFC-Li', true],
  ['90263687053350', 'Owner Secundario', true], // Añadido nombre por claridad

  // <-- Número @lid -->
  // ['258892692984006', 'DevAlexJs', true], // Línea comentada, descomentar si es @lid
];

// Moderadores
global.mods = [] 

// Usuarios con acceso a comandos "suittag" (dueños de comandos específicos)
global.suittag = ['5216641784469'] 

// Usuarios Premium
global.prems = []

// ===================================================
// 🤖 DATOS TÉCNICOS Y NOMBRES DEL BOT
// ===================================================

global.libreria = 'Baileys'
global.baileys = 'V 6.7.17'  
global.languaje = 'Español'
global.vs = '2.13.2'
global.vsJB = '5.0'
global.nameqr = '𝚅𝙴𝙶𝙴𝚃𝙰 - 𝙱𝙾𝚃 - 𝙼𝙱'
global.namebot = '✿◟𝚅𝚎𝚐𝚎𝚝𝚊-𝙱𝚘𝚝-𝙼𝙱◞✿'
global.vegetasessions = 'vegetaSessions' // Carpeta de sesiones
global.jadi = 'JadiBots' 
global.vegetaJadibts = true // Activar/desactivar Jadibots

// ===================================================
// 🖼️ ESTILOS Y TEXTOS (Sticker, Reply, Welcome)
// ===================================================

global.packname = `⪛✰¨♱𝚅𝙴𝙶𝙴𝚃𝙰-𝙱𝙾𝚃-𝙼𝙱` // Nombre del paquete de stickers
global.author = '➳𝐁𝐫𝐚𝐲𝐚𝐧𝐎𝐅𝐂ღ' // Autor de los stickers (Añadido 'author' aquí)
global.botname = '*♱𝚅𝙴𝙶𝙴𝚃𝙰-𝙱𝙾𝚃-𝙼𝙱♱*'
global.dev = '© ⍴᥆ᥕᥱrᥱძ ᑲᥡ  ➳𝐁𝐫𝐚𝐲𝐚𝐧𝐎𝐅𝐂ღ'
global.textbot = ' ➳𝐁𝐫𝐚𝐲𝐚𝐧𝐎𝐅𝐂❦ • P·:*¨♱𝚅𝙴𝙶𝙴𝚃𝙰-𝙱𝙾𝚃-𝙼𝙱♱ ¨*:·'
global.moneda = 'dragones'
global.welcom1 = 'Edita Con #setwelcome'
global.welcom2 = 'Edita Con #setbye'

// URLs para imágenes (se recomienda usar Buffer si es local)
global.banner = 'https://files.catbox.moe/j0z1kz.jpg'
global.catalogo = 'https://files.catbox.moe/j0z1kz.jpg'

// ===================================================
// 🔗 ENLACES Y CONTACTO
// ===================================================

global.gp1 = 'https://whatsapp.com/channel/0029VbAzCfhFHWpwREs2ZT0V'
global.comunidad1 = 'https://whatsapp.com/channel/0029VbAzCfhFHWpwREs2ZT0V'
global.channel = 'https://whatsapp.com/channel/0029VbAzCfhFHWpwREs2ZT0V'
global.channel2 = 'https://whatsapp.com/channel/0029VbAfPu9BqbrEMFWXKE0d'
global.md = 'https://githun.com/BrayanOFC/VEGETA-BOT-MB.git'
global.correo = 'lourdesagueda93@gmail.com'

// ===================================================
// ⚙️ OTROS AJUSTES Y DEPENDENCIAS GLOBALES
// ===================================================

/*global.catalogo = fs.readFileSync('./src/catalogo.jpg'); // Usar si catalogo es local*/
global.estilo = { 
  key: { 
    fromMe: false, 
    participant: `0@s.whatsapp.net`, 
    ...(false ? { remoteJid: "5219992095479-1625305606@g.us" } : {}) 
  }, 
  message: { 
    orderMessage: { 
      itemCount : -999999, 
      status: 1, 
      surface : 1, 
      message: global.packname, // Usar global.packname
      orderTitle: 'Bang', 
      thumbnail: global.catalogo, // Usar global.catalogo (URL o Buffer)
      sellerJid: '0@s.whatsapp.net'
    }
  }
}

global.ch = {
  ch1: '120363394965381607@newsletter',
  ch2: "120363394965381607@newsletter",
  ch3: "instagram.com/kekofavero"
}

global.multiplier = 60 // Multiplicador de experiencia (XP)

// Globalización de módulos para compatibilidad en plugins
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment   

// ===================================================
// 🔄 FUNCIÓN DE RECARGA AUTOMÁTICA
// ===================================================

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
  unwatchFile(file)
  console.log(chalk.redBright(`[ CONFIG ] Se actualizó 'config.js'`))
  // Forzamos la recarga usando un timestamp en la URL para evitar caché
  import(`${file}?update=${Date.now()}`)
})
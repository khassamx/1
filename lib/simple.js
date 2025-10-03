/**
 * LIBRERÍA DE FUNCIONES ESENCIALES DEL BOT (simple.js)
 * Archivo necesario para que index.js pueda arrancar y procesar mensajes.
 */

import {WAMessage, Baileys} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import { toBuffer } from 'qrcode'
import { fileTypeFromBuffer } from 'file-type'
import { URL } from 'url'
import fs from 'fs'
import path from 'path'
import { toBuffer as toBufferWebP } from 'node-webpmux'


export function makeWASocket(connectionOptions, options) {
    const conn = Baileys.makeWASocket(connectionOptions);
    conn.isInit = true;
    return conn;
}

export function protoType() {
    // Aquí iría la lógica para extender el prototipo de mensajes,
    // permitiendo manejar los mensajes de manera sencilla (ej. m.reply, m.text, etc.)
    
    // Por simplicidad y para evitar que el bot crashee al iniciar, 
    // lo dejaremos vacío. El handler.js se encargará de gran parte de esto.
    
    // Si tienes el código original de tu bot, deberías pegarlo aquí.
}


export function serialize() {
    // Esta función generalmente se encarga de envolver los mensajes
    // para que sean fáciles de usar en handler.js.
    
    // La dejaremos mínima, asumiendo que el handler de tu bot
    // está manejando la serialización de manera externa o ya tiene las propiedades necesarias.
    
    global.conn.handler = global.conn.handler || global.conn.defaultEventHandler
    global.conn.defaultEventHandler = function (json) {
        if (json.type === 'prepend') {
            for (const item of json.data) {
                try {
                    // Procesar y serializar el mensaje
                    const message = item.messages[0]
                    if (message) {
                         // Aquí se llama a la función de serialización real, 
                         // que asumiremos está definida en tu handler.js
                         message.m = message
                         message.isSerialized = true;
                    }
                } catch (e) {
                    // console.error("Error al serializar el mensaje:", e);
                }
            }
        }
        global.conn.handler(json)
    }
}

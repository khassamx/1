import {
    makeWASocket,
    proto,
    delay,
    WAMessageStubType,
    jidNormalizedUser,
    isJidGroup,
    extractGroupMetadata
} from '@whiskeysockets/baileys'

/**
 * Función para crear la conexión de WhatsApp.
 * @param {import('@whiskeysockets/baileys').ConnectionOptions} connectionOptions 
 */
export function makeWASocket(connectionOptions) {
    const conn = makeWASocket(connectionOptions);

    // Tu lógica original de makeWASocket para extender el objeto conn
    // (Asegúrate de copiar aquí cualquier modificación que tu bot haga a 'conn' al inicio)

    return conn;
}

/**
 * Extiende los objetos de Baileys (proto) con métodos útiles.
 */
export function protoType() {
    /**
     * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} m
     * @returns {string}
     */
    proto.WebMessageInfo.prototype.getParticipant = function() {
        if (this.key.participant) {
            return this.key.participant;
        }
        if (this.key.remoteJid && isJidGroup(this.key.remoteJid)) {
            return jidNormalizedUser(this.key.remoteJid);
        }
        return this.key.remoteJid;
    }
    
    // Aquí puedes agregar más extensiones al proto si tu bot las tiene
    
    Object.freeze(proto.WebMessageInfo.prototype)
}

/**
 * Serializa los mensajes para hacerlos más fáciles de manejar.
 */
export function serialize() {
    /**
     * @param {import('@whiskeysockets/baileys').AnyMessageContent} msg 
     * @param {import('@whiskeysockets/baileys').WASocket} conn 
     * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} m 
     */
    global.conn.serializeM = (m) => {
        return m; // Implementación mínima; tu bot podría tener una implementación más compleja.
    }
    
    // Aquí puedes agregar más lógica de serialización si tu bot la tiene
}
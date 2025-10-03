/**
 * ARCHIVO DE CONFIGURACIÓN PRINCIPAL - config.js
 * * Este archivo contiene las variables clave para el funcionamiento del bot.
 * Asegúrate de editar los valores según tus preferencias.
 */

// Si tu index.js lo busca como .js, usar export default.
// Si tu index.js lo busca sin extensión (config), usar module.exports = { ... }

export const config = {
    // 👑 DATOS DEL PROPIETARIO Y BOT 👑
    
    // Números de propietario: Usa el formato internacional sin '+' ni espacios.
    // Ejemplo: ["595986114722", "595981123456"]
    owner: ["595986114722"], // ⬅️ REEMPLAZA CON TU NÚMERO
    
    botName: "VEGETA-BOT-MB",
    
    // 🔨 PREFIJO DE COMANDOS 🔨
    // El carácter que debe ir antes de cada comando, ejemplo: !play, #menu
    prefix: "!", 

    // ⚙️ FUNCIONES Y AJUSTES VARIOS ⚙️
    
    // Leer automáticamente los mensajes
    autoread: true, 

    // Bloquea temporalmente a usuarios que envían demasiados comandos rápido
    antiflood: false, 

    // Mostrar el mensaje de 'escribiendo...'
    typing: true, 
    
    // Versión del Bot (solo para seguimiento interno)
    version: "2.13.2",
    
    // NOTA: Deja 'APIKeys' vacío a menos que tu handler.js los requiera explícitamente.
    // Ejemplo: { 'openai': 'TU_KEY_AQUI', 'dylux': 'OTRA_KEY' }
    APIKeys: {} 
}

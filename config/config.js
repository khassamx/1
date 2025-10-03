// config/config.js

import chalk from 'chalk';

/**
 * CONFIGURACIÓN GLOBAL DEL BOT
 * Centraliza variables clave para fácil modificación.
 */

// Información del Bot
export const BOT_NAME = 'VEGETA-BOT-MB';

// Prefijos de comandos (Ej: #, !, /)
export const PREFIX = new RegExp('^[#!./]');

// Rutas de Sesión y JadiBot (usadas por Baileys)
export const SESSIONS_FOLDER = 'vegetasessions';
export const JADIBOT_FOLDER = 'jadi';

// Opciones de Consola y Display
export const COLORS = {
    main: chalk.bold.blueBright,
    qr: chalk.green.bold,
    error: chalk.bold.redBright,
};

// Número del Bot (si se usa el modo código de 8 dígitos)
export const BOT_NUMBER = global.botNumber;

// Bandera para forzar la recarga de plugins
export const RELOAD_QUERY_PARAM = `?update=${Date.now()}`;

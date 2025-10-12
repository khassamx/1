// utils/helper.js

import pkg from 'google-libphonenumber'
import syntaxerror from 'syntax-error'
import { readFileSync } from 'fs'
import { format } from 'util'
import chalk from 'chalk'
const { PhoneNumberUtil } = pkg
const phoneUtil = PhoneNumberUtil.getInstance()

// Función para validar número de teléfono
export async function isValidPhoneNumber(phoneNumber) {
    if (typeof phoneNumber !== 'string') return false;
    try {
        const parsedNumber = phoneUtil.parseAndKeepRawInput(phoneNumber);
        return phoneUtil.isValidNumber(parsedNumber);
    } catch (e) {
        return false;
    }
}

// Función para redefinir el console y filtrar errores de Baileys
export function redefineConsoleMethod(methodName, filterStrings) {
    const originalMethod = console[methodName];
    if (typeof originalMethod === 'function') {
        console[methodName] = function(...args) {
            const message = args.map(arg => typeof arg === 'string' ? arg : format(arg)).join(' ');
            if (filterStrings.some(filter => Buffer.from(message).toString('base64').includes(filter))) {
                return; 
            }
            originalMethod.apply(console, args);
        };
    }
}

// Lógica para recargar plugins
export async function reloadPlugins(conn, handler, pluginFolder, pluginFilter) {
    const filename = arguments[1] // El nombre del archivo que se actualizó o eliminó
    
    if (pluginFilter(filename)) {
        const dir = global.__filename(global.path.join(pluginFolder, filename), true);
        if (filename in global.plugins) {
            if (global.fs.existsSync(dir)) conn.logger.info(chalk.yellow(` updated plugin - '${filename}'`))
            else {
                conn.logger.warn(chalk.red(`deleted plugin - '${filename}'`))
                return delete global.plugins[filename]
            }
        } else conn.logger.info(chalk.green(`new plugin - '${filename}'`))
        
        const err = syntaxerror(readFileSync(dir), filename, {
            sourceType: 'module',
            allowAwaitOutsideFunction: true,
        });
        
        if (err) conn.logger.error(chalk.red(`syntax error while loading '${filename}'\n${format(err)}`))
        else {
            try {
                const module = (await import(`${global.__filename(dir)}?update=${Date.now()}`));
                global.plugins[filename] = module.default || module;
            } catch (e) {
                conn.logger.error(chalk.red(`error require plugin '${filename}\n${format(e)}'`))
            } finally {
                global.plugins = Object.fromEntries(Object.entries(global.plugins).sort(([a], [b]) => a.localeCompare(b)))
            }
        }
    }
}
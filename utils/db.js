// utils/db.js

// 🔥 CORRECCIÓN CRÍTICA DE LOWDB: Importar JSONFile desde 'lowdb/node'
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node'; 
import lodash from 'lodash';

/**
 * Maneja la base de datos JSON con LowDB (v3+).
 * Fija el error de importación de JSONFile.
 */

// Inicializa LowDB. Guarda los datos en 'database.json'.
export const db = new Low(new JSONFile('database.json'));

/**
 * Carga la base de datos y la inicializa si está vacía.
 * Se llama al inicio del index.js.
 */
export async function loadDatabase() {
    if (db.READ) {
        return new Promise((resolve) => setInterval(async function() {
            if (!db.READ) {
                clearInterval(this);
                resolve(db.data == null ? loadDatabase() : db.data);
            }
        }, 1 * 1000));
    }

    if (db.data !== null) return;

    db.READ = true;
    await db.read().catch(console.error);
    db.READ = null;

    // Estructura inicial de datos
    db.data = {
        users: {},
        chats: {},
        stats: {},
        msgs: {},
        sticker: {},
        settings: {},
        ...(db.data || {}),
    };

    // Agrega chain de lodash
    db.chain = lodash.chain(db.data);
    await db.write(); // Guardar estructura inicial
}

export default db;

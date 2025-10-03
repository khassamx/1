/**
 * LIBRERÍA DE ALMACENAMIENTO (store.js)
 * Maneja la caché de la sesión y los datos de mensajes para Baileys.
 */
import { makeInMemoryStore } from '@whiskeysockets/baileys'

// Usamos makeInMemoryStore para almacenar datos de la sesión en RAM.
// Esto mejora el rendimiento y la capacidad de respuesta del bot,
// especialmente con mensajes citados y mensajes en grupo.
const store = makeInMemoryStore({})

// Conectamos el store a los eventos del conector (global.conn)
// para que guarde automáticamente los datos de la sesión.
export const connect = (conn) => {
    store.bind(conn.ev)
}

export default store

// NOTA: Esta versión usa la caché de mensajes directamente de Baileys.
// Si tu index.js lo importa, debería buscar funciones como loadMessage().
```eof

---

## 🛠️ Actualización de `index.js` (Final)

Tu **`index.js`** debe ser ligeramente modificado para usar la función `connect(conn)` que acabamos de agregar a `store.js`. Esto asegura que la caché de mensajes esté activa.

Solo tienes que modificar una sección en la parte superior.

**Reemplaza las importaciones de `store` y `mongoDB` en `index.js` con estas líneas:**

```javascript
// ... (líneas anteriores de importación)

import { makeWASocket, protoType, serialize } from './lib/simple.js'
// import { Low, JSONFile } from 'lowdb' // Ya está importado antes
// import { mongoDB, mongoDBV2 } from './lib/mongoDB.js' // ⬅️ Eliminado
import store, { connect } from './lib/store.js' // ⬅️ LÍNEA MODIFICADA (importa store y connect)

const { proto } = (await import('@whiskeysockets/baileys')).default

// ... (resto de las importaciones)
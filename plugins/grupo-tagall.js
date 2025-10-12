// 📁 plugins/grupo-tagall.js

// ===================================================
// 🧠 CONSTANTES Y UTILIDADES
// ===================================================

const countryFlags = {
  "1": "🇺🇸", "7": "🇷🇺", "20": "🇪🇬", "27": "🇿🇦", "30": "🇬🇷", "31": "🇳🇱",
  "32": "🇧🇪", "33": "🇫🇷", "34": "🇪🇸", "36": "🇭🇺", "39": "🇮🇹", "40": "🇷🇴",
  "41": "🇨🇭", "43": "🇦🇹", "44": "🇬🇧", "45": "🇩🇰", "46": "🇸🇪", "47": "🇳🇴",
  "48": "🇵🇱", "49": "🇩🇪", "51": "🇵🇪", "52": "🇲🇽", "53": "🇨🇺", "54": "🇦🇷",
  "55": "🇧🇷", "56": "🇨🇱", "57": "🇨🇴", "58": "🇻🇪", "60": "🇲🇾", "61": "🇦🇺",
  "62": "🇮🇩", "63": "🇵🇭", "64": "🇳🇿", "65": "🇸🇬", "66": "🇹🇭", "81": "🇯🇵",
  "82": "🇰🇷", "84": "🇻🇳", "86": "🇨🇳", "90": "🇹🇷", "91": "🇮🇳", "92": "🇵🇰",
  "93": "🇦🇫", "94": "🇱🇰", "95": "🇲🇲", "98": "🇮🇷", "211": "🇸🇸", "212": "🇲🇦",
  "213": "🇩🇿", "216": "🇹🇳", "218": "🇱🇾", "220": "🇬🇲", "221": "🇸🇳", "222": "🇲🇷",
  "223": "🇲🇱", "224": "🇬🇳", "225": "🇨🇮", "226": "🇧🇫", "227": "🇳🇪", "228": "🇹🇬",
  "229": "🇧🇯", "230": "🇲🇺", "231": "🇱🇷", "232": "🇸🇱", "233": "🇬🇭", "234": "🇳🇬",
  "235": "🇹🇩", "236": "🇨🇫", "237": "🇨🇲", "238": "🇨🇻", "239": "🇸🇹", "240": "🇬🇶",
  "241": "🇬🇦", "242": "🇨🇬", "243": "🇨🇩", "244": "🇦🇴", "245": "🇬🇼", "246": "🇮🇴",
  "248": "🇸🇨", "249": "🇸🇩", "250": "🇷🇼", "251": "🇪🇹", "252": "🇸🇴", "253": "🇩🇯",
  "254": "🇰🇪", "255": "🇹🇿", "256": "🇺🇬", "257": "🇧🇮", "258": "🇲🇿", "260": "🇿🇲",
  "261": "🇲🇬", "262": "🇷🇪", "263": "🇿🇼", "264": "🇳🇦", "265": "🇲🇼", "266": "🇱🇸",
  "267": "🇧🇼", "268": "🇸🇿", "269": "🇰🇲", "290": "🇸🇭", "291": "🇪🇷", "297": "🇦🇼",
  "298": "🇫🇴", "299": "🇬🇱", "350": "🇬🇮", "351": "🇵🇹", "352": "🇱🇺", "353": "🇮🇪",
  "354": "🇮🇸", "355": "🇦🇱", "356": "🇲🇹", "357": "🇨🇾", "358": "🇫🇮", "359": "🇧🇬",
  "370": "🇱🇹", "371": "🇱🇻", "372": "🇪🇪", "373": "🇲🇩", "374": "🇦🇲", "375": "🇧🇾",
  "376": "🇦🇩", "377": "🇲🇨", "378": "🇸🇲", "379": "🇻🇦", "380": "🇺🇦", "381": "🇷🇸",
  "382": "🇲🇪", "383": "🇽🇰", "385": "🇭🇷", "386": "🇸🇮", "387": "🇧🇦", "389": "🇲🇰",
  "420": "🇨🇿", "421": "🇸🇰", "423": "🇱🇮", "500": "🇫🇰", "501": "🇧🇿", "502": "🇬🇹",
  "503": "🇸🇻", "504": "🇭🇳", "505": "🇳🇮", "506": "🇨🇷", "507": "🇵🇦", "508": "🇵🇲",
  "509": "🇭🇹", "590": "🇬🇵", "591": "🇧🇴", "592": "🇬🇾", "593": "🇪🇨", "594": "🇬🇫",
  "595": "🇵🇾", "596": "🇲🇶", "597": "🇸🇷", "598": "🇺🇾", "599": "🇨🇼", "670": "🇹🇱",
  "672": "🇳🇫", "673": "🇧🇳", "674": "🇳🇷", "675": "🇵🇬", "676": "🇹🇴", "677": "🇸🇧",
  "678": "🇻🇺", "679": "🇫🇯", "680": "🇵🇼", "681": "🇼🇫", "682": "🇨🇰", "683": "🇳🇺",
  "685": "🇼🇸", "686": "🇰🇮", "687": "🇳🇨", "688": "🇹🇻", "689": "🇵🇫", "690": "🇹🇰",
  "691": "🇫🇲", "692": "🇲🇭", "850": "🇰🇵", "852": "🇭🇰", "853": "🇲🇴", "855": "🇰🇭",
  "856": "🇱🇦", "880": "🇧🇩", "886": "🇹🇼", "960": "🇲🇻", "961": "🇱🇧", "962": "🇯🇴",
  "963": "🇸🇾", "964": "🇮🇶", "965": "🇰🇼", "966": "🇸🇦", "967": "🇾🇪", "968": "🇴🇲",
  "970": "🇵🇸", "971": "🇦🇪", "972": "🇮🇱", "973": "🇧🇭", "974": "🇶🇦", "975": "🇧🇹",
  "976": "🇲🇳", "977": "🇳🇵", "992": "🇹🇯", "993": "🇹🇲", "994": "🇦🇿", "995": "🇬🇪",
  "996": "🇰🇬", "998": "🇺🇿"
};

/**
 * Intenta encontrar el prefijo telefónico más largo que coincida con una bandera.
 * @param {string} number Número de WhatsApp sin el '@s.whatsapp.net'
 * @returns {string} El prefijo de país encontrado o "⚡️".
 */
function getPrefix(number) {
    // Busca prefijos de 4, 3, 2 y 1 dígito
    for (let i = 4; i >= 1; i--) {
        const sub = number.slice(0, i);
        if (countryFlags[sub]) return sub;
    }
    return "⚡️"; // Prefijo por defecto
}


// ===================================================
// 🎯 HANDLER PRINCIPAL
// ===================================================

const handler = async (m, { isOwner, isAdmin, conn, text, participants, args, command, usedPrefix }) => {
    
    // El chequeo del prefijo "a" ya está al inicio, lo mantenemos.
    // if (usedPrefix.toLowerCase() === 'a') return; 

    // 1. CHEQUEO DE PERMISOS
    if (!(isAdmin || isOwner)) {
        global.dfail('admin', m, conn);
        return;
    }

    // 2. REACCIÓN Y MENSAJE
    const customEmoji = global.db?.data?.chats?.[m.chat]?.customEmoji || '⚡️';
    m.react(customEmoji);
    
    const mensaje = args.join(' ');
    const info = mensaje ? `╰➤ ✉️ *Mensaje:* ${mensaje}` : "╰➤ 🚨 *Invocación masiva de Vegeta*";

    // 3. CONSTRUCCIÓN DEL TEXTO
    let texto = `
🌌═══ *GALACTIC SUMMON* ═══🌌
👥 *Integrantes:* ${participants.length}
🏷️ *Grupo:* ${await conn.getName(m.chat)}
${info}
━━━━━━━━━━━━━━━\n`;

    // Generar la lista de menciones con banderas
    for (const miembro of participants) {
        // Asegurarse de que el ID es un string antes de dividir
        const number = String(miembro.id).split('@')[0]; 
        const prefix = getPrefix(number);
        const flag = countryFlags[prefix] || "🌍"; // Bandera por defecto si no se encuentra
        texto += `⚡ ${flag} @${number}\n`;
    }

    texto += `━━━━━━━━━━━━━━━
🔥 *PODER DESATADO POR VEGETA* 🐉`;

    // 4. ENVÍO DEL MENSAJE CON TODAS LAS MENCIONES
    conn.sendMessage(m.chat, {
        text: texto.trim(),
        mentions: participants.map(p => p.id) // Array con todos los JID
    }, { quoted: m });
};


// ===================================================
// 🎯 EXPORTACIÓN
// ===================================================

handler.help = ['todos *<mensaje>*'];
handler.tags = ['grupo'];
handler.command = ['tagall', 'todos'];
handler.group = true;
handler.admin = true; // Aseguramos que solo admin pueda usarlo
handler.botAdmin = false; // No requiere que el bot sea admin, solo el usuario

export default handler;
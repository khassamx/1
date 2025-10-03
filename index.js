import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Necesario para __dirname en ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let plugins = {};

// 🔥 Cargar todos los plugins dinámicamente
async function loadPlugins() {
    const pluginFiles = fs.readdirSync(path.join(__dirname, "plugins")).filter(f => f.endsWith(".js"));
    for (const file of pluginFiles) {
        const { default: plugin } = await import(`./plugins/${file}`);
        if (plugin?.name && typeof plugin.run === "function") {
            plugins[plugin.name] = plugin;
            console.log(`✅ Plugin cargado: ${plugin.name}`);
        }
    }
}

async function startBot() {
    await loadPlugins(); // cargar todos los plugins antes de arrancar

    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        version
    });

    // 🔥 Evento moderno para mostrar QR y conexión
    sock.ev.on("connection.update", ({ qr, connection }) => {
        if (qr) {
            console.log("📲 Escanea este QR con tu WhatsApp:\n");
            qrcode.generate(qr, { small: true }); // imprime el QR en la terminal
        }
        if (connection === "open") {
            console.log("✅ Bot conectado correctamente.");
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const from = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text;

        if (!text) return;

        // Si el mensaje empieza con un comando
        const cmd = text.split(" ")[0].toLowerCase();
        const args = text.split(" ").slice(1);

        if (plugins[cmd]) {
            try {
                await plugins[cmd].run(sock, m, from, args);
            } catch (e) {
                console.error("❌ Error en plugin:", e);
                await sock.sendMessage(from, { text: "⚠️ Error ejecutando el comando." });
            }
        }
    });

    console.log("🚀 Bot iniciado y esperando conexión...");
}

startBot();
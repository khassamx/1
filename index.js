import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Configuración de ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Plugins
let plugins = {};
let buttonHandlers = {};

// 🔹 Cargar plugins
async function loadPlugins() {
    const files = fs.readdirSync(path.join(__dirname, "plugins")).filter(f => f.endsWith(".js"));
    for (const file of files) {
        const { default: plugin } = await import(`./plugins/${file}`);
        if (plugin?.name && typeof plugin.run === "function") {
            plugins[plugin.name] = plugin;
            if (plugin.buttons) {
                for (const [prefix, handler] of Object.entries(plugin.buttons)) {
                    buttonHandlers[prefix] = handler;
                }
            }
            console.log(`✅ Plugin cargado: ${plugin.name}`);
        }
    }
}

// 🔹 Inicializar bot
async function startBot() {
    await loadPlugins();

    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    // ⚡ No pasar logger para evitar errores
    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false
    });

    // 🔹 Mostrar QR solo si hace falta
    sock.ev.on("connection.update", ({ qr, connection }) => {
        if (qr) {
            console.log("\n📲 Escanea este QR con tu WhatsApp:\n");
            qrcode.generate(qr, { small: true });
        }
        if (connection === "open") {
            console.log("\n✅ Bot conectado correctamente.\n");
        }
        if (connection === "close") {
            console.log("\n⚠️ Conexión cerrada. Escanea QR si es necesario.\n");
        }
    });

    // 🔹 Guardar credenciales
    sock.ev.on("creds.update", saveCreds);

    // 🔹 Escuchar mensajes
    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const from = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text;

        // ⚡ Comando por texto
        if (text) {
            const cmd = text.split(" ")[0].toLowerCase();
            const args = text.split(" ").slice(1);

            if (plugins[cmd]) {
                try {
                    await plugins[cmd].run(sock, m, from, args);
                } catch (err) {
                    console.error("❌ Error en plugin:", err.message || err);
                    await sock.sendMessage(from, { text: "⚠️ Error ejecutando el comando." });
                }
            }
        }

        // ⚡ Comando por botón
        if (m.message.buttonsResponseMessage) {
            const buttonId = m.message.buttonsResponseMessage.selectedButtonId;
            for (const prefix in buttonHandlers) {
                if (buttonId.startsWith(prefix)) {
                    try {
                        await buttonHandlers[prefix](sock, m, from, buttonId);
                    } catch (err) {
                        console.error("❌ Error en botón:", err.message || err);
                        await sock.sendMessage(from, { text: "⚠️ Error en la acción del botón." });
                    }
                }
            }
        }
    });

    console.log("🚀 Bot iniciado y esperando conexión...\n");
}

// 🔹 Ejecutar bot
startBot();
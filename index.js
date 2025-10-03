import makeWASocket, { useMultiFileAuthState, fetchLatestBaileysVersion } from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let plugins = {};
let buttonHandlers = {}; // 🔥 aquí guardamos todos los botones registrados

// Cargar plugins automáticamente
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

async function startBot() {
    await loadPlugins();

    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        version
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;
        const from = m.key.remoteJid;
        const text = m.message.conversation || m.message.extendedTextMessage?.text;

        if (!text && !m.message.buttonsResponseMessage) return;

        // ⚡ Si es un comando
        if (text) {
            const cmd = text.split(" ")[0].toLowerCase();
            const args = text.split(" ").slice(1);
            if (plugins[cmd]) {
                try {
                    await plugins[cmd].run(sock, m, from, args);
                } catch (err) {
                    console.error("❌ Error en plugin:", err);
                    await sock.sendMessage(from, { text: "⚠️ Error ejecutando el comando." });
                }
            }
        }

        // ⚡ Si es respuesta a botón
        if (m.message.buttonsResponseMessage) {
            const buttonId = m.message.buttonsResponseMessage.selectedButtonId;

            // Buscar qué handler le toca
            for (const prefix in buttonHandlers) {
                if (buttonId.startsWith(prefix)) {
                    try {
                        await buttonHandlers[prefix](sock, m, from, buttonId);
                    } catch (err) {
                        console.error("❌ Error en botón:", err);
                        await sock.sendMessage(from, { text: "⚠️ Error en la acción del botón." });
                    }
                }
            }
        }
    });

    console.log("✅ Bot conectado.");
}

startBot();
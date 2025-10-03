import fetch from "node-fetch";
import fs from "fs";

export default {
    name: "ig",
    description: "Descargar reels de Instagram",

    async run(sock, m, from, args) {
        const url = args[0];
        if (!url) return await sock.sendMessage(from, { text: "❌ Uso: ig <url>" });

        await sock.sendMessage(from, {
            text: "📷 ¿Quieres este Reel como audio o video?",
            buttons: [
                { buttonId: `ig-audio-${url}`, buttonText: { displayText: "🎵 Audio MP3" }, type: 1 },
                { buttonId: `ig-video-${url}`, buttonText: { displayText: "📹 Video MP4" }, type: 1 }
            ]
        });
    },

    buttons: {
        "ig-audio-": async (sock, m, from, buttonId) => {
            const url = buttonId.replace("ig-audio-", "");
            const file = "./media/ig.mp3";

            const res = await fetch(`https://saveig.app/api?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            const dl = data?.media[0]?.url.replace(".mp4", ".mp3");

            const resp = await fetch(dl);
            fs.writeFileSync(file, Buffer.from(await resp.arrayBuffer()));

            await sock.sendMessage(from, { audio: { url: file }, mimetype: "audio/mp4" });
        },

        "ig-video-": async (sock, m, from, buttonId) => {
            const url = buttonId.replace("ig-video-", "");
            const file = "./media/ig.mp4";

            const res = await fetch(`https://saveig.app/api?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            const dl = data?.media[0]?.url;

            const resp = await fetch(dl);
            fs.writeFileSync(file, Buffer.from(await resp.arrayBuffer()));

            await sock.sendMessage(from, { video: { url: file }, caption: "📹 Instagram" });
        }
    }
};
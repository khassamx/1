import fetch from "node-fetch";
import fs from "fs";

export default {
    name: "tiktok",
    description: "Descargar videos de TikTok",

    async run(sock, m, from, args) {
        const url = args[0];
        if (!url) return await sock.sendMessage(from, { text: "❌ Uso: tiktok <url>" });

        await sock.sendMessage(from, {
            text: "📹 ¿Quieres este TikTok como audio o video?",
            buttons: [
                { buttonId: `tk-audio-${url}`, buttonText: { displayText: "🎵 Audio MP3" }, type: 1 },
                { buttonId: `tk-video-${url}`, buttonText: { displayText: "📹 Video MP4" }, type: 1 }
            ]
        });
    },

    buttons: {
        "tk-audio-": async (sock, m, from, buttonId) => {
            const url = buttonId.replace("tk-audio-", "");
            const file = "./media/tk.mp3";

            const res = await fetch(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            const dl = data.video.url.replace(".mp4", ".mp3");

            const resp = await fetch(dl);
            fs.writeFileSync(file, Buffer.from(await resp.arrayBuffer()));

            await sock.sendMessage(from, { audio: { url: file }, mimetype: "audio/mp4" });
        },

        "tk-video-": async (sock, m, from, buttonId) => {
            const url = buttonId.replace("tk-video-", "");
            const file = "./media/tk.mp4";

            const res = await fetch(`https://api.tikmate.app/api/lookup?url=${encodeURIComponent(url)}`);
            const data = await res.json();
            const dl = data.video.url;

            const resp = await fetch(dl);
            fs.writeFileSync(file, Buffer.from(await resp.arrayBuffer()));

            await sock.sendMessage(from, { video: { url: file }, caption: "📹 TikTok" });
        }
    }
};
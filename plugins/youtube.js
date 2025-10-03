import yts from "yt-search";
import ytdl from "ytdl-core";
import fs from "fs";

export default {
    name: "play",
    description: "Descargar música o video de YouTube",

    async run(sock, m, from, args) {
        const query = args.join(" ");
        if (!query) {
            return await sock.sendMessage(from, { text: "❌ Uso: play <canción>" });
        }

        await sock.sendMessage(from, {
            text: `🎶 ¿Cómo quieres *${query}*?`,
            buttons: [
                { buttonId: `yt-audio-${query}`, buttonText: { displayText: "🎵 Audio MP3" }, type: 1 },
                { buttonId: `yt-video-${query}`, buttonText: { displayText: "📹 Video MP4" }, type: 1 }
            ]
        });
    },

    // 🔥 Handlers de botones centralizados
    buttons: {
        "yt-audio-": async (sock, m, from, buttonId) => {
            const query = buttonId.replace("yt-audio-", "");
            const search = await yts(query);
            const video = search.videos[0];
            const file = "./media/song.mp3";

            const stream = ytdl(video.url, { filter: "audioonly" });
            stream.pipe(fs.createWriteStream(file));

            stream.on("end", async () => {
                await sock.sendMessage(from, { audio: { url: file }, mimetype: "audio/mp4" });
            });
        },

        "yt-video-": async (sock, m, from, buttonId) => {
            const query = buttonId.replace("yt-video-", "");
            const search = await yts(query);
            const video = search.videos[0];
            const file = "./media/video.mp4";

            const stream = ytdl(video.url, { filter: "videoandaudio" });
            stream.pipe(fs.createWriteStream(file));

            stream.on("end", async () => {
                await sock.sendMessage(from, { video: { url: file }, caption: video.title });
            });
        }
    }
};
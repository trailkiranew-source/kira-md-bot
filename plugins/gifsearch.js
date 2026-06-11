// plugins/gifsearch.js
const axios = require("axios");

module.exports = {
    name: "gifsearch",
    alias: ["sgif", "giphy"],

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const query = args.join(" ");

        if (!query) {
            return await sock.sendMessage(
                jid,
                {
                    text: "❌ Example:\n.gifsearch anime"
                },
                { quoted: msg }
            );
        }

        try {
            await sock.sendMessage(jid, {
                react: { text: "🔍", key: msg.key }
            });

            const apiKey = process.env.GIPHY_API_KEY;

            const { data } = await axios.get(
                `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=20&rating=g`
            );

            if (!data.data.length) {
                return await sock.sendMessage(jid, {
                    text: "❌ No GIF found."
                });
            }

            const gif =
                data.data[Math.floor(Math.random() * data.data.length)];

            // MP4 version (much better for WhatsApp)
            const videoUrl = gif.images.original_mp4.mp4;

            await sock.sendMessage(
                jid,
                {
                    video: {
                        url: videoUrl
                    },
                    gifPlayback: true,
                    caption: `🎞️ ${query}`
                },
                { quoted: msg }
            );

            await sock.sendMessage(jid, {
                react: { text: "✅", key: msg.key }
            });

        } catch (err) {
            console.log(err);

            await sock.sendMessage(jid, {
                react: { text: "❌", key: msg.key }
            });

            await sock.sendMessage(jid, {
                text: "❌ GIF Search Failed"
            });
        }
    }
};
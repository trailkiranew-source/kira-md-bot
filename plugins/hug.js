const axios = require("axios");

module.exports = {
    name: "hug",
    category: "anime",
    description: "Anime hug gif",

    async execute(sock, msg) {
        const jid = msg.key.remoteJid;

        try {
            const { data } = await axios.get(
                "https://api.waifu.pics/sfw/hug"
            );

            await sock.sendMessage(
                jid,
                {
                    video: {
                        url: data.url
                    },
                    gifPlayback: true,
                    caption: "⊱ ────── {.⋅ ✯ ⋅.} ────── ⊰\n♡ Sending a warm anime hug ♡\n⊱ ─────────────────── ⊰"
                },
                {
                    quoted: msg
                }
            );

        } catch (err) {
            console.log("HUG ERROR:", err);

            await sock.sendMessage(
                jid,
                {
                    text: "❌ Failed to get hug gif."
                },
                {
                    quoted: msg
                }
            );
        }
    }
};
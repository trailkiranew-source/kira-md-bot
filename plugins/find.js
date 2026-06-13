const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const FormData = require("form-data");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    name: "find",
    alias: ["identify", "whatsong"],
    category: "media",
    description: "Identify song from replied audio/video",

    async execute(sock, msg) {
        const jid = msg.key.remoteJid;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quoted || (!quoted.audioMessage && !quoted.videoMessage)) {
            return await sock.sendMessage(jid, { 
                text: `╭──『 🎵 *FIND SONG* 』──⊷\n│ ❌ *Media missing!*\n│ ➢ Reply to an Audio or Video.\n╰──────────────⊷` 
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(jid, { react: { text: "🎧", key: msg.key } });

            const mediaBuffer = await downloadMediaMessage({ message: quoted }, "buffer", {}, { logger: console });

            const form = new FormData();
            form.append("reqtype", "fileupload");
            form.append("fileToUpload", mediaBuffer, { filename: "song.mp3" });

            const uploadRes = await fetch("https://catbox.moe/user/api.php", {
                method: 'POST',
                body: form
            });

            const mediaUrl = await uploadRes.text();

            if (!mediaUrl.startsWith("http")) throw new Error("Audio upload failed");

            const identifyRes = await (await fetch(`https://jerrycoder.oggyapi.workers.dev/tool/identify?url=${encodeURIComponent(mediaUrl)}`)).json();

            if (identifyRes.status !== "success") throw new Error("Could not identify the song.");

            const { title, artist, image, shazam_url, album, release_date, genre } = identifyRes.result;
            
            // 💡 ഡൈനാമിക് ആയി ക്യാപ്ഷൻ സെറ്റ് ചെയ്യുന്നു
            let caption = `╭──『 🎵 *SONG IDENTIFIED* 』──⊷\n│\n`;
            caption += `│ 📀 *Title :* ${title || "Unknown"}\n`;
            caption += `│ 🎤 *Artist :* ${artist || "Unknown"}\n`;
            
            // വിവരങ്ങൾ ഉണ്ടെങ്കിൽ മാത്രം ആ വരികൾ ചേർക്കും
            if (album && album !== "Unknown Album") caption += `│ 💿 *Album :* ${album}\n`;
            if (release_date) caption += `│ 📅 *Released :* ${release_date}\n`;
            if (genre) caption += `│ 🎼 *Genre :* ${genre}\n`;
            
            caption += `│\n╰──────────────⊷\n\n`;
            if (shazam_url) caption += `🔗 *Listen on Shazam:*\n${shazam_url}`;

            await sock.sendMessage(jid, { 
                image: { url: image || "https://telegra.ph/file/0c32688031d27944062a7.jpg" }, 
                caption 
            }, { quoted: msg });
            
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error("Find Error:", err);
            await sock.sendMessage(jid, { 
                text: `╭──『 ❌ *ERROR* 』──⊷\n│ ${err.message}\n╰──────────────⊷` 
            }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};
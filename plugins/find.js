// plugins/find.js - KIRA X MD (Song Recognition using st-shazam)
const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const { recognizeSong } = require('st-shazam');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');
const axios = require('axios');

module.exports = {
    name: "find",
    alias: ["recognize", "whatsong"],
    category: "media",
    description: "Identify a song by replying to an audio or video file",
    usage: `${process.env.PREFIX || '.'}find (reply to audio or video)`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        // 1. Check if the user replied to a media message
        if (!quoted || (!quoted.audioMessage && !quoted.videoMessage)) {
            await sock.sendMessage(jid, { text: `🎵 *Find Song*\n\nReply to an *audio* or *video* file.` }, { quoted: msg });
            return;
        }

        // 2. Send initial reactions
        await sock.sendMessage(jid, { react: { text: "🎵", key: msg.key } });
        const statusMsg = await sock.sendMessage(jid, { text: "🔍 *Analyzing audio...*" });

        let mediaBuffer;
        let tempFilePath = null;

        try {
            // 3. Download the media buffer
            if (typeof sock.downloadMediaMessage === 'function') {
                mediaBuffer = await downloadMediaMessage({ message: quoted }, "buffer", {}, { logger: console });
            } else {
                const mediaUrl = quoted.audioMessage?.url || quoted.videoMessage?.url;
                const response = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
                mediaBuffer = Buffer.from(response.data);
            }

            if (!mediaBuffer) throw new Error("Failed to download media");

            // 4. Save to a temporary file
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            tempFilePath = path.join(tempDir, `song_${Date.now()}.mp3`);
            fs.writeFileSync(tempFilePath, mediaBuffer);

            // 5. Recognize the song using st-shazam
            const result = await recognizeSong(tempFilePath);

            // 6. Clean up temp file
            if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);

            // 7. Process the result
            if (result && result.matches && result.matches.length > 0) {
                const song = result.matches[0].track;
                const title = song?.title || 'Unknown';
                const artist = song?.subtitle || 'Unknown';
                const images = song?.images || {};
                const coverArt = images.coverarthq || images.coverart || 'No cover art available';

                const premiumMsg = `🎵 *SONG FOUND* 🎵

📀 *Title* : ${title}
🎤 *Artist* : ${artist}
🖼️ *Cover Art* : ${coverArt}

━━━━━━━━━━━━━━━━━━━
🔹 *Powered by KIRA X MD* 🔹`;
                await sock.sendMessage(jid, { text: premiumMsg, edit: statusMsg.key });
                await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
            } else {
                throw new Error("No song identified. Try a clearer audio.");
            }
        } catch (err) {
            console.error("Song recognition error:", err);
            if (tempFilePath && fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
            await sock.sendMessage(jid, { text: `❌ *Failed*: ${err.message || "Could not identify song. Try a clearer audio."}`, edit: statusMsg.key });
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};
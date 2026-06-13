// plugins/play.js – KIRA X MD (YouTube audio downloader with status)
const { searchYoutube, downloadAudio } = require('../lib/yt');
const fs = require('fs');

module.exports = {
    name: 'play',
    alias: ['song', 'music', 'audio'],
    category: 'downloader',
    description: 'Search YouTube and download audio (first result)',
    usage: `${process.env.PREFIX || '.'}play <query>`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const query = (args && Array.isArray(args) ? args.join(' ') : '').trim();
        if (!query) {
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
            return;
        }

        await sock.sendMessage(jid, { react: { text: "🔍", key: msg.key } });
        let statusMsg = await sock.sendMessage(jid, { text: `🔍 *Searching* : ${query}...` });

        try {
            const results = await searchYoutube(query, 1);
            if (!results.length) throw new Error('No results');
            const video = results[0];
            const title = video.title;
            const duration = video.duration;

            // Update status: Downloading
            await sock.sendMessage(jid, { text: `📥 *Downloading* : ${title} (${duration})...`, edit: statusMsg.key });

            const audio = await downloadAudio(video.url);
            const buffer = fs.readFileSync(audio.path);

            // Update status: Downloaded
            await sock.sendMessage(jid, { text: `✅ *Downloaded* : ${title} (${duration})`, edit: statusMsg.key });

            // Send audio
            await sock.sendMessage(jid, { audio: buffer, mimetype: 'audio/mpeg', ptt: false, caption: 'KIRA X MD' });
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });

            fs.unlinkSync(audio.path);
        } catch (err) {
            console.error(err);
            await sock.sendMessage(jid, { text: `❌ *Failed* : ${err.message || 'Something went wrong'}`, edit: statusMsg.key });
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};
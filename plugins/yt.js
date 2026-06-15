const ytSearch = require('yt-search'); 
const axios = require('axios');

module.exports = {
    name: 'yt',
    alias: ['youtube', 'ytdl'],
    category: 'downloader',
    description: 'Download YouTube videos',
    usage: '.yt <URL>',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        let url = (args && Array.isArray(args) ? args.join(' ') : '').trim();
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!url && quoted) {
            const rawText = quoted.conversation || quoted.extendedTextMessage?.text || "";
            const match = rawText.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (match) url = `https://youtu.be/${match}`; // 🚨 FIX: match
        }

        if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
            return await sock.sendMessage(jid, { text: "❌ *Please provide a valid YouTube URL!*" }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: "📥", key: msg.key } });

        const apis = [
            `https://jerrycoder.oggyapi.workers.dev/down/ytmp4-v1?url=${encodeURIComponent(url)}`,
            `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`,
            `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`
        ];

        try {
            let videoUrl = '';
            for (let api of apis) {
                try {
                    const { data } = await axios.get(api, { timeout: 10000 });
                    videoUrl = data.data?.url || data.result?.download_url || data.result?.url || data.url;
                    if (videoUrl) break;
                } catch (e) { continue; }
            }

            if (!videoUrl) throw new Error('API could not fetch video.');

            await sock.sendMessage(jid, { 
                video: { url: videoUrl }, 
                mimetype: 'video/mp4', 
                caption: '*🎌 KIRA X MD YT DOWNLOADER 🎌*' 
            }, { quoted: msg });
            
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
        } catch (err) {
            console.error('YT Error:', err.message);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};
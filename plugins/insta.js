const axios = require('axios');

module.exports = {
    name: 'insta',
    alias: ['ig', 'igdl', 'instagram', 'reel'],
    category: 'downloader',
    description: 'Download Instagram reels/videos/photos',
    usage: '.insta <url>',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        let url = (args || []).join(' ').trim();

        try {
            // Reply message detect
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo ||
                                msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo ||
                                msg.message?.viewOnceMessage?.message?.extendedTextMessage?.contextInfo;

            const quoted = contextInfo?.quotedMessage;

            if (!url && quoted) {
                const rawText = quoted.conversation || quoted.extendedTextMessage?.text || 
                                quoted.imageMessage?.caption || quoted.videoMessage?.caption || '';
                const urls = rawText.match(/https?:\/\/[^\s]+/g);
                if (urls && urls.length) url = urls;
            }

            if (!url || typeof url !== 'string' || !url.includes('instagram.com')) {
                return await sock.sendMessage(jid, { text: '❌ *Please provide a valid Instagram URL!*' }, { quoted: msg });
            }

            await sock.sendMessage(jid, { react: { text: '📥', key: msg.key } });

            // API List
            const apis = [
                `https://api-aswin-sparky.koyeb.app/api/downloader/instagram?url=${encodeURIComponent(url)}`,
                `https://jerrycoder.oggyapi.workers.dev/down/insta?url=${encodeURIComponent(url)}`,
                `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`
            ];

            let mediaUrl = null;
let mediaType = 'video';
let fileName = '';

            for (const api of apis) {
                try {
                    console.log('Trying API:', api);
                    const res = await axios.get(api, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } });
                    
                    const data = res.data;
                    mediaType =
    data?.data?.type ||
    data?.result?.type ||
    'video';
                    fileName =
    data?.result?.filename ||
    data?.filename ||
    data?.data?.filename ||
    '';
                    mediaUrl = data?.result?.url || 
                               data?.result?.video || 
                               data?.data?.url || 
                               data?.data?.video || 
                               data?.url ||
                               data?.result?.url;

                    if (mediaUrl && mediaUrl.startsWith('http')) {
                        console.log(JSON.stringify(data, null, 2));
                        console.log('Media found at:', mediaUrl);
                        break;
                    }
                } catch (e) {
                    console.log('API Error:', api, e.message);
                }
            }

            if (!mediaUrl) throw new Error('Media URL not found from available APIs');

            // ഫോട്ടോയാണോ വീഡിയോയാണോ എന്ന് തിരിച്ചറിയുന്നു
            const messageType =
    mediaType.toLowerCase() === 'image'
        ? 'image'
        : 'video';

            console.log('API Type:', mediaType);
            console.log('Detected Type:', messageType);

await sock.sendMessage(
    jid,
    {
        [messageType]: { url: mediaUrl },
        caption: '✅ *Downloaded by KIRA-X-MD*'
    },
    { quoted: msg }
);

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });

        } catch (err) {
            console.error(err);
            await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
        }
    }
};
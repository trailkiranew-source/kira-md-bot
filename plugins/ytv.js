const axios = require('axios');

module.exports = {
    name: 'ytv',
    alias: ['ytvideo'],
    category: 'downloader',
    description: 'Download YouTube video (Stable Multi-API)',
    usage: '.ytv <URL>',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        let url = (args && Array.isArray(args) ? args.join(' ') : '').trim();
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        // URL Extractor Fix
        if (!url && quoted) {
            const rawText = quoted.conversation || quoted.extendedTextMessage?.text || "";
            const match = rawText.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
            if (match) url = `https://youtu.be/${match}`;
        }

        if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
            return await sock.sendMessage(jid, { text: `❌ *Please provide a valid YouTube URL!*` }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: "📥", key: msg.key } });

        try {
            let videoUrl = '';
            const apis = [
                `https://jerrycoder.oggyapi.workers.dev/down/ytmp4-v1?url=${encodeURIComponent(url)}`,
                `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`,
                `https://eliteprotech-apis.zone.id/ytmp4?url=${encodeURIComponent(url)}` 
            ];

            const axiosConfig = {
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
                    'Referer': 'https://www.youtube.com/'
                }
            };

            for (let i = 0; i < apis.length; i++) {
                try {
                    const res = await axios.get(apis[i], axiosConfig);
                    const data = res.data;
                    
                    let tempUrl = data.data?.dl || data.data?.url || data.url || 
                                  data.result?.download_url || data.result?.url || 
                                  data.result?.video || data.result?.hd || data.result;

                    if (tempUrl && typeof tempUrl === 'string' && tempUrl.startsWith('http')) {
                        // ലിങ്ക് വാലിഡേഷൻ
                        const check = await axios.head(tempUrl, { timeout: 5000 }).catch(() => null);
                        if (check && check.status === 200) {
                            videoUrl = tempUrl;
                            break;
                        }
                    }
                } catch (e) { continue; }
            }

            if (!videoUrl) throw new Error('All servers busy.');

            // നേരിട്ട് ലിങ്ക് അയക്കുന്നു (RAM സേവ് ചെയ്യാൻ)
            await sock.sendMessage(jid, { 
                video: { url: videoUrl }, 
                mimetype: 'video/mp4', 
                caption: `*🎌 KIRA X MD YTV DOWNLOADER 🎌*` 
            }, { quoted: msg });
            
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error("YTV Downloader Error:", err.message);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};
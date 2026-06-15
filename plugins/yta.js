const axios = require('axios');

module.exports = {
    name: 'yta',
    alias: ['ytaudio', 'ytmp3'],
    category: 'downloader',
    description: 'Download YouTube audio as document',
    usage: '.yta <URL>',

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
            let audioUrl = '';
            let audioTitle = 'KIRA_X_MD_Audio';

            const apis = [
                `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(url)}`,
                `https://jerrycoder.oggyapi.workers.dev/down/ytmp3-v1?url=${encodeURIComponent(url)}`
            ];

            // 🚨 Anti-Block Headers 🚨
            const axiosConfig = {
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36' }
            };

            for (let i = 0; i < apis.length; i++) {
                try {
                    const res = await axios.get(apis[i], axiosConfig);
                    const data = res.data;
                    
                    let tempUrl = data.data?.dl || data.url || data.result?.download_url || data.result?.url || data.result?.audio || data.result;
                    
                    if (tempUrl && typeof tempUrl === 'string' && tempUrl.startsWith('http')) {
                        // ലിങ്ക് റെയിൽവേയിൽ വർക്ക് ആകുമോ എന്ന് ഒരു ഹെഡ് റിക്വസ്റ്റ് വഴി ചെക്ക് ചെയ്യുന്നു
                        const check = await axios.head(tempUrl, { timeout: 5000 }).catch(() => null);
                        if (check && check.status === 200) {
                            audioUrl = tempUrl;
                            audioTitle = data.data?.title || data.title || data.result?.title || audioTitle;
                            break;
                        }
                    }
                } catch (e) { continue; }
            }

            if (!audioUrl) throw new Error('All audio servers are currently busy.');

            await sock.sendMessage(jid, { 
                document: { url: audioUrl }, 
                mimetype: 'audio/mpeg', 
                fileName: `${audioTitle.replace(/[^a-zA-Z0-9 ]/g, '')}.mp3`, 
                caption: '*🎌 KIRA X MD YTA DOWNLOADER 🎌*' 
            }, { quoted: msg });
            
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error("YTA Downloader Error:", err.message);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};
const ytSearch = require('yt-search'); 
const axios = require('axios');

module.exports = {
    name: 'play',
    alias: ['song', 'music', 'audio'],
    category: 'downloader',
    description: 'Search and play YouTube audio or use direct link',
    usage: '.play <song name or link>',
    
    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const query = (args && Array.isArray(args) ? args.join(' ') : '').trim();
        
        if (!query) {
            return await sock.sendMessage(jid, { text: `❌ *What song do you want to play?*` }, { quoted: msg });
        }

        // വെറും Reaction മാത്രം
        await sock.sendMessage(jid, { react: { text: "🔍", key: msg.key } });

        try {
            let url = '';
            const ytRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
            const match = query.match(ytRegex);

            if (match) {
                url = `https://youtu.be/${match}`;
            } else {
                const searchResults = await ytSearch(query);
                const video = searchResults.videos ? searchResults.videos.find(v => v.url) : null;
                if (!video || !video.url) throw new Error('No valid video found.');
                url = video.url;
            }

            await sock.sendMessage(jid, { react: { text: "📥", key: msg.key } });

            let audioUrl = '';
            const apis = [
                `https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(url)}`,
                `https://jerrycoder.oggyapi.workers.dev/down/ytmp3-v1?url=${encodeURIComponent(url)}`,
                `https://jerrycoder.oggyapi.workers.dev/down/ytmp3?url=${encodeURIComponent(url)}`,
                `https://eliteprotech-apis.zone.id/ytdown?format=mp3&url=${encodeURIComponent(url)}`
            ];

            const axiosConfig = {
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36' }
            };

            for (let i = 0; i < apis.length; i++) {
                try {
                    const res = await axios.get(apis[i], axiosConfig);
                    let tempUrl = res.data.data?.dl || res.data.url || res.data.result?.download_url || res.data.result?.audio || res.data.result;
                    if (tempUrl && typeof tempUrl === 'string' && tempUrl.startsWith('http')) {
                        const check = await axios.head(tempUrl, { timeout: 5000 }).catch(() => null);
                        if (check && check.status === 200) {
                            audioUrl = tempUrl;
                            break;
                        }
                    }
                } catch (e) {}
            }

            if (!audioUrl) throw new Error('All servers busy.');

            await sock.sendMessage(jid, { 
                audio: { url: audioUrl }, 
                mimetype: 'audio/mpeg'
            }, { quoted: msg });
            
            await sock.sendMessage(jid, { react: { text: "🎧", key: msg.key } });

        } catch (err) {
            console.error("Play Error:", err.message);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};
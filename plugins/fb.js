const axios = require('axios');

module.exports = {
    name: 'fb',
    alias: ['facebook', 'fbdl'],
    category: 'downloader',
    description: 'Download Facebook videos',
    usage: `${process.env.PREFIX || '.'}fb <URL>`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        let url = (args && Array.isArray(args) ? args.join(' ') : '').trim();

        if (!url || (!url.includes('facebook.com') && !url.includes('fb.watch'))) {
            return await sock.sendMessage(jid, { text: "❌ *Please provide a valid Facebook URL!*" }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: "📥", key: msg.key } });
        const statusMsg = await sock.sendMessage(jid, { text: `📥 *Downloading Facebook video...*` });

        try {
            // global.api ഉപയോഗിക്കുന്നു
            const res = await axios.get(`${global.api.fb}${encodeURIComponent(url)}`);
            const apiData = res.data;
            
            // ലിങ്ക് കണ്ടെത്താൻ ഫ്ലെക്സിബിൾ ആയ രീതി
            const result = apiData.data || apiData.result;
            const videoUrl = result?.high || result?.hd || result?.url || result?.video || result?.sd;

            if (!videoUrl) throw new Error('Video link not found');

            // ബഫർ ചെയ്യാതെ നേരിട്ട് URL വഴി അയക്കുന്നു (വേഗത കൂടും)
            await sock.sendMessage(jid, { 
                video: { url: videoUrl }, 
                mimetype: 'video/mp4', 
                caption: '*🎌 KIRA X MD FACEBOOK DOWNLOADER 🎌*' 
            }, { quoted: msg });
            
            await sock.sendMessage(jid, { text: `✅ *Facebook video sent*`, edit: statusMsg.key });
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
        } catch (err) {
            console.error('FB Error:', err.message);
            await sock.sendMessage(jid, { text: `❌ *Failed to download!*`, edit: statusMsg.key });
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};
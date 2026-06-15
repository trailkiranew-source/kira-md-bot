const axios = require('axios');

module.exports = {
    name: 'insta',
    alias: ['ig', 'igdl', 'instagram', 'reel'],
    category: 'downloader',
    description: 'Download Instagram reels/videos',
    usage: `${process.env.PREFIX || '.'}insta <URL>`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        let url = (args && Array.isArray(args) ? args.join(' ') : '').trim();
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // റിപ്ലൈ മെസ്സേജിൽ നിന്നും ലിങ്ക് എടുക്കുന്ന ഭാഗം
        if (!url && quoted) {
            const rawText = quoted.conversation || quoted.extendedTextMessage?.text || quoted.imageMessage?.caption || quoted.videoMessage?.caption || "";
            const match = rawText.match(/https?:\/\/(www\.)?instagram\.com\/\S+/);
            url = match ? match : "";
        }

        if (!url || !url.includes('instagram.com')) {
            return await sock.sendMessage(jid, { text: "❌ *Please provide a valid Instagram URL or reply to a valid link!*" }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: "📥", key: msg.key } });
        const statusMsg = await sock.sendMessage(jid, { text: `📥 *Downloading Instagram media...*` });

        try {
            // global.api ഉപയോഗിക്കുന്നു
            const res = await axios.get(`${global.api.insta}${encodeURIComponent(url)}`);
            const apiData = res.data;
            
            // API-യിൽ നിന്ന് ലിങ്ക് കണ്ടെത്തുന്നു
            const result = apiData.result || apiData.data;
            let videoUrl = '';

            if (Array.isArray(result) && result.length > 0) {
                videoUrl = result.url || result.download_url || result;
            } else if (typeof result === 'object') {
                videoUrl = result.url || result.download_url || result.video;
            } else {
                videoUrl = apiData.url || apiData.download_url;
            }

            if (!videoUrl) throw new Error('Media link not found');

            // വേഗതയ്ക്കായി നേരിട്ട് URL അയക്കുന്നു
            await sock.sendMessage(jid, { 
                video: { url: videoUrl }, 
                mimetype: 'video/mp4', 
                caption: '*🎌 KIRA X MD INSTAGRAM DOWNLOADER 🎌*' 
            }, { quoted: msg });
            
            await sock.sendMessage(jid, { text: `✅ *Instagram media sent*`, edit: statusMsg.key });
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
        } catch (err) {
            console.error('Insta Error:', err.message);
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
            await sock.sendMessage(jid, { text: `❌ *Failed to download!*`, edit: statusMsg.key });
        }
    }
};
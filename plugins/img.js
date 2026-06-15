const axios = require('axios');

module.exports = {
    name: 'img',
    alias: ['image'],
    category: 'search',
    description: 'Search and send top 5 relevant images (Safe Search)',
    usage: `${process.env.PREFIX || '.'}img <query>`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const query = args.join(' ').trim();
        
        if (!query) return await sock.sendMessage(jid, { text: '❌ *Search term missing*' });

        await sock.sendMessage(jid, { react: { text: "🔍", key: msg.key } });

        try {
            // global.api ഉപയോഗിക്കുന്നു
            const url = `https://serpapi.com/search.json?engine=google_images&q=${encodeURIComponent(query)}&safe=active&api_key=${global.api.serp}`;
            
            const response = await axios.get(url);
            const results = response.data.images_results?.slice(0, 5) || [];
            
            if (results.length === 0) throw new Error('No images found');

            for (const item of results) {
                const imgUrl = item.original || item.thumbnail;
                
                // ഓരോ ഇമേജ് അയക്കുമ്പോഴും ചെറിയൊരു ഇടവേള (WhatsApp-ന്റെ സുരക്ഷയ്ക്ക്)
                await sock.sendMessage(jid, { 
                    image: { url: imgUrl }, 
                    caption: `✅ *Result for: ${query}*` 
                });
            }

            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error("Image search error:", err.message);
            await sock.sendMessage(jid, { text: '❌ Failed to fetch images.' }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};
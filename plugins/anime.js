// plugins/anime.js - Search anime info from MyAnimeList (no API key required)
const axios = require('axios');

module.exports = {
    name: 'anime',
    alias: ['searchanime'],
    category: 'anime',
    description: 'Search anime info from MyAnimeList',
    usage: `${process.env.PREFIX || '.'}anime <anime name>`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const query = (args && Array.isArray(args) ? args.join(' ') : '').trim();

        if (!query) {
            await sock.sendMessage(jid, { text: `*📺 ANIME SEARCH*\n\n❌ *Missing anime name*\n➤ Example: ${process.env.PREFIX || '.'}anime Naruto` }, { quoted: msg });
            return;
        }

        // Loading reaction
        await sock.sendMessage(jid, { react: { text: "⏳", key: msg.key } });

        try {
            // Search anime using Jikan API (no API key needed)
            const searchUrl = `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&sfw&limit=1`;
            const response = await axios.get(searchUrl);
            const animeList = response.data.data;

            if (!animeList || animeList.length === 0) {
                await sock.sendMessage(jid, { text: `*📺 ANIME SEARCH*\n\n❌ *No anime found* for "*${query}*".\n➤ Try checking the spelling or use a different keyword.` });
                await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
                return;
            }

            const anime = animeList[0];

            // Build premium anime info response
            const title = anime.title || 'Unknown';
            const englishTitle = anime.title_english || 'N/A';
            const episodes = anime.episodes || 'Unknown';
            const status = anime.status || 'Unknown';
            const score = anime.score || 'N/A';
            const ranked = anime.rank || 'N/A';
            const popularity = anime.popularity || 'N/A';
            const members = anime.members ? anime.members.toLocaleString() : 'N/A';
            const genres = anime.genres ? anime.genres.map(g => g.name).join(', ') : 'N/A';
            const synopsis = anime.synopsis ? anime.synopsis.substring(0, 350) + '...' : 'No synopsis available.';
            const url = anime.url || 'https://myanimelist.net';

            const premiumMessage = `🎌 *ANIME INFO* 🎌

📖 *Title* : ${title}
🌐 *English Title* : ${englishTitle}
📺 *Episodes* : ${episodes}
⚡ *Status* : ${status}
⭐ *Score* : ${score} / 10
🎖️ *Ranked* : #${ranked}
🔥 *Popularity* : #${popularity}
👥 *Members* : ${members}
🎭 *Genres* : ${genres}

📝 *Synopsis* :
${synopsis}

🔗 *MAL Link* : ${url}

━━━━━━━━━━━━━━━━━━━
🔹 *Powered by KIRA X MD* 🔹`;

            await sock.sendMessage(jid, { text: premiumMessage });
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });

        } catch (error) {
            console.error('Anime search error:', error);
            await sock.sendMessage(jid, { text: `*📺 ANIME SEARCH*\n\n❌  : ${error.message}\n➤ *Please try again later.*` });
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};
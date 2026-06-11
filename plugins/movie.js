// plugins/movie.js - KIRA X MD (Using Official OMDb API)
const axios = require('axios');

module.exports = {
    name: 'movie',
    alias: ['film', 'cinema'],
    category: 'search',
    description: 'Get detailed info about any movie',
    usage: `${process.env.PREFIX || '.'}movie <movie name>`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const query = (args && Array.isArray(args) ? args.join(' ') : '').trim();

        if (!query) {
            await sock.sendMessage(jid, { text: `🎬 *MOVIE SEARCH*\n\n❌ *Missing movie name*\n➤ Example: ${process.env.PREFIX || '.'}movie Inception` }, { quoted: msg });
            return;
        }

        await sock.sendMessage(jid, { react: { text: "🎬", key: msg.key } });
        const statusMsg = await sock.sendMessage(jid, { text: `🔍 *Searching for* : "${query}"...` });

        try {
            const apiKey = process.env.OMDB_API_KEY;
            if (!apiKey) throw new Error("OMDB_API_KEY not found in environment variables");

            const url = `http://www.omdbapi.com/?apikey=${apiKey}&t=${encodeURIComponent(query)}&plot=full`;
            const response = await axios.get(url);
            const movie = response.data;

            if (movie.Response === "False") {
                throw new Error(movie.Error || "Movie not found");
            }

            const title = movie.Title || 'Unknown';
            const year = movie.Year || 'Unknown';
            const rated = movie.Rated || 'N/A';
            const released = movie.Released || 'Unknown';
            const runtime = movie.Runtime || 'Unknown';
            const genre = movie.Genre || 'Unknown';
            const director = movie.Director || 'Unknown';
            const writer = movie.Writer || 'Unknown';
            const actors = movie.Actors || 'Unknown';
            const plot = movie.Plot || 'No synopsis available.';
            const language = movie.Language || 'Unknown';
            const country = movie.Country || 'Unknown';
            const awards = movie.Awards || 'N/A';
            const imdbRating = movie.imdbRating || 'N/A';
            const imdbId = movie.imdbID || '';
            const poster = movie.Poster !== 'N/A' ? movie.Poster : 'Not available';
            const boxOffice = movie.BoxOffice || 'N/A';
            const production = movie.Production || 'N/A';

            const responseText = `🎬 *MOVIE INFO* 🎬

📖 *Title* : ${title} (${year})
⭐ *IMDb Rating* : ${imdbRating}/10
🎭 *Genres* : ${genre}
⏱️ *Runtime* : ${runtime}
🎬 *Director* : ${director}
✍️ *Writer* : ${writer}
👥 *Cast* : ${actors}
📅 *Release Date* : ${released}
🗣️ *Language* : ${language}
🌍 *Country* : ${country}
🏆 *Awards* : ${awards}
💰 *Box Office* : ${boxOffice}
🏭 *Production* : ${production}

📝 *Plot* :
${plot.length > 350 ? plot.substring(0, 350) + '...' : plot}

🔗 *IMDb* : https://www.imdb.com/title/${imdbId}
🖼️ *Poster* : ${poster}

━━━━━━━━━━━━━━━━━━━
🔹 *KIRA X MD* 🔹`;

            await sock.sendMessage(jid, { text: responseText, edit: statusMsg.key });
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });

        } catch (err) {
            console.error("Movie error:", err);
            await sock.sendMessage(jid, { text: `❌ *Error* : ${err.message}`, edit: statusMsg.key });
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};
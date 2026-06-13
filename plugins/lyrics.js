const Genius = require('genius-lyrics');
const Client = new Genius.Client(process.env.GENIUS_API_KEY); 

module.exports = {
    name: 'lyrics',
    alias: ['lyric', 'songlyrics'],
    category: 'search',
    description: 'Get lyrics for a song',
    usage: `${process.env.PREFIX || '.'}lyrics <song name>`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const query = (args && Array.isArray(args) ? args.join(' ') : '').trim();

        if (!query) {
            return await sock.sendMessage(jid, { 
                text: `╭──『 🎤 *KIRA LYRICS* 』──⊷\n│ ❌ *Song name missing*\n╰──────────────⊷` 
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: "🎤", key: msg.key } });
        const statusMsg = await sock.sendMessage(jid, { text: `🔍 *Searching for:* ${query}...` });

        try {
            const searches = await Client.songs.search(query);
            if (!searches || searches.length === 0) throw new Error('No results');

            const song = searches[0];
            const lyrics = await song.lyrics();

            let cleanLyrics = lyrics.replace(/.*Contributors.*/g, '')
                                    .replace(/.*Lyrics.*/g, '')
                                    .replace(/.*Embed.*/g, '')
                                    .trim();

            let lyricsText = cleanLyrics.length > 3500 ? cleanLyrics.substring(0, 3500) + '\n\n... (truncated)' : cleanLyrics;

            // പ്രീമിയം ലുക്ക് (ഫൂട്ടർ ഒഴിവാക്കി)
            const responseText = `╭──『 🎶 *KIRA LYRICS* 』──⊷\n` +
                                 `│\n` +
                                 `│ 🎵 *Title :* ${song.title}\n` +
                                 `│ 👤 *Artist :* ${song.artist.name}\n` +
                                 `│\n` +
                                 `╰──────────────⊷\n\n` +
                                 `╔══════════════════════╗\n` +
                                 `   ${lyricsText.trim().split('\n').join('\n   ')}\n` +
                                 `╚══════════════════════╝`;

            await sock.sendMessage(jid, { text: responseText, edit: statusMsg.key });
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
            
        } catch (err) {
            await sock.sendMessage(jid, { text: `❌ *Lyrics not found for:* "${query}"`, edit: statusMsg.key });
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        }
    }
};
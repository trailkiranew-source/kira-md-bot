const axios = require('axios');

module.exports = {
    name: 'lyrics',
    alias: ['lyric', 'l'],
    category: 'media',
    description: 'Get lyrics of any song',
    usage: `${process.env.PREFIX || '.'}lyrics <song name>`,
    
    execute: async (sock, msg, args) => {
        const jid = msg.key.remoteJid;
        const query = args.join(' ');

        if (!query) {
            await sock.sendMessage(jid, { 
                text: `❌ *KIRA X MD* | Lyrics Error\n\nPlease provide a song name.\nExample: *${process.env.PREFIX || '.'}lyrics Past Lives*`,
                edit: msg.key // optional
            }, { quoted: msg });
            return;
        }

        // Send a temporary "searching" message
        const searchingMsg = await sock.sendMessage(jid, { 
            text: `🔍 *KIRA X MD* | Searching lyrics for "*${query}*"...` 
        });

        try {
            // First try LRCLIB (most accurate plain lyrics)
            let lyricsResult = await fetchFromLRCLIB(query);
            
            // Fallback to Genius API if LRCLIB fails or returns empty
            if (!lyricsResult || !lyricsResult.lyrics) {
                lyricsResult = await fetchFromGenius(query);
            }

            if (!lyricsResult || !lyricsResult.lyrics) {
                // Edit the searching message to error
                await sock.sendMessage(jid, { 
                    text: `❌ *KIRA X MD* | No lyrics found\n\nCould not find lyrics for "*${query}*". Try a different song name.`,
                    edit: searchingMsg.key
                });
                return;
            }

            const { title, artist, lyrics, albumArt } = lyricsResult;

            // Format the lyrics with premium style
            let formattedLyrics = formatLyrics(title, artist, lyrics);

            // Send the lyrics (split if too long)
            await sendLongMessage(sock, jid, formattedLyrics, searchingMsg.key, albumArt);

        } catch (error) {
            console.error('Lyrics command error:', error);
            await sock.sendMessage(jid, { 
                text: `⚠️ *KIRA X MD* | API Error\n\nLyrics service is temporarily unavailable. Please try again later.`,
                edit: searchingMsg.key
            });
        }
    }
};

// ---------- LRCLIB API (fast, open source) ----------
async function fetchFromLRCLIB(query) {
    try {
        const url = `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;
        const response = await axios.get(url, { timeout: 8000 });
        const data = response.data;

        if (!data || data.length === 0) return null;

        // Pick first result with plain lyrics
        const track = data.find(t => t.plainLyrics) || data[0];
        if (!track.plainLyrics) return null;

        return {
            title: track.trackName,
            artist: track.artistName,
            lyrics: track.plainLyrics,
            albumArt: track.albumArt || null
        };
    } catch (e) {
        return null;
    }
}

// ---------- Genius API Fallback (requires token) ----------
async function fetchFromGenius(query) {
    const GENIUS_TOKEN = process.env.GENIUS_API_TOKEN; // add to .env
    if (!GENIUS_TOKEN) return null;

    try {
        // Search Genius
        const searchUrl = `https://api.genius.com/search?q=${encodeURIComponent(query)}`;
        const searchRes = await axios.get(searchUrl, {
            headers: { Authorization: `Bearer ${GENIUS_TOKEN}` },
            timeout: 8000
        });

        const hits = searchRes.data.response.hits;
        if (!hits.length) return null;

        const songPath = hits[0].result.path;
        const songUrl = `https://genius.com${songPath}`;
        
        // Scrape lyrics (simplified – best to use a lyrics scraper like genius-lyrics)
        // For production, use a dedicated package: npm install genius-lyrics
        // But here's a quick fetch + regex (not perfect, but works for many songs)
        const pageRes = await axios.get(songUrl);
        const html = pageRes.data;
        const match = html.match(/<div[^>]*data-lyrics-container="true"[^>]*>([\s\S]*?)<\/div>/i);
        if (!match) return null;

        let lyrics = match[1].replace(/<[^>]*>/g, '\n').replace(/&quot;/g, '"').trim();
        
        return {
            title: hits[0].result.title,
            artist: hits[0].result.primary_artist.name,
            lyrics: lyrics,
            albumArt: hits[0].result.song_art_image_url
        };
    } catch (e) {
        return null;
    }
}

// ---------- Premium text formatting ----------
function formatLyrics(title, artist, lyrics) {
    const border = '═'.repeat(40);
    const top = `╔${border}╗`;
    const bottom = `╚${border}╝`;
    
    // Limit lyrics to 3800 chars to stay within WhatsApp limits (split later)
    let trimmedLyrics = lyrics.length > 3800 ? lyrics.substring(0, 3800) + '\n\n... (lyrics truncated)' : lyrics;
    
    return `*🎵 KIRA X MD LYRICS 🎵*\n\n` +
           `╔════════════════════════════════════╗\n` +
           `*📌 Title:* ${title}\n` +
           `*👤 Artist:* ${artist}\n` +
           `╚════════════════════════════════════╝\n\n` +
           `*✍️ Lyrics:*\n\`\`\`\n${trimmedLyrics}\n\`\`\`\n\n` +
           `🔹 *Powered by KIRA X MD* 🔹`;
}

// ---------- Send long message with editing ----------
async function sendLongMessage(sock, jid, formattedText, editKey, albumArtUrl = null) {
    // WhatsApp max text length ~ 65536, but safe limit 4000 per message
    const MAX_LEN = 4000;
    
    if (formattedText.length <= MAX_LEN) {
        // Edit the original "searching" message to final lyrics
        await sock.sendMessage(jid, { text: formattedText, edit: editKey });
    } else {
        // Split into chunks
        const chunks = splitMessage(formattedText, MAX_LEN);
        // Replace the searching message with first chunk
        await sock.sendMessage(jid, { text: chunks[0], edit: editKey });
        // Send remaining chunks as new messages (no edit)
        for (let i = 1; i < chunks.length; i++) {
            await sock.sendMessage(jid, { text: chunks[i] });
        }
    }

    // Optional: Send album art as image if available and you want
    if (albumArtUrl && process.env.SEND_ALBUM_ART === 'true') {
        try {
            await sock.sendMessage(jid, { 
                image: { url: albumArtUrl }, 
                caption: '🎨 *Album Art*' 
            });
        } catch (e) {}
    }
}

function splitMessage(text, maxLen) {
    const chunks = [];
    let current = '';
    const lines = text.split('\n');
    for (const line of lines) {
        if ((current + line).length > maxLen) {
            chunks.push(current);
            current = line + '\n';
        } else {
            current += line + '\n';
        }
    }
    if (current) chunks.push(current);
    return chunks;
}
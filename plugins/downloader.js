const axios = require('axios');

module.exports = {
    name: 'download',
    // 💡 ഇവിടെ കൊടുത്ത ഏത് പേര് അടിച്ചാലും ഈ പ്ലഗിൻ വർക്ക് ആവും!
    alias: ['dl', 'ig', 'insta', 'fb', 'facebook', 'yt', 'ytv', 'youtube', 'threads', 'tw', 'twitter', 'x'],
    category: 'downloader',
    description: 'All-in-one downloader for IG, FB, YT, Threads, and X/Twitter',
    usage: '.dl <URL> (or reply to a link)',

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        let url = (args || []).join(' ').trim();

        const contextInfo = msg.message?.extendedTextMessage?.contextInfo ||
                            msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo ||
                            msg.message?.viewOnceMessage?.message?.extendedTextMessage?.contextInfo;
        const quoted = contextInfo?.quotedMessage;

        // 1. റിപ്ലൈ ചെയ്ത മെസ്സേജിൽ നിന്ന് ലിങ്ക് എടുക്കാൻ
        if (!url && quoted) {
            const rawText = quoted.conversation || quoted.extendedTextMessage?.text || 
                            quoted.imageMessage?.caption || quoted.videoMessage?.caption || 
                            quoted.documentMessage?.caption || '';
            const match = rawText.match(/https?:\/\/[^\s]+/gi);
            if (match) url = match[0];
        }

        if (!url || !url.startsWith('http')) {
            return await sock.sendMessage(jid, { 
                text: '❌ *Please provide a valid link!*\n(IG, FB, YT, Threads, or X)' 
            }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: '⏳', key: msg.key } });

        try {
            let mediaUrl = null;
            let mediaType = 'video'; // Default
            let caption = '*🎌 KIRA X MD DOWNLOADER 🎌*';

            // =========================================
            // 1. INSTAGRAM
            // =========================================
            if (url.includes('instagram.com')) {
                const apis = [
                    `https://api-aswin-sparky.koyeb.app/api/downloader/instagram?url=${encodeURIComponent(url)}`,
                    `https://jerrycoder.oggyapi.workers.dev/down/insta?url=${encodeURIComponent(url)}`,
                    `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`
                ];
                for (const api of apis) {
                    try {
                        const { data } = await axios.get(api, { timeout: 15000 });
                        mediaType = data?.data?.type || data?.result?.type || 'video';
                        mediaUrl = data?.result?.url || data?.result?.video || data?.data?.url || data?.data?.video || data?.url;
                        if (mediaUrl) break;
                    } catch (e) { continue; }
                }
            } 
            // =========================================
            // 2. YOUTUBE (Merged YT & YTV)
            // =========================================
            else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                const apis = [
                    `https://jerrycoder.oggyapi.workers.dev/down/ytmp4-v1?url=${encodeURIComponent(url)}`,
                    `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`,
                    `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`,
                    `https://eliteprotech-apis.zone.id/ytmp4?url=${encodeURIComponent(url)}`
                ];
                for (const api of apis) {
                    try {
                        const { data } = await axios.get(api, { timeout: 15000 });
                        mediaUrl = data?.data?.dl || data?.data?.url || data?.result?.download_url || data?.result?.url || data?.result?.video || data?.result?.hd || data?.url;
                        if (typeof data?.result === 'string') mediaUrl = data.result;
                        
                        if (mediaUrl) {
                            // ലിങ്ക് കറക്റ്റ് ആണോ എന്ന് ചെക്ക് ചെയ്യുന്നു
                            const check = await axios.head(mediaUrl, { timeout: 5000, validateStatus: () => true });
                            if (check.status === 200) break;
                            mediaUrl = null; 
                        }
                    } catch (e) { continue; }
                }
            }
            // =========================================
            // 3. FACEBOOK
            // =========================================
            else if (url.includes('facebook.com') || url.includes('fb.watch') || url.includes('fb.gg')) {
                const api = `https://api-aswin-sparky.koyeb.app/api/downloader/fbdl?url=${encodeURIComponent(url)}`;
                const { data: resData } = await axios.get(api, { timeout: 20000 });
                const data = resData?.data || resData?.result || resData;
                mediaUrl = data?.high || data?.hd || data?.sd || data?.video || data?.url;
            }
            // =========================================
            // 4. THREADS
            // =========================================
            else if (url.includes('threads.net')) {
                const api = `https://api-aswin-sparky.koyeb.app/api/downloader/threads?url=${encodeURIComponent(url)}`;
                const { data } = await axios.get(api, { timeout: 15000 });
                mediaUrl = data?.result?.video_url || data?.data?.url;
            }
            // =========================================
            // 5. TWITTER / X (New Backup API)
            // =========================================
            else if (url.includes('twitter.com') || url.includes('x.com')) {
                const api = `https://eliteprotech-apis.zone.id/x?url=${encodeURIComponent(url)}`;
                const { data } = await axios.get(api, { timeout: 15000 });
                mediaUrl = data?.result?.video_url || data?.data?.url || data?.result?.hd || data?.url || data?.hd || data?.result?.media?.[0]?.url;
            } 
            // =========================================
            // UNKNOWN LINK
            // =========================================
            else {
                return await sock.sendMessage(jid, { 
                    text: '❌ *Unsupported link!*\nPlease send a valid IG, FB, YT, Threads, or X/Twitter link.' 
                }, { quoted: msg });
            }

            if (!mediaUrl) throw new Error('Could not fetch media URL from APIs');

            // ഫോട്ടോയാണോ വീഡിയോയാണോ എന്ന് തീരുമാനിക്കുന്നു (For Instagram mainly)
            const messageType = mediaType.toLowerCase() === 'image' ? 'image' : 'video';

            // ഫൈനൽ ഔട്ട്പുട്ട് അയക്കുന്നു
            await sock.sendMessage(jid, { 
                [messageType]: { url: mediaUrl }, 
                caption: caption 
            }, { quoted: msg });
            
            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });

        } catch (err) {
            console.error('All-in-One Downloader Error:', err.message);
            await sock.sendMessage(jid, { 
                text: `❌ *Download Failed!*\n(Make sure the account is public and the link is valid)` 
            }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
        }
    }
};
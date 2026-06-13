const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'insta',
    alias: ['ig', 'instagram', 'reel'],
    category: 'downloader',
    description: 'Download Instagram videos/reels',
    usage: `${process.env.PREFIX || '.'}insta <URL>`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        
        let url = (args && Array.isArray(args) ? args.join(' ') : '').trim();
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        
        // ലിങ്ക് എടുക്കാൻ കുറച്ചുകൂടി ഡീപ്പായി സ്കാൻ ചെയ്യുന്നു
        if (!url && quoted) {
            const getRawText = (q) => {
                return q.conversation || 
                       q.extendedTextMessage?.text || 
                       q.imageMessage?.caption || 
                       q.videoMessage?.caption || 
                       q.buttonsMessage?.contentText || 
                       "";
            };

            let rawText = getRawText(quoted);

            // ഒരുപക്ഷേ ലിങ്ക് ഉള്ളിൽ ക്വോട്ട് ചെയ്ത മെസ്സേജിലാണെങ്കിൽ
            if (!rawText && quoted.extendedTextMessage?.contextInfo?.quotedMessage) {
                rawText = getRawText(quoted.extendedTextMessage.contextInfo.quotedMessage);
            }

            const match = rawText.match(/https?:\/\/(www\.)?instagram\.com\/\S+/);
            url = match ? match[0] : "";
        }

        if (!url || !url.includes('instagram.com')) {
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
            return await sock.sendMessage(jid, { text: "❌ *Link not found in reply. Please send the link properly or reply to a valid Instagram link!*" }, { quoted: msg });
        }

        await sock.sendMessage(jid, { react: { text: "📥", key: msg.key } });

        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        const outputPath = path.join(tempDir, `insta_${Date.now()}.mp4`);

        const ytDlpPath = path.join(__dirname, '../yt-dlp.exe');
        const cookiePath = path.join(__dirname, '../cookies.txt');
        const cookieFlag = fs.existsSync(cookiePath) ? ` --cookies "${cookiePath}"` : '';
        
        const command = `"${ytDlpPath}" -f "best[ext=mp4]" -o "${outputPath}" "${url}"${cookieFlag}`;

        try {
            await execPromise(command, { timeout: 120000 });
            
            if (!fs.existsSync(outputPath)) throw new Error("Download failed");

            await sock.sendMessage(jid, { 
                video: fs.readFileSync(outputPath), 
                mimetype: 'video/mp4', 
                caption: '*🎌 KIRA INSTA DOWNLOADER 🎌*' 
            }, { quoted: msg });
            
            await sock.sendMessage(jid, { react: { text: "✅", key: msg.key } });
        } catch (err) {
            console.error("Insta Error:", err);
            await sock.sendMessage(jid, { text: "❌ *Download failed!*" }, { quoted: msg });
            await sock.sendMessage(jid, { react: { text: "❌", key: msg.key } });
        } finally {
            if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        }
    }
};
// play.js - KIRA X MD (Clean + Bold Text)
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'play',
    alias: ['song', 'music', 'audio'],
    execute: async (sock, msg, args) => {
        const jid = msg.key.remoteJid;
        const query = args.join(' ');

        if (!query) {
            await sock.sendMessage(jid, { text: `*KIRA Error* : Missing song name.\nExample: .play Believer` }, { quoted: msg });
            return;
        }

        // First status: Searching (bold)
        const statusMsg = await sock.sendMessage(jid, { text: `*KIRA Searching* : ${query}...` });

        try {
            const { title, duration, audioBuffer } = await downloadAndGetAudio(query);

            // Second status: Downloading (bold)
            await sock.sendMessage(jid, { text: `*KIRA downloading* : ${title} (${duration})...`, edit: statusMsg.key });

            // Send audio with bold watermark caption
            await sock.sendMessage(jid, {
                audio: audioBuffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `${title.slice(0, 40)}.mp3`,
                caption: `*KIRA X MD*`
            });

        } catch (error) {
            console.error(error);
            await sock.sendMessage(jid, { text: `*KIRA Error* : ${error.message}`, edit: statusMsg.key });
        }
    }
};

async function downloadAndGetAudio(searchQuery) {
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const outputPath = path.join(tempDir, `${Date.now()}.mp3`);

    const ytDlpPath = path.join(__dirname, '../yt-dlp.exe');
    
    // Get song info via JSON
    const infoCommand = `"${ytDlpPath}" "ytsearch1:${searchQuery}" --dump-json --no-playlist`;
    let title, duration;
    try {
        const { stdout } = await execPromise(infoCommand, { timeout: 30000 });
        const info = JSON.parse(stdout);
        title = info.title;
        duration = formatDuration(info.duration);
    } catch (err) {
        throw new Error('Failed to get song info: ' + err.message);
    }
    
    // Download audio
    const downloadCommand = `"${ytDlpPath}" "ytsearch1:${searchQuery}" -f bestaudio --extract-audio --audio-format mp3 --audio-quality 0 --no-playlist -o "${outputPath}"`;
    await execPromise(downloadCommand, { timeout: 120000 });
    
    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 10000) {
        throw new Error('Download failed');
    }
    
    const audioBuffer = fs.readFileSync(outputPath);
    fs.unlinkSync(outputPath);
    
    return { title, duration, audioBuffer };
}

function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
const axios = require('axios');

module.exports = {
    name: 'insta',
    alias: ['ig', 'igdl', 'instagram', 'reel'],
    category: 'downloader',
    description: 'Download Instagram reels/videos',
    usage: '.insta <url>',

    async execute(sock, msg, args) {

        const jid = msg.key.remoteJid;
        let url = (args || []).join(' ').trim();

        try {

            // Reply message detect
            const contextInfo =
                msg.message?.extendedTextMessage?.contextInfo ||
                msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo ||
                msg.message?.viewOnceMessage?.message?.extendedTextMessage?.contextInfo;

            const quoted = contextInfo?.quotedMessage;

            // URL args-il illenkil reply-il ninn edukkuka
            if (!url && quoted) {

                const rawText =
                    quoted.conversation ||
                    quoted.extendedTextMessage?.text ||
                    quoted.imageMessage?.caption ||
                    quoted.videoMessage?.caption ||
                    '';

                console.log('REPLY TEXT:', rawText);

                const urls = rawText.match(/https?:\/\/[^\s]+/g);

                if (urls && urls.length) {
                    url = urls[0];
                }
            }

            console.log('FINAL URL:', url);

            if (
                !url ||
                typeof url !== 'string' ||
                !url.includes('instagram.com')
            ) {
                return await sock.sendMessage(
                    jid,
                    {
                        text: '❌ *Please provide a valid Instagram URL or reply to a message containing an Instagram link!*'
                    },
                    { quoted: msg }
                );
            }

            await sock.sendMessage(jid, {
                react: { text: '📥', key: msg.key }
            });

            const apis = [
                `https://jerrycoder.oggyapi.workers.dev/down/insta?url=${encodeURIComponent(url)}`,
                `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`
            ];

            let videoUrl = null;

            for (const api of apis) {

                try {

                    console.log('Trying:', api);

                    const res = await axios.get(api, {
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0'
                        }
                    });

                    console.log(
                        'RAW RESPONSE:',
                        JSON.stringify(res.data, null, 2)
                    );

                    const data = res.data;

                    videoUrl =
                        data?.result?.url ||
                        data?.result?.video ||
                        data?.data?.url ||
                        data?.data?.video ||
                        data?.url;

                    if (videoUrl && videoUrl.startsWith('http')) {
                        break;
                    }

                } catch (e) {
                    console.log('API ERROR:', e.message);
                }
            }

            if (!videoUrl) {
                throw new Error('Video URL not found');
            }

            await sock.sendMessage(
    jid,
    {
        video: { url: videoUrl }
    },
    { quoted: msg }
);

            await sock.sendMessage(jid, {
                react: { text: '✅', key: msg.key }
            });

        } catch (err) {

            console.error(err);

            await sock.sendMessage(
                jid,
                {
                    text: `❌ Error: ${err.message}`
                },
                { quoted: msg }
            );

            await sock.sendMessage(jid, {
                react: { text: '❌', key: msg.key }
            });
        }
    }
};
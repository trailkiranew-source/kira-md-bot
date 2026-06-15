const axios = require('axios');

module.exports = {
    name: 'fb',
    alias: ['facebook', 'fbdl'],
    category: 'downloader',
    description: 'Download Facebook videos',
    usage: '.fb <url>',

    async execute(sock, msg, args) {

        const jid = msg.key.remoteJid;
        let url = (args || []).join(' ').trim();

        try {

            const contextInfo =
                msg.message?.extendedTextMessage?.contextInfo ||
                msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo;

            const quoted = contextInfo?.quotedMessage;

            // Reply message-il ninn URL edukkuka
            if (!url && quoted) {

                const text =
                    quoted?.conversation ||
                    quoted?.extendedTextMessage?.text ||
                    quoted?.imageMessage?.caption ||
                    quoted?.videoMessage?.caption ||
                    quoted?.documentMessage?.caption ||
                    '';

                console.log('QUOTED TEXT:', text);

                const match = text.match(/https?:\/\/[^\s]+/gi);

                if (match) {
                    url = match[0];
                }
            }

            console.log('FINAL URL:', url);

            if (
                !url ||
                !(
                    url.includes('facebook.com') ||
                    url.includes('fb.watch') ||
                    url.includes('fb.gg')
                )
            ) {
                return await sock.sendMessage(
                    jid,
                    {
                        text: '❌ *Please provide a valid Facebook URL or reply to a Facebook link!*'
                    },
                    { quoted: msg }
                );
            }

            await sock.sendMessage(jid, {
                react: {
                    text: '📥',
                    key: msg.key
                }
            });

            const api =
                `https://api-aswin-sparky.koyeb.app/api/downloader/fbdl?url=${encodeURIComponent(url)}`;

            const res = await axios.get(api, {
                timeout: 20000,
                headers: {
                    'User-Agent': 'Mozilla/5.0'
                }
            });

            console.log(
                'FB RESPONSE:',
                JSON.stringify(res.data, null, 2)
            );

            const data = res.data?.data || res.data?.result || res.data;

            const videoUrl =
                data?.high ||
                data?.hd ||
                data?.sd ||
                data?.video ||
                data?.url;

            if (!videoUrl) {
                throw new Error('Video URL not found');
            }

            await sock.sendMessage(
                jid,
                {
                    video: { url: videoUrl },
                    mimetype: 'video/mp4'
                },
                { quoted: msg }
            );

            await sock.sendMessage(jid, {
                react: {
                    text: '✅',
                    key: msg.key
                }
            });

        } catch (err) {

            console.error('FB ERROR:', err);

            await sock.sendMessage(
                jid,
                {
                    text: `❌ ${err.message}`
                },
                { quoted: msg }
            );

            await sock.sendMessage(jid, {
                react: {
                    text: '❌',
                    key: msg.key
                }
            });
        }
    }
};
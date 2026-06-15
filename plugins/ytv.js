const axios = require('axios');

module.exports = {
    name: 'ytv',
    alias: ['ytvideo'],
    category: 'downloader',
    description: 'Download YouTube video',
    usage: '.ytv <url>',

    async execute(sock, msg, args) {

        const jid = msg.key.remoteJid;
        let url = (args || []).join(' ').trim();

        try {

            const contextInfo =
                msg.message?.extendedTextMessage?.contextInfo ||
                msg.message?.ephemeralMessage?.message?.extendedTextMessage?.contextInfo;

            const quoted = contextInfo?.quotedMessage;

            // Reply support
            if (!url && quoted) {

                const rawText =
                    quoted?.conversation ||
                    quoted?.extendedTextMessage?.text ||
                    quoted?.imageMessage?.caption ||
                    quoted?.videoMessage?.caption ||
                    '';

                console.log('REPLY TEXT:', rawText);

                const match = rawText.match(
                    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s]+/i
                );

                if (match) {
                    url = match[0];
                }
            }

            console.log('FINAL URL:', url);

            if (
                !url ||
                !(
                    url.includes('youtube.com') ||
                    url.includes('youtu.be')
                )
            ) {
                return await sock.sendMessage(
                    jid,
                    {
                        text: '❌ *Please provide a valid YouTube URL or reply to a YouTube link!*'
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

            const apis = [
                `https://jerrycoder.oggyapi.workers.dev/down/ytmp4-v1?url=${encodeURIComponent(url)}`,
                `https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(url)}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`,
                `https://eliteprotech-apis.zone.id/ytmp4?url=${encodeURIComponent(url)}`
            ];

            let videoUrl = null;

            for (const api of apis) {

                try {

                    console.log('Trying API:', api);

                    const res = await axios.get(api, {
                        timeout: 15000,
                        headers: {
                            'User-Agent': 'Mozilla/5.0',
                            'Referer': 'https://www.youtube.com/'
                        }
                    });

                    console.log(
                        'RAW RESPONSE:',
                        JSON.stringify(res.data, null, 2)
                    );

                    const data = res.data;

                    const tempUrl =
                        data?.data?.dl ||
                        data?.data?.url ||
                        data?.url ||
                        data?.result?.download_url ||
                        data?.result?.url ||
                        data?.result?.video ||
                        data?.result?.hd ||
                        (typeof data?.result === 'string'
                            ? data.result
                            : null);

                    if (
                        tempUrl &&
                        typeof tempUrl === 'string' &&
                        tempUrl.startsWith('http')
                    ) {

                        try {

                            const check = await axios.head(
                                tempUrl,
                                {
                                    timeout: 5000,
                                    validateStatus: () => true
                                }
                            );

                            console.log(
                                'URL STATUS:',
                                check.status
                            );

                            if (check.status === 200) {
                                videoUrl = tempUrl;
                                break;
                            }

                        } catch (e) {
                            console.log(
                                'Validation Failed:',
                                e.message
                            );
                        }
                    }

                } catch (e) {
                    console.log(
                        'API Failed:',
                        e.message
                    );
                }
            }

            if (!videoUrl) {
                throw new Error(
                    'No valid video URL found from any API'
                );
            }

            await sock.sendMessage(
                jid,
                {
                    video: {
                        url: videoUrl
                    },
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

            console.error(
                'YTV ERROR:',
                err
            );

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
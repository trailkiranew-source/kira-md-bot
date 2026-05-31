const { getBuffer } = require("../lib/functions");

module.exports = {
    name: "testmedia",
    category: "dev",

    async execute(sock, msg) {

        const quoted =
            msg.message?.extendedTextMessage?.contextInfo;

        if (!quoted?.quotedMessage) {
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: "Reply to an image."
                }
            );
        }

        try {

            const mediaMsg = {
                key: {
                    remoteJid: msg.key.remoteJid
                },
                message: quoted.quotedMessage
            };

            const buffer = await getBuffer(mediaMsg);

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: `✅ Downloaded Successfully\nSize: ${buffer.length} bytes`
                }
            );

        } catch (e) {

            console.log(e);

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: "❌ Download Failed"
                }
            );
        }
    }
};
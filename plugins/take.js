const { Sticker } = require("wa-sticker-formatter");
const sharp = require("sharp");
const { getBuffer } = require("../lib/functions");
const config = require("../config");

module.exports = {
    name: "take",
    category: "sticker",
    desc: "Take sticker with your packname",

    async execute(sock, msg) {

        const quoted =
            msg.message?.extendedTextMessage?.contextInfo;

        if (!quoted?.quotedMessage?.stickerMessage) {
            return sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: "❌ Reply to a sticker."
                }
            );
        }

        try {

            const status = await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: "⚡ Taking sticker..."
                }
            );

            const mediaMsg = {
                key: {
                    remoteJid: msg.key.remoteJid
                },
                message: quoted.quotedMessage
            };

            const buffer = await getBuffer(mediaMsg);

            // Convert webp sticker -> png
            const pngBuffer = await sharp(buffer)
                .png()
                .toBuffer();

            const sticker = new Sticker(pngBuffer, {
                pack: config.PACKNAME,
                author: config.AUTHOR,
                type: "full",
                quality: 100
            });

            const stickerBuffer =
                await sticker.toBuffer();

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    sticker: stickerBuffer
                }
            );

            await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: "✅ Sticker Taken",
                    edit: status.key
                }
            );

       } catch (err) {

    console.error("TAKE ERROR:");
    console.error(err);
    console.error(err?.stack);

    await sock.sendMessage(
                msg.key.remoteJid,
                {
                    text: "❌ Failed to take sticker."
                }
            );
        }
    }
};
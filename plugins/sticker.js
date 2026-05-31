const { downloadMediaMessage } = require("@whiskeysockets/baileys");
const sharp = require("sharp");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const path = require("path");

module.exports = {
  name: "sticker",
  alias: ["s", "stik"],
  category: "sticker",
  desc: "Convert image/video to sticker",

  async execute(sock, msg) {
    const jid = msg.key.remoteJid;

    const quotedMsg = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedInfo = msg.message?.extendedTextMessage?.contextInfo;

    if (!quotedMsg || !quotedInfo) {
      return sock.sendMessage(jid, {
        text: "❌ Reply to image/video"
      }, { quoted: msg });
    }

    const isImage = !!quotedMsg.imageMessage;
    const isVideo = !!quotedMsg.videoMessage;

    if (!isImage && !isVideo) {
      return sock.sendMessage(jid, {
        text: "❌ Only image/video allowed"
      }, { quoted: msg });
    }

    const status = await sock.sendMessage(jid, { text: "⚡ Creating sticker..." });

    try {
      // 🔥 FIX: pass full message context
      const buffer = await downloadMediaMessage(
        { message: quotedMsg },
        "buffer",
        {},
        {
          logger: console,
          reuploadRequest: sock.updateMediaMessage
        }
      );

      const tempDir = path.join(__dirname, "../temp");
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const input = path.join(tempDir, `in_${Date.now()}.jpg`);
      const output = path.join(tempDir, `out_${Date.now()}.webp`);

      fs.writeFileSync(input, buffer);

      if (isImage) {
        await sharp(input)
          .resize(512, 512, { fit: "cover" })
          .webp({ quality: 90 })
          .toFile(output);
      } else {
        // extract frame safely
        await new Promise((resolve, reject) => {
          ffmpeg(input)
            .on("end", resolve)
            .on("error", reject)
            .screenshots({
              timestamps: ["00:00:01"],
              filename: path.basename(output),
              folder: tempDir,
              size: "512x512"
            });
        });
      }

      const sticker = fs.readFileSync(output);

      await sock.sendMessage(jid, { sticker });

      await sock.sendMessage(jid, {
        text: "✅ Sticker ready",
        edit: status.key
      });

      fs.unlinkSync(input);
      fs.unlinkSync(output);

    } catch (e) {
      console.log("Sticker error:", e);
      await sock.sendMessage(jid, {
        text: "❌ Failed to make sticker"
      });
    }
  }
};
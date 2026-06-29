const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const fs = require("fs");

module.exports = {
    name: "session",
    alias: ["getsession"],
    category: "owner",
    execute: async (sock, msg, args) => {
        const jid = msg.key.remoteJid;
        
        // നിലവിലുള്ള സെഷൻ ക്രെഡൻഷ്യൽസ് റീഡ് ചെയ്യുന്നു
        const sessionPath = "./session/creds.json";
        if (fs.existsSync(sessionPath)) {
            const credsData = fs.readFileSync(sessionPath, 'utf8');
            const sessionId = Buffer.from(credsData).toString('base64');
            
            // ഓണർക്ക് മാത്രം സെഷൻ ഐഡി അയക്കുന്നു
            await sock.sendMessage(jid, { text: "✨ *YOUR SESSION ID:*\n\n" + sessionId + "\n\n(Copy this and set in Railway Variables)" }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, { text: "❌ *Session not found! First pair your bot.*" }, { quoted: msg });
        }
    }
};
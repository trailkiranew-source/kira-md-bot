module.exports = {
    name: "owner",
    category: "owner",
    description: "Owner tools and contact",

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const cmd = args;

        // 1. Restart command
        if (cmd === "restart") {
            const sender = msg.key.fromMe ? sock.user.id.split(':') + '@s.whatsapp.net' : msg.key.participant || msg.key.remoteJid;
            const ownerNum = global.ownerNumber ? `${global.ownerNumber}@s.whatsapp.net` : null;

            if (!msg.key.fromMe && sender !== ownerNum) {
                return await sock.sendMessage(jid, { text: "❌ *Restricted to Bot Owner!*" }, { quoted: msg });
            }
            await sock.sendMessage(jid, { text: "🔄 *Restarting Bot...*" }, { quoted: msg });
            process.exit();
        } 
        
        // 2. VCard (Contact Card) command
        else {
            const vcard = 'BEGIN:VCARD\n'
                + 'VERSION:3.0\n'
                + 'FN:Madhav\n' // Name
                + 'ORG:Bot Owner\n'
                + 'TEL;type=CELL;type=VOICE;waid=919188252308:919188252308\n' // Number
                + 'END:VCARD';

            await sock.sendMessage(jid, {
                contacts: {
                    displayName: 'Madhav',
                    contacts: [{ displayName: 'Madhav', vcard }]
                }
            }, { quoted: msg });
        }
    }
};
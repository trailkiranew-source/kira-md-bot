module.exports = {
    name: 'add',
    alias: ['addmember'],
    category: 'group',
    description: 'Add a user to the group',
    
    async execute(sock, msg, args, isOwner) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) return await sock.sendMessage(jid, { text: "❌ *This command can only be used in groups!*" }, { quoted: msg });

        // 🚨 Admin Check
        const sender = msg.key.participant || msg.key.remoteJid;
        const groupMetadata = await sock.groupMetadata(jid);
        const isAdmin = groupMetadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (!isAdmin && !isOwner) {
            return await sock.sendMessage(jid, { text: "❌ *Group Admins only!*" }, { quoted: msg });
        }

        let target = args[0] ? args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net' : null;

        if (!target) return await sock.sendMessage(jid, { text: "❌ *Provide a number to add! Example: .add 919876543210*" }, { quoted: msg });

        try {
            await sock.groupParticipantsUpdate(jid, [target], "add");
            await sock.sendMessage(jid, { text: `✅ *User added successfully!*` }, { quoted: msg });
        } catch (e) {
            await sock.sendMessage(jid, { text: "❌ *Failed! User might have privacy settings enabled or bot is not admin.*" }, { quoted: msg });
        }
    }
};
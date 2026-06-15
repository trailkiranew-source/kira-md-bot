module.exports = {
    name: 'antilink',
    alias: ['alink'],
    category: 'group', // 🚨 കാറ്റഗറി മാറ്റി
    description: 'Toggle WhatsApp Anti-link',
    
    async execute(sock, msg, args, isOwner) {
        const jid = msg.key.remoteJid;
        if (!jid.endsWith('@g.us')) return await sock.sendMessage(jid, { text: "❌ *This command can only be used in groups!*" }, { quoted: msg });

        // 🚨 Admin Check 🚨
        const sender = msg.key.participant || msg.key.remoteJid;
        const groupMetadata = await sock.groupMetadata(jid);
        const isAdmin = groupMetadata.participants.some(p => p.id === sender && (p.admin === 'admin' || p.admin === 'superadmin'));

        if (!isAdmin && !isOwner) {
            return await sock.sendMessage(jid, { text: "❌ *Group Admins only!*" }, { quoted: msg });
        }

        global.antilinkChats = global.antilinkChats || [];
        const action = (args[0] || "").toLowerCase();

        if (action === "on") {
            if (!global.antilinkChats.includes(jid)) {
                global.antilinkChats.push(jid);
            }
            return sock.sendMessage(jid, { text: "✅ *WhatsApp Anti-Link Enabled!*" }, { quoted: msg });
        }

        if (action === "off") {
            global.antilinkChats = global.antilinkChats.filter(x => x !== jid);
            return sock.sendMessage(jid, { text: "❌ *WhatsApp Anti-Link Disabled!*" }, { quoted: msg });
        }

        return sock.sendMessage(jid, { 
            text: `*🔗 ANTI-LINK (WhatsApp Only)*\n\nTurn on/off WhatsApp link protection:\n\n.antilink on\n.antilink off` 
        }, { quoted: msg });
    }
};
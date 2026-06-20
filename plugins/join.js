module.exports = {
    name: "join",
    category: "owner",

    async execute(sock, msg, args, isOwner) {

        if (!isOwner) return;

        const jid = msg.key.remoteJid;

        const link = args[0];
        if (!link) {
            return sock.sendMessage(jid,{
                text:"❌ Example:\n.join https://chat.whatsapp.com/xxxx"
            });
        }

        const code = link.split("https://chat.whatsapp.com/")[1];

        await sock.groupAcceptInvite(code);

        await sock.sendMessage(jid,{
            text:"✅ Joined Group"
        });
    }
};
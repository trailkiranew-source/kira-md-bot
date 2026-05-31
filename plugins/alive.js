module.exports = {
    name: "alive",
    category: "main",
    desc: "Bot status",

    async execute(sock, msg) {

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: "*✅ KIRA X MD is Alive!*"
            }
        );

    }
};
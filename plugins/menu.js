const config = require("../config");
const { commands } = require("../lib/plugins");

module.exports = {
    name: "menu",
    category: "main",
    desc: "Show command menu",

    async execute(sock, msg) {

        let categories = {};

        commands.forEach(cmd => {
            const cat = cmd.category || "other";

            if (!categories[cat]) {
                categories[cat] = [];
            }

            categories[cat].push(cmd.name);
        });

        let menu = `
╭━━━〔 *${config.BOT_NAME}* 〕━━━⬣

┃ 👑 Owner : ${config.OWNER_NAME}
┃ ⚡ Prefix : ${config.PREFIX}
┃ 🚀 Version : ${config.VERSION}

╰━━━━━━━━━━━━━━⬣
`;

        for (const category in categories) {

            menu += `\n*${category.toUpperCase()}*\n\n`;

            categories[category].forEach(cmd => {
                menu += `➤ ${config.PREFIX}${cmd}\n`;
            });
        }

        menu += `
╭━━━━━━━━━━━━━━⬣
┃ ${config.FOOTER}
╰━━━━━━━━━━━━━━⬣`;

        await sock.sendMessage(
            msg.key.remoteJid,
            {
                text: menu
            }
        );
    }
};
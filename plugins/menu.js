module.exports = {
    name: "menu",
    alias: ["help", "commands"],
    category: "main",

    async execute(sock, msg) {

        const jid = msg.key.remoteJid;
        const pushname =
            msg.pushName || "User";

        const prefix =
            process.env.PREFIX || ".";

        const mode =
            process.env.MODE || "public";

        const uptime =
            process.uptime();

        const h =
            Math.floor(uptime / 3600);
        const m =
            Math.floor(
                (uptime % 3600) / 60
            );
        const s =
            Math.floor(uptime % 60);

        const uptimeText =
            `${h}h ${m}m ${s}s`;

        const commands =
            global.commands || [];

        const categories = {};

        for (const cmd of commands) {

            const cat =
                (cmd.category || "other")
                .toUpperCase();

            if (!categories[cat])
                categories[cat] = [];

            categories[cat].push(
                `${prefix}${cmd.name}`
            );
        }

        let menu = `
╭──────────────────────
│      K I R A   X   M D
├──────────────────────
│ USER     : ${pushname}
│ PREFIX   : ${prefix}
│ MODE     : ${mode.toUpperCase()}
│ UPTIME   : ${uptimeText}
│ PLUGINS  : ${commands.length}
╰──────────────────────
`;

        for (const category of Object.keys(categories)) {

            menu += `

┌─ ${category}
`;

            for (const cmd of categories[category]) {
                menu += `│ ${cmd}\n`;
            }

            menu += `└────────────────`;
        }

        menu += `

━━━━━━━━━━━━━━━━━━━━━━
      The Ghost In The System
━━━━━━━━━━━━━━━━━━━━━━`;

        await sock.sendMessage(
            jid,
            {
                text: menu
            },
            {
                quoted: msg
            }
        );
    }
};
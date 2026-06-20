module.exports = {
    name: 'menu',
    alias: ['help', 'commands', 'dashboard'],
    category: 'utility',
    description: 'Show premium bot dashboard',
    usage: `${process.env.PREFIX || '.'}menu`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const prefix = process.env.PREFIX || '.';
        const commands = global.commands || [];

        const userName = msg.pushName || 'User';
        const botName = process.env.BOT_NAME || 'KIRA X MD';
        const ownerName = process.env.OWNER_NAME || 'Madhav'; 
        const mode = process.env.MODE === 'private' ? '👑 Private' : '🌍 Public';
        
        // 🔄 മാറ്റം വരുത്തിയത് ഇവിടെയാണ്: "process.uptime()" ഉപയോഗിച്ച് കൃത്യമായ സമയം എടുക്കുന്നു
        const uptime = formatUptime(process.uptime() * 1000);

        const categories = {};
        for (const cmd of commands) {
            if (cmd.name === 'menu') continue;
            const cat = cmd.category || 'Utility';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd.name);
        }

        let menuText = `╭───『 *${botName.toUpperCase()}* 』───⊷\n`;
        menuText += `│ 👤 *User:* ${userName}\n`;
        menuText += `│ 👑 *Owner:* ${ownerName}\n`; 
        menuText += `│ ⚡ *Mode:* ${mode}\n`;
        menuText += `│ 🕒 *Uptime:* ${uptime}\n`;
        menuText += `│ 🤖 *Commands:* ${commands.length}\n`;
        menuText += `╰──────────────────────⊷\n\n`;

        for (const cat in categories) {
            menuText += `┌─『 *${cat.toUpperCase()}* 』──⊷\n`;
            categories[cat].forEach(cmd => {
                menuText += `│ ➢ ${prefix}${cmd}\n`;
            });
            menuText += `└───────────────────⊷\n\n`;
        }

        menuText += `\n*© Powered by KIRA X MD*`;

        const menuImage = 'https://i.ibb.co/FkYcVmw5/temp.jpg';

        await sock.sendMessage(jid, { 
            image: { url: menuImage }, 
            caption: menuText 
        }, { quoted: msg });
    }
};

function formatUptime(ms) {
    let s = Math.floor(ms / 1000);
    let m = Math.floor(s / 60);
    let h = Math.floor(m / 60);
    let d = Math.floor(h / 24);
    h %= 24; m %= 60; s %= 60;
    let uptime = "";
    if (d > 0) uptime += `${d}d `;
    if (h > 0) uptime += `${h}h `;
    if (m > 0) uptime += `${m}m `;
    if (s > 0) uptime += `${s}s`;
    return uptime.trim() || "0s";
}
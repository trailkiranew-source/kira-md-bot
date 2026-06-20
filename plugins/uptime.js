const { Module } = require('../main'); // നിന്റെ main ഫയലിന്റെ പാത്ത് ശരിയാണോ എന്ന് നോക്കുക

Module({
    pattern: 'uptime',
    fromMe: false, // എല്ലാവർക്കും ഉപയോഗിക്കാൻ ആണെങ്കിൽ false, നിനക്ക് മാത്രം മതിയെങ്കിൽ true കൊടുക്കുക
    desc: 'Check how long the bot has been running',
    type: 'info'
}, async (message) => {
    try {
        // ബോട്ട് റൺ ചെയ്യാൻ തുടങ്ങിയ സമയം (സെക്കൻഡിൽ)
        const uptimeSeconds = process.uptime();

        // സെക്കൻഡ്സിനെ ദിവസം, മണിക്കൂർ, മിനിറ്റ് ആക്കി മാറ്റുന്നു
        const days = Math.floor(uptimeSeconds / (24 * 60 * 60));
        const hours = Math.floor((uptimeSeconds % (24 * 60 * 60)) / (60 * 60));
        const minutes = Math.floor((uptimeSeconds % (60 * 60)) / 60);
        const seconds = Math.floor(uptimeSeconds % 60);

        // റിപ്ലൈ മെസ്സേജ് സെറ്റ് ചെയ്യുന്നു
        let timeString = '';
        if (days > 0) timeString += `${days} Days, `;
        if (hours > 0) timeString += `${hours} Hours, `;
        if (minutes > 0) timeString += `${minutes} Minutes, `;
        timeString += `${seconds} Seconds`;

        const replyMsg = `⏱️ *KIRA-X-MD UPTIME*\n\n🚀 *Runtime:* ${timeString}`;

        // മെസ്സേജ് സെൻഡ് ചെയ്യുന്നു
        await message.client.sendMessage(message.jid, { text: replyMsg });

    } catch (error) {
        console.error('Uptime Error:', error);
        await message.client.sendMessage(
            message.jid, 
            { text: '❌ Error calculating uptime.' }
        );
    }
});
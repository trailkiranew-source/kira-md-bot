const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
const path = require("path");

module.exports = {
    name: 'pair',
    alias: ['jadibot', 'clone', 'subbot'],
    category: 'utility',
    description: 'Connect your number as a sub-bot instantly',
    usage: `${process.env.PREFIX || '.'}pair 919876543210`,

    async execute(sock, msg, args) {
        const jid = msg.key.remoteJid;
        const prefix = process.env.PREFIX || '.';

        if (!args) {
            return sock.sendMessage(jid, { 
                text: `❌ *Please provide a WhatsApp number!*\n\n*Example:* ${prefix}pair 919876543210` 
            }, { quoted: msg });
        }

        let phoneNumber = args.replace(/[^0-9]/g, ''); 

        await sock.sendMessage(jid, { 
            text: `⏳ _Requesting pairing code for +${phoneNumber}... Please wait._` 
        }, { quoted: msg });

        // Sub-bots സേവ് ചെയ്യാൻ പ്രത്യേകം ഫോൾഡർ ഉണ്ടാക്കുന്നു
        const sessionPath = path.join(__dirname, `../session/clones/${phoneNumber}`);
        if (!fs.existsSync(sessionPath)) {
            fs.mkdirSync(sessionPath, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
        const { version } = await fetchLatestBaileysVersion();

        // പുതിയ നമ്പറിന് വേണ്ടി പുതിയൊരു സോക്കറ്റ് ഉണ്ടാക്കുന്നു
        const subSock = makeWASocket({
            version,
            auth: state,
            printQRInTerminal: false,
            logger: pino({ level: "silent" }),
            browser: ["KIRA-X-MD (Clone)", "Safari", "3.0"] 
        });

        subSock.ev.on("creds.update", saveCreds);

        if (!subSock.authState.creds.registered) {
            setTimeout(async () => {
                try {
                    let code = await subSock.requestPairingCode(phoneNumber);
                    code = code?.match(/.{1,4}/g)?.join("-") || code; 
                    
                    await sock.sendMessage(jid, { 
                        text: `✅ *P A I R I N G  C O D E*\n\n➔ *${code}*\n\n_Enter this code in WhatsApp -> Linked Devices._\n_Your bot will start immediately after linking! 🚀_` 
                    }, { quoted: msg });

                } catch (error) {
                    console.error("Pairing Error:", error);
                    sock.sendMessage(jid, { 
                        text: `❌ *Error:* Could not generate code. Make sure the number is correct.` 
                    }, { quoted: msg });
                }
            }, 3000);
        }

        subSock.ev.on("connection.update", async (update) => {
            const { connection, lastDisconnect } = update;

            if (connection === "open") {
                await sock.sendMessage(jid, { text: `🎉 *Success!* +${phoneNumber} is now running KIRA-X-MD!` }, { quoted: msg });
                
                try {
                    await subSock.sendMessage(phoneNumber + "@s.whatsapp.net", { 
                        text: `✅ *Connected to KIRA-X-MD!*\n\nYou are now using the bot on this number.\nType ${prefix}menu to start.` 
                    });
                } catch (err) {}
            } else if (connection === "close") {
                const reason = lastDisconnect?.error?.output?.statusCode;
                if (reason === DisconnectReason.loggedOut) {
                    if (fs.existsSync(sessionPath)) {
                        fs.rmSync(sessionPath, { recursive: true, force: true });
                    }
                }
            }
        });

        // 🔄 ഇത് വളരെ പ്രധാനപ്പെട്ട ഭാഗമാണ്! 
        // മെയിൻ ബോട്ടിന്റെ കമാൻഡുകൾ ഈ പുതിയ സബ്-ബോട്ടിലേക്ക് കണക്ട് ചെയ്യുന്നു
        subSock.ev.on("messages.upsert", async ({ messages }) => {
            try {
                const subMsg = messages;
                if (!subMsg.message) return;

                const subJid = subMsg.key.remoteJid;
                const subSender = subMsg.key.fromMe ? subSock.user.id.split(':') + "@s.whatsapp.net" : (subMsg.participant || subJid);
                
                const text = subMsg.message.conversation || subMsg.message.extendedTextMessage?.text || "";
                
                if (!text.startsWith(prefix)) return;

                const subArgs = text.slice(prefix.length).trim().split(/ +/);
                const commandName = subArgs.shift().toLowerCase();
                
                // ഗ്ലോബൽ കമാൻഡ് ലിസ്റ്റിൽ നിന്ന് കമാൻഡ് കണ്ടുപിടിച്ച് റൺ ചെയ്യുന്നു
                const command = global.commands.find(cmd => cmd.name === commandName || (cmd.alias && cmd.alias.includes(commandName)));

                if (command) {
                    // സബ്-ബോട്ടിന്റെ ഓണർ അവരും, കൂടാതെ നീയും (Main Owner) ആയിരിക്കും
                    const isSubOwner = subSender === (phoneNumber + "@s.whatsapp.net") || subSender === global.ownerNumber;
                    await command.execute(subSock, subMsg, subArgs, isSubOwner);
                }
            } catch (err) {
                console.error("Sub-bot Command Error:", err);
            }
        });
    }
};
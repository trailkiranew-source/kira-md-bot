require("dotenv").config();

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const P = require("pino");

const { commands, loadPlugins } = require("./lib/plugins");

loadPlugins();

async function startKira() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");

    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        logger: P({ level: "silent" }),
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on("connection.update", async (update) => {
        const { connection, qr, lastDisconnect } = update;

        if (qr) {
            console.log("\n📱 Scan QR Code:\n");
            qrcode.generate(qr, { small: true });
        }

        if (connection === "open") {
            console.log("\n✅ KIRA X MD Connected Successfully!");
            console.log("👑 Owner:", process.env.OWNER_NAME);
            console.log("🚀 Bot:", process.env.BOT_NAME);
        }

        if (connection === "close") {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !==
                DisconnectReason.loggedOut;

            console.log("⚠️ Connection Closed");

            if (shouldReconnect) {
                console.log("🔄 Reconnecting...");
                startKira();
            }
        }
    });

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async ({ messages }) => {
        try {
            const msg = messages[0];

            if (!msg.message) return;

            const text =
                msg.message.conversation ||
                msg.message.extendedTextMessage?.text ||
                "";

            const prefix = process.env.PREFIX || ".";

            if (!text.startsWith(prefix)) return;

            const commandName = text
                .slice(prefix.length)
                .trim()
                .split(" ")[0]
                .toLowerCase();
                const args = text.slice(prefix.length + commandName.length).trim().split(/ +/);
                

            const command = commands.find(cmd =>
    cmd.name === commandName ||
    (cmd.alias && cmd.alias.includes(commandName))
);

            if (!command) return;

            await command.execute(sock, msg, args)
        } catch (err) {
            console.log("Command Error:", err);
        }
    });
}

startKira();
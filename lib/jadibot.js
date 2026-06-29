const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");

const P = require("pino");
const fs = require("fs");

async function startSubBot(
    number,
    isNew = false,
    mainSock = null,
    jid = null
) {
    const sessionPath = `./jadibot/${number}`;

    if (!fs.existsSync("./jadibot")) {
        fs.mkdirSync("./jadibot");
    }

    if (!fs.existsSync(sessionPath)) {
        fs.mkdirSync(sessionPath);
    }

    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(sessionPath);

    const { version } =
        await fetchLatestBaileysVersion();

    const subSock = makeWASocket({
        version,
        logger: P({
            level: "silent"
        }),
        auth: state,
        browser: [
            "KIRA-X-MD",
            "Chrome",
            "1.0.0"
        ]
    });

    subSock.ev.on(
        "creds.update",
        saveCreds
    );

    // Generate pair code
    if (
        isNew &&
        !subSock.authState.creds.registered
    ) {
        setTimeout(async () => {
            try {
                let code =
                    await subSock.requestPairingCode(
                        number
                    );

                code =
                    code?.match(/.{1,4}/g)
                        ?.join("-") || code;

                if (mainSock && jid) {
                    await mainSock.sendMessage(
                        jid,
                        {
                            text:
`🔑 *JADIBOT PAIR CODE*

➜ ${code}

Enter this code in:
WhatsApp > Linked Devices`
                        }
                    );
                }
            } catch (err) {
                console.log(
                    "PAIR ERROR:",
                    err
                );
            }
        }, 3000);
    }

    // Connection update
    subSock.ev.on(
        "connection.update",
        async (update) => {

            console.log(
                "SUBBOT UPDATE:",
                update
            );

            const {
                connection,
                lastDisconnect
            } = update;

            if (
                connection === "open"
            ) {

                console.log(
                    `🤖 SUBBOT ONLINE: ${number}`
                );

                if (
                    mainSock &&
                    jid
                ) {
                    await mainSock.sendMessage(
                        jid,
                        {
                            text:
`✅ ${number} connected successfully!`
                        }
                    );
                }

            } else if (
                connection === "close"
            ) {

                const reason =
                    lastDisconnect?.error
                        ?.output
                        ?.statusCode;

                console.log(
                    "SUBBOT CLOSED:",
                    reason
                );

                if (
                    reason ===
                    DisconnectReason.loggedOut
                ) {

                    console.log(
                        `${number} logged out`
                    );

                    if (
                        fs.existsSync(
                            sessionPath
                        )
                    ) {
                        fs.rmSync(
                            sessionPath,
                            {
                                recursive: true,
                                force: true
                            }
                        );
                    }

                } else {

                    console.log(
                        `Restarting ${number}`
                    );

                    startSubBot(number);
                }
            }
        }
    );

    // Message handler
    subSock.ev.on(
        "messages.upsert",
        async ({
            messages,
            type
        }) => {
            try {

                console.log(
                    "SUBBOT MESSAGE EVENT:",
                    type
                );

                if (
                    type !== "notify"
                ) return;

                const msg =
                    messages[0];

                if (!msg) return;
                if (!msg.message) return;

                const subJid =
                    msg.key.remoteJid;

                const subSender =
                    msg.key.fromMe
                        ? subSock.user.id
                              .split(":")[0] +
                          "@s.whatsapp.net"
                        : (
                              msg.key.participant ||
                              subJid
                          );

                const text =
                    msg.message
                        ?.conversation ||
                    msg.message
                        ?.extendedTextMessage
                        ?.text ||
                    msg.message
                        ?.imageMessage
                        ?.caption ||
                    msg.message
                        ?.videoMessage
                        ?.caption ||
                    "";

                console.log(
                    `📩 SUBBOT TEXT: ${text}`
                );

                const prefix =
                    process.env
                        .PREFIX || ".";

                if (
                    !text.startsWith(
                        prefix
                    )
                )
                    return;

                const args =
                    text
                        .slice(
                            prefix.length
                        )
                        .trim()
                        .split(/ +/);

                const commandName =
                    args
                        .shift()
                        ?.toLowerCase();

                console.log(
                    "COMMAND COUNT:",
                    global.commands
                        ?.length
                );

                const command =
                    global.commands?.find(
                        cmd =>
                            cmd.name ===
                                commandName ||
                            cmd.alias?.includes(
                                commandName
                            )
                    );

                if (!command) {
                    console.log(
                        `❌ Command not found: ${commandName}`
                    );
                    return;
                }

                console.log(
                    `✅ RUNNING: ${commandName}`
                );

                const isSubOwner =
                    subSender ===
                    number +
                        "@s.whatsapp.net";

                await subSock.readMessages(
                    [msg.key]
                );

                await command.execute(
                    subSock,
                    msg,
                    args,
                    isSubOwner
                );

            } catch (err) {

                console.log(
                    "SUBBOT CMD ERROR:",
                    err
                );
            }
        }
    );
}

module.exports = {
    startSubBot
};
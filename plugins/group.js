module.exports = [

{
    name: "jid",
    category: "group",

    async execute(sock, msg) {

        const jid = msg.key.remoteJid;

        await sock.sendMessage(jid, {
            text: `📌 JID:\n${jid}`
        });
    }
},

{
    name: "invite",
    category: "owner",

    async execute(sock, msg) {

        const jid = msg.key.remoteJid;

        if (!jid.endsWith("@g.us")) return;

        const code =
            await sock.groupInviteCode(jid);

        await sock.sendMessage(jid, {
            text:
`🔗 Group Invite Link

https://chat.whatsapp.com/${code}`
        });
    }
},

{
    name: "revoke",
    category: "owner",

    async execute(sock, msg) {

        const jid = msg.key.remoteJid;

        if (!jid.endsWith("@g.us")) return;

        await sock.groupRevokeInvite(jid);

        const code =
            await sock.groupInviteCode(jid);

        await sock.sendMessage(jid, {
            text:
`✅ Invite Link Revoked

https://chat.whatsapp.com/${code}`
        });
    }
},

{
    name: "glock",
    category: "owner",

    async execute(sock, msg) {

        const jid = msg.key.remoteJid;

        if (!jid.endsWith("@g.us")) return;

        await sock.groupSettingUpdate(
            jid,
            "announcement"
        );

        await sock.sendMessage(jid, {
            text: "🔒 Group Closed"
        });
    }
},

{
    name: "gunlock",
    category: "owner",

    async execute(sock, msg) {

        const jid = msg.key.remoteJid;

        if (!jid.endsWith("@g.us")) return;

        await sock.groupSettingUpdate(
            jid,
            "not_announcement"
        );

        await sock.sendMessage(jid, {
            text: "🔓 Group Opened"
        });
    }
},

{
    name: "gname",
    category: "owner",

    async execute(sock, msg, args) {

        const jid = msg.key.remoteJid;

        if (!jid.endsWith("@g.us")) return;

        const name = args.join(" ");

        if (!name) {
            return sock.sendMessage(jid,{
                text:"❌ Example:\n.gname KIRA-X MD"
            });
        }

        await sock.groupUpdateSubject(
            jid,
            name
        );

        await sock.sendMessage(jid,{
            text:"✅ Group Name Updated"
        });
    }
},

{
    name: "gdesc",
    category: "owner",

    async execute(sock, msg, args) {

        const jid = msg.key.remoteJid;

        if (!jid.endsWith("@g.us")) return;

        const desc = args.join(" ");

        if (!desc) {
            return sock.sendMessage(jid,{
                text:"❌ Example:\n.gdesc Hello World"
            });
        }

        await sock.groupUpdateDescription(
            jid,
            desc
        );

        await sock.sendMessage(jid,{
            text:"✅ Group Description Updated"
        });
    }
},

{
    name: "leave",
    category: "owner",

    async execute(sock, msg) {

        const jid = msg.key.remoteJid;

        if (!jid.endsWith("@g.us")) return;

        await sock.sendMessage(jid,{
            text:"👋 Bye..."
        });

        await sock.groupLeave(jid);
    }
},

{
    name: "quoted",
    category: "owner",

    async execute(sock, msg) {

        const jid = msg.key.remoteJid;

        const quoted =
            msg.message?.extendedTextMessage
            ?.contextInfo?.quotedMessage;

        if (!quoted) {
            return sock.sendMessage(jid,{
                text:"❌ Reply to a message"
            });
        }

        await sock.sendMessage(
            jid,
            { forward: { message: quoted } }
        );
    }
},

{
    name: "gstatus",
    category: "owner",

    async execute(sock, msg) {

        const jid = msg.key.remoteJid;

        if (!jid.endsWith("@g.us")) return;

        const meta =
            await sock.groupMetadata(jid);

        await sock.sendMessage(jid,{
            text:
`📊 GROUP STATUS

📛 Name:
${meta.subject}

👥 Members:
${meta.participants.length}

🆔 ID:
${jid}`
        });
    }
}

];
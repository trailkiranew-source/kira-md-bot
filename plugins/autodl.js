module.exports = {
    name: "autodl",
    category: "owner",

    async execute(sock, msg, args) {

        const jid = msg.key.remoteJid;

        global.autoDlChats = global.autoDlChats || [];

        const action = (args[0] || "").toLowerCase();
        const target = (args[1] || "").toLowerCase();

        if (action === "on") {

            if (target === "groups") {
                global.autoDlAllGroups = true;
                return sock.sendMessage(jid, {
                    text: "✅ AutoDL enabled for all groups"
                });
            }

            if (target === "dms") {
                global.autoDlAllDms = true;
                return sock.sendMessage(jid, {
                    text: "✅ AutoDL enabled for all DMs"
                });
            }

            if (!global.autoDlChats.includes(jid)) {
                global.autoDlChats.push(jid);
            }

            return sock.sendMessage(jid, {
                text: "✅ AutoDL enabled in this chat"
            });
        }
if (action === "status") {

    return sock.sendMessage(jid, {
        text:
`*AUTO DL STATUS*

Chat: ${global.autoDlChats.includes(jid) ? "ON" : "OFF"}

Groups: ${global.autoDlAllGroups ? "ON" : "OFF"}

DMs: ${global.autoDlAllDms ? "ON" : "OFF"}`
    });
}
        if (action === "off") {

            if (target === "groups") {
                global.autoDlAllGroups = false;
                return sock.sendMessage(jid, {
                    text: "❌ AutoDL disabled for all groups"
                });
            }

            if (target === "dms") {
                global.autoDlAllDms = false;
                return sock.sendMessage(jid, {
                    text: "❌ AutoDL disabled for all DMs"
                });
            }

            global.autoDlChats =
                global.autoDlChats.filter(x => x !== jid);

            return sock.sendMessage(jid, {
                text: "❌ AutoDL disabled in this chat"
            });
        }

        return sock.sendMessage(jid, {
            text:
`*AUTO DL*

.autodl on
.autodl off

.autodl on groups
.autodl off groups

.autodl on dms
.autodl off dms`
        });
    }
};
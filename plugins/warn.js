module.exports = [

{
    name: "warn",
    category: "owner",

    async execute(sock, msg, args) {

        const jid = msg.key.remoteJid;

        if (!jid.endsWith("@g.us"))
            return;

        const target =
            msg.message?.extendedTextMessage
            ?.contextInfo?.mentionedJid?.[0];

        if (!target)
            return sock.sendMessage(jid,{
                text:"❌ Mention a user"
            });

        const reason =
            args.slice(1).join(" ") ||
            "No Reason";

        if (!global.warnData[jid])
            global.warnData[jid] = {};

        if (!global.warnData[jid][target])
            global.warnData[jid][target] = [];

        global.warnData[jid][target]
            .push(reason);

        const count =
            global.warnData[jid][target].length;

        await sock.sendMessage(jid,{
            text:
`⚠️ WARNING

👤 @${target.split("@")[0]}
📊 Warns: ${count}/${global.warnLimit}

📝 Reason:
${reason}`,
            mentions:[target]
        });

        if (count >= global.warnLimit) {

            await sock.groupParticipantsUpdate(
                jid,
                [target],
                "remove"
            );

            delete global.warnData[jid][target];
        }
    }
},

{
    name:"warnings",
    category:"owner",

    async execute(sock,msg){

        const jid = msg.key.remoteJid;

        const target =
            msg.message?.extendedTextMessage
            ?.contextInfo?.mentionedJid?.[0];

        if(!target)
            return;

        const warns =
            global.warnData?.[jid]?.[target]
            || [];

        await sock.sendMessage(jid,{
            text:
`👤 @${target.split("@")[0]}

⚠️ Total Warns:
${warns.length}

${warns.map((x,i)=>
`${i+1}. ${x}`
).join("\n") || "No warnings"}`,
mentions:[target]
        });
    }
},

{
    name:"rmwarn",
    category:"owner",

    async execute(sock,msg){

        const jid = msg.key.remoteJid;

        const target =
            msg.message?.extendedTextMessage
            ?.contextInfo?.mentionedJid?.[0];

        if(!target)
            return;

        if(
            global.warnData?.[jid]?.[target]
            ?.length
        ){
            global.warnData[jid][target].pop();
        }

        await sock.sendMessage(jid,{
            text:"✅ One warning removed"
        });
    }
},

{
    name:"resetwarn",
    category:"owner",

    async execute(sock,msg){

        const jid = msg.key.remoteJid;

        const target =
            msg.message?.extendedTextMessage
            ?.contextInfo?.mentionedJid?.[0];

        if(!target)
            return;

        if(global.warnData?.[jid])
            delete global.warnData[jid][target];

        await sock.sendMessage(jid,{
            text:"✅ Warnings reset"
        });
    }
},

{
    name:"setwarnlimit",
    category:"owner",

    async execute(sock,msg,args){

        const jid = msg.key.remoteJid;

        const num =
            parseInt(args[0]);

        if(!num)
            return;

        global.warnLimit = num;

        await sock.sendMessage(jid,{
            text:
`✅ Warn limit set to ${num}`
        });
    }
}

];
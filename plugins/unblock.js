module.exports = {
    name: "unblock",
    category: "owner",

    async execute(sock,msg,args,isOwner){

        if(!isOwner) return;

        const jid = msg.key.remoteJid;

        let user;

        if(msg.message?.extendedTextMessage?.contextInfo?.participant){
            user =
            msg.message.extendedTextMessage.contextInfo.participant;
        } else {
            user = args[0]?.replace(/[^0-9]/g,"") +
            "@s.whatsapp.net";
        }

        if(!user) return sock.sendMessage(jid,{
            text:"❌ Reply or give number"
        });

        await sock.updateBlockStatus(user,"unblock");

        await sock.sendMessage(jid,{
            text:"✅ User Unblocked"
        });
    }
};
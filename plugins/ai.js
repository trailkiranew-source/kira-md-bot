const axios = require("axios");

module.exports = {
    name: "ai",
    alias: ["gemini", "gpt", "kira"],
    category: "ai",
    description: "KIRA AI Assistant",

    async execute(sock, msg, args) {

        const jid = msg.key.remoteJid;
        const question = args.join(" ").trim();

        if (!question) {
            return await sock.sendMessage(
                jid,
                {
                    text:
`🩸 *KIRA AI*

Example:
.ai Hello
.ai Who is Naruto?
.ai Tell me a joke`
                },
                { quoted: msg }
            );
        }

        try {

            await sock.sendMessage(jid, {
                react: {
                    text: "🧠",
                    key: msg.key
                }
            });

            const thinking = await sock.sendMessage(
                jid,
                {
                    text: "🩸 *_KIRA is thinking..._*"
                },
                { quoted: msg }
            );

            const prompt = `
You are KIRA, the official AI assistant of KIRA-X-MD.

Rules:
- Your name is KIRA.
- Creator: Madhav.
- Never say you are ChatGPT, Gemini or Google AI.
- Speak like a calm anime assistant.
- Call the user Senpai occasionally.
- Keep replies clean and readable.

User: ${question}

KIRA:
`;

            const apis = [
                `https://jerrycoder.oggyapi.workers.dev/ai/gemini?prompt=${encodeURIComponent(prompt)}`,
                `https://jerrycoder.oggyapi.workers.dev/ai/gpt4?prompt=${encodeURIComponent(prompt)}&model=4.3`,
                `https://jerrycoder.oggyapi.workers.dev/ai/gpt?q=${encodeURIComponent(prompt)}`
            ];

            let data = null;

            for (const url of apis) {
                try {

                    console.log("TRYING:", url);

                    const res = await axios.get(url, {
                        timeout: 30000
                    });

                    if (res.data) {
                        data = res.data;
                        break;
                    }

                } catch (e) {

                    console.log(
                        "API FAILED:",
                        e.message
                    );

                    continue;
                }
            }

            if (!data) {
                throw new Error(
                    "All AI APIs failed"
                );
            }

            console.log("AI RESPONSE:", data);

            let reply = "";

            if (typeof data === "string") {
                reply = data;
            }
            else if (data.text) {
                reply = data.text;
            }
            else if (data.reply) {
                reply = data.reply;
            }
            else if (data.response) {
                reply = data.response;
            }
            else if (data.result) {
                reply = data.result;
            }
            else if (data.message) {
                reply = data.message;
            }
            else {
                reply = JSON.stringify(
                    data,
                    null,
                    2
                );
            }

            reply = reply
                .replace(/ChatGPT/gi, "KIRA")
                .replace(/Gemini/gi, "KIRA")
                .replace(/Google AI/gi, "KIRA");

            const message =
`╭━━━〔 K I R A • A I 〕━━━⬣

👤  ${question}

┈┈┈┈┈┈┈┈┈┈

${reply}

┈┈┈┈┈┈┈┈┈┈
🩸 Justice Never Sleeps.
╰━━━━━━━━━━━━━━⬣`;

            await sock.sendMessage(
                jid,
                {
                    text: message,
                    edit: thinking.key
                }
            ).catch(async () => {
                await sock.sendMessage(
                    jid,
                    {
                        text: message
                    },
                    { quoted: msg }
                );
            });

            await sock.sendMessage(jid, {
                react: {
                    text: "✨",
                    key: msg.key
                }
            });

        } catch (err) {

            console.log(
                "AI ERROR:",
                err.message
            );

            await sock.sendMessage(jid, {
                react: {
                    text: "❌",
                    key: msg.key
                }
            });

            await sock.sendMessage(
                jid,
                {
                    text:
`🩸 *KIRA AI*

I couldn't think of an answer right now, Senpai.
Please try again later.`
                },
                { quoted: msg }
            );
        }
    }
};
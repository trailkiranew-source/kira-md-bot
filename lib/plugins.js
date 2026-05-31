const fs = require("fs");
const path = require("path");

const commands = [];

function loadPlugins() {
    const pluginPath = path.join(__dirname, "../plugins");

    const files = fs.readdirSync(pluginPath);

    for (const file of files) {
        if (file.endsWith(".js")) {
            const cmd = require(path.join(pluginPath, file));
            commands.push(cmd);
            console.log(`✅ Loaded Plugin: ${file}`);
        }
    }
}

module.exports = {
    commands,
    loadPlugins
};
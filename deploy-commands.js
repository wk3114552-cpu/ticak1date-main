const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const fs = require('fs');
const path = require('node:path');
const { loadConfig } = require('./config/config');

async function DeployCommands() {
    const { token, clientID } = loadConfig();
    const commands = [];
    const commandDirectory = path.join(__dirname, 'commands');
    const commandFiles = fs.readdirSync(commandDirectory).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const command = require(path.join(commandDirectory, file));
        commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(token);
    console.log("Deploying commands...");
    await rest.put(
        Routes.applicationCommands(clientID),
        { body: commands }
    );
    console.log("✅ Commands deployed!");
}

module.exports = { DeployCommands };

// Agar file direct run karo (node deploy-commands.js)
if (require.main === module) {
    DeployCommands().catch(error => {
        console.error(`[COMMANDS] Deployment failed: ${error.name || 'Error'}: ${error.message}`);
        process.exitCode = 1;
    });
}

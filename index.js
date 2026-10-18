const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const { loadConfig } = require('./config/config');
const { DeployCommands } = require('./deploy-commands');
require('colors');

async function start() {
    const { token } = loadConfig();
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildVoiceStates,
        ]
    });

    try {
        client.commands = new Collection();
        const commandDirectory = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandDirectory).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(path.join(commandDirectory, file));
            if (!command.data?.name || typeof command.execute !== 'function') {
                throw new Error(`Invalid command module: ${file}`);
            }
            client.commands.set(command.data.name, command);
        }

        const commandNameLength = Math.max(0, ...[...client.commands.keys()].map(name => name.length));
        for (const [name] of client.commands) {
            console.log(`[COMMAND] ${name.padEnd(commandNameLength)} | ${'Loaded!'.green}`.gray);
        }

        const eventDirectory = path.join(__dirname, 'events');
        const eventFiles = fs.readdirSync(eventDirectory).filter(file => file.endsWith('.js'));
        for (const file of eventFiles) {
            const event = require(path.join(eventDirectory, file));
            const handleEvent = (...args) => Promise.resolve().then(() => event.execute(...args, client)).catch(error => {
                console.error(`[EVENT] ${event.name} failed: ${error.name}: ${error.message}`);
            });
            if (event.once) {
                client.once(event.name, handleEvent);
            } else {
                client.on(event.name, handleEvent);
            }
        }

        for (const directory of ['errors', 'database']) {
            fs.mkdirSync(path.join(__dirname, directory), { recursive: true });
        }

        // Fail before gateway login if command registration is unauthorized.
        await DeployCommands();
        await client.login(token);
    } catch (error) {
        client.destroy();
        throw error;
    }
}

start().catch(error => {
    console.error(`[STARTUP] ${error.name || 'Error'}: ${error.message}`);
    process.exitCode = 1;
});

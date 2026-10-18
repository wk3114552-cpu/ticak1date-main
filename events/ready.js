const { ActivityType } = require('discord.js');
const RPC = require('discord-rpc');
const { createTicketExpiryManager } = require('../ticketExpiry');

module.exports = {
    name: 'ready',
    once: true,

    async execute(client) {
        console.log(`[EVENT] Logged in as ${client.user.tag}`);

        const rpcClientId = process.env.DISCORD_RPC_CLIENT_ID?.trim();
        if (rpcClientId) {
            const rpc = new RPC.Client({ transport: 'ipc' });
            rpc.on('ready', () => {
                rpc.setActivity({
                    details: 'ROMAN XP CHEAT TICKET SYSTEM',
                    state: 'Helping users!',
                    startTimestamp: new Date(),
                    largeImageKey: 'bot_logo',
                    smallImageKey: 'small_logo',
                    instance: true
                });
                console.log('Discord RPC enabled!');
            });
            rpc.login({ clientId: rpcClientId }).catch(error => {
                console.error(`[RPC] ${error.name}: ${error.message}`);
            });
        }

        client.user.setPresence({
            activities: [
                {
                    name: 'ROMAN XP CHEAT',
                    type: ActivityType.Watching
                }
            ],
            status: 'idle'
        });

        client.ticketExpiry = createTicketExpiryManager(client);
        client.ticketExpiry.start();
    }
};

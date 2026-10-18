const { EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    name: 'interactionCreate',
    once: false,

    async execute(interaction, client) {
        if (!interaction.isCommand()) return;

        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        try {
            await command.execute(interaction, client);
        } catch (error) {
            const date = new Date();

            const datestring = date.toISOString();
            const filename = `error-${date.toISOString().replace(/[:.]/g, '-')}.txt`;
            const errorDirectory = path.join(__dirname, '..', 'errors');
            const errorLog = `[ERROR] [${datestring}] ${interaction.commandName}: ${error.stack || error.message}`;

            console.error(errorLog.red);
            try {
                fs.mkdirSync(errorDirectory, { recursive: true });
                fs.writeFileSync(path.join(errorDirectory, filename), errorLog, 'utf8');
            } catch (writeError) {
                console.error(`[ERROR] Could not write ${filename}: ${writeError.message}`.red);
            }

            const { ownerID } = require('../config.json'); 

            const embed = new EmbedBuilder()
                .setTitle('❌ Hata')
                .setDescription('An error occurred, please contact the bot owner.')
                .setColor('#FF0000')
                .addFields(
                    { name: '📝 Commands', value: `/${interaction.commandName}`, inline: true },
                    { name: '👤 User', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '📌 Contact', value: `<@${ownerID}>\nFor more details contact the bot owner.\nError Log: \`${filename}\``, inline: false }
                )
                .setFooter({ text: client.user.username, iconURL: client.user.avatarURL({ dynamic: true }) })
                .setTimestamp();

            const response = { embeds: [embed], ephemeral: true };
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(response);
            } else {
                await interaction.reply(response);
            }
        }
    }
}

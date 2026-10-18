const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Show all commands'),

    async execute(interaction, client) {
        const commandFiles = fs.readdirSync(__dirname).filter(file => file.endsWith('.js'));

        const embed = new EmbedBuilder()
            .setTitle('🤖 Commands')
            .setDescription('All bot commands')
            .setColor('#6104b9')
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setFooter({ text: client.user.username, iconURL: client.user.avatarURL({ dynamic: true }) })
            .setTimestamp();

        for (const file of commandFiles) {
            const command = require(path.join(__dirname, file));
            embed.addFields({ name: `/${command.data.name}`, value: `${command.data.description}` });
        }

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

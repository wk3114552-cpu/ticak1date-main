const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder
} = require("discord.js");

function escapeMarkdown(value = "") {
    const specialCharacters = new Set([
        "\\", String.fromCharCode(96), "*", "_", "~", "|", ">"
    ]);
    return Array.from(String(value), character =>
        specialCharacters.has(character) ? "\\" + character : character
    ).join("");
}

function getTicketCustomer(channel, fallbackUserId) {
    const topicParts = String(channel.topic || "").trim().split(/\s+/).filter(Boolean);
    const username = topicParts[0] ||
        String(channel.name || "").replace(/^(ticket-|closed-)/, "") ||
        "Customer";
    return {
        username,
        userId: topicParts[1] || fallbackUserId || null
    };
}

function createTicketClosureNotice(options) {
    const { channel, transcriptUrl, automatic = false } = options;
    const guild = channel.guild;
    const customer = getTicketCustomer(channel, options.userId);
    const safeUsername = escapeMarkdown(options.username || customer.username);
    const safeChannelName = escapeMarkdown(channel.name || "ticket");
    const safeGuildName = escapeMarkdown(guild.name || "your server");
    const actionText = automatic
        ? "Your support ticket was automatically closed after 48 hours."
        : "Your support ticket has been successfully resolved by our staff.";
    const transcriptText = transcriptUrl
        ? "📄 Your complete HTML transcript is ready. Use the button below to open it."
        : options.transcriptFallbackAvailable
            ? "📄 The transcript link could not be prepared, so a copy is attached below."
            : "📄 The HTML transcript could not be generated for this ticket.";

    const iconUrl = guild.iconURL({ extension: "png", size: 128 });
    const embed = new EmbedBuilder()
        .setColor(automatic ? "#64748b" : "#5865F2")
        .setTitle(automatic ? "⏰ Ticket Automatically Closed" : "🎫 Ticket Closed Successfully")
        .setDescription([
            "Hello **" + safeUsername + "**,",
            actionText,
            "### Ticket Information",
            "👤 Customer: " + (customer.userId ? "<@" + customer.userId + ">" : safeUsername),
            "🏷 Ticket: " + safeChannelName,
            "🏠 Server: " + safeGuildName,
            transcriptText,
            "Thank you for choosing **" + safeGuildName + "**."
        ].join("\n\n"))
        .setFooter({
            text: guild.name || "Ticket Support",
            ...(iconUrl ? { iconURL: iconUrl } : {})
        })
        .setTimestamp();

    const message = { embeds: [embed] };
    if (transcriptUrl) {
        message.components = [
            new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("Open HTML Transcript")
                    .setStyle(ButtonStyle.Link)
                    .setURL(transcriptUrl)
            )
        ];
    }

    return message;
}

module.exports = {
    createTicketClosureNotice,
    escapeMarkdown,
    getTicketCustomer
};

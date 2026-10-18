const fs = require("node:fs");
const path = require("node:path");

function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function markdown(value = "") {
    let text = escapeHtml(value);
    const codeFence = String.fromCharCode(96).repeat(3);
    const codeBlockPattern = new RegExp(codeFence + "([\\s\\S]*?)" + codeFence, "g");
    text = text.replace(codeBlockPattern, (_match, code) =>
        "<pre><code>" + code.trim() + "</code></pre>"
    );
    text = text.replace(/\u0060([^\u0060\n]+)\u0060/g, "<code>$1</code>");
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/__(.+?)__/g, "<u>$1</u>");
    text = text.replace(/~~(.+?)~~/g, "<del>$1</del>");
    text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");
    text = text.replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    return text.replace(/\n/g, "<br>");
}

function formatBytes(bytes) {
    const size = Number(bytes);
    if (!Number.isFinite(size) || size <= 0) return "0 Bytes";
    const units = ["Bytes", "KB", "MB", "GB", "TB"];
    const unit = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
    return parseFloat((size / Math.pow(1024, unit)).toFixed(2)) + " " + units[unit];
}

function fileType(name = "") {
    const extension = String(name).split(".").pop().toLowerCase();
    if (["png", "jpg", "jpeg", "gif", "webp", "avif"].includes(extension)) return "image";
    if (["mp4", "mov", "webm", "mkv"].includes(extension)) return "video";
    if (["mp3", "wav", "ogg", "m4a"].includes(extension)) return "audio";
    if (extension === "pdf") return "pdf";
    return "file";
}

function renderAttachment(file) {
    const type = fileType(file.name);
    const name = escapeHtml(file.name || "Attachment");
    const url = escapeHtml(file.url || "#");
    const size = formatBytes(file.size);
    const preview = type === "image"
        ? '<a class="image-preview" href="' + url + '" target="_blank" rel="noopener noreferrer"><img src="' + url + '" alt="' + name + '" loading="lazy"></a>'
        : type === "video"
            ? '<video class="media-preview" controls preload="metadata"><source src="' + url + '"></video>'
            : type === "audio"
                ? '<audio class="audio-preview" controls preload="metadata" src="' + url + '"></audio>'
                : "";
    const icon = type === "image" ? "▧" : type === "video" ? "▶" : type === "audio" ? "♫" : type === "pdf" ? "PDF" : "FILE";

    return [
        '<div class="attachment-card">',
        '<div class="attachment-icon" aria-hidden="true">' + icon + "</div>",
        '<div class="attachment-details">',
        '<a class="attachment-name" href="' + url + '" target="_blank" rel="noopener noreferrer">' + name + "</a>",
        '<span class="attachment-meta">' + type.toUpperCase() + " · " + size + "</span>",
        preview,
        "</div>",
        "</div>"
    ].join("");
}

function getBadges(member, message, guild) {
    const badges = [];
    if (message.author.bot) badges.push('<span class="badge badge-bot">BOT</span>');
    if (member && guild.ownerId === member.id) badges.push('<span class="badge badge-owner">OWNER</span>');
    if (member && member.permissions?.has?.("Administrator")) badges.push('<span class="badge badge-staff">STAFF</span>');
    if (message.pinned) badges.push('<span class="badge badge-pinned">PINNED</span>');
    if (message.editedTimestamp) badges.push('<span class="badge badge-edited">EDITED</span>');
    return badges.join("");
}

async function fetchAllMessages(channel) {
    const collected = new Map();
    let before;

    while (true) {
        const batch = await channel.messages.fetch({
            limit: 100,
            ...(before ? { before } : {})
        });
        if (!batch.size) break;

        for (const message of batch.values()) collected.set(message.id, message);
        if (batch.size < 100) break;

        const oldestMessage = Array.from(batch.values()).at(-1);
        if (!oldestMessage || oldestMessage.id === before) break;
        before = oldestMessage.id;
    }

    return Array.from(collected.values())
        .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
}

async function generateTranscript(channel) {
    const messages = await fetchAllMessages(channel);
    const messagesById = new Map(messages.map(message => [message.id, message]));
    const rendered = [];

    for (const message of messages) {
        const member = channel.guild.members.cache.get(message.author.id);
        const username = String(message.member?.displayName || message.author.username || "Unknown");
        const safeUsername = escapeHtml(username);
        const color = member?.displayHexColor && /^#[0-9a-fA-F]{6}$/.test(member.displayHexColor)
            ? member.displayHexColor
            : "#dbe4f0";
        const avatarUrl = escapeHtml(message.author.displayAvatarURL({
            extension: "png",
            size: 128
        }));
        const timestamp = new Date(message.createdTimestamp).toLocaleString();
        const content = message.content
            ? markdown(message.content)
            : '<span class="muted-message">No text content</span>';

        let replyHtml = "";
        if (message.reference?.messageId) {
            let repliedMessage = messagesById.get(message.reference.messageId);
            if (!repliedMessage) {
                repliedMessage = await channel.messages.fetch(message.reference.messageId).catch(() => null);
            }
            if (repliedMessage) {
                replyHtml = [
                    '<div class="reply-card">',
                    '<span>Replying to ' + escapeHtml(repliedMessage.member?.displayName || repliedMessage.author.username) + "</span>",
                    "<div>" + markdown(repliedMessage.content || "Attachment") + "</div>",
                    "</div>"
                ].join("");
            }
        }

        const attachments = Array.from(message.attachments.values());
        const attachmentsHtml = attachments.map(renderAttachment).join("");
        const reactions = Array.from(message.reactions.cache.values());
        const reactionsHtml = reactions.length
            ? '<div class="reaction-list">' + reactions.map(reaction =>
                '<span class="reaction-chip">' + escapeHtml(reaction.emoji.toString()) +
                " <b>" + Number(reaction.count || 0) + "</b></span>"
            ).join("") + "</div>"
            : "";

        rendered.push([
            '<article class="message-card" data-author="' + escapeHtml(username) +
                '" data-files="' + attachments.length +
                '" data-reactions="' + reactions.reduce((sum, reaction) => sum + Number(reaction.count || 0), 0) + '">',
            '<img class="message-avatar" src="' + avatarUrl + '" alt="" loading="lazy">',
            '<div class="message-body">',
            '<header class="message-header">',
            '<div class="author-line"><span class="author-name" style="color:' + color + '">' + safeUsername + "</span>" +
                getBadges(member, message, channel.guild) + "</div>",
            '<time datetime="' + new Date(message.createdTimestamp).toISOString() + '">' + escapeHtml(timestamp) + "</time>",
            "</header>",
            replyHtml,
            '<div class="message-text">' + content + "</div>",
            attachmentsHtml,
            reactionsHtml,
            "</div>",
            "</article>"
        ].join(""));
    }

    return rendered.join("\n");
}

function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

async function buildTranscript(channel) {
    const template = fs.readFileSync(
        path.join(__dirname, "templates", "transcript.html"),
        "utf8"
    );
    const messages = await generateTranscript(channel);
    const topic = String(channel.topic || "").trim().split(/\s+/).filter(Boolean);
    const serverIcon = channel.guild.iconURL({ extension: "png", size: 128 });
    const serverBadge = serverIcon
        ? '<img class="server-icon" src="' + escapeHtml(serverIcon) + '" alt="">'
        : '<div class="server-icon server-icon-placeholder" aria-hidden="true">' +
            escapeHtml(String(channel.guild.name || "S").charAt(0).toUpperCase()) + "</div>";
    const values = {
        SERVER_NAME: escapeHtml(channel.guild.name || "Discord Server"),
        SERVER_BADGE: serverBadge,
        TICKET_ID: escapeHtml(channel.id),
        CHANNEL: escapeHtml(channel.name || "ticket"),
        USER: escapeHtml(topic[0] || "Unknown"),
        OPEN_TIME: escapeHtml(formatTimestamp(channel.createdTimestamp)),
        CLOSE_TIME: escapeHtml(new Date().toLocaleString()),
        MESSAGES: messages
    };

    return template.replace(/{{([A-Z_]+)}}/g, (placeholder, key) =>
        Object.prototype.hasOwnProperty.call(values, key) ? values[key] : placeholder
    );
}

module.exports = buildTranscript;
Object.assign(module.exports, {
    buildTranscript,
    escapeHtml,
    fetchAllMessages,
    fileType,
    formatBytes,
    generateTranscript,
    markdown,
    renderAttachment
});

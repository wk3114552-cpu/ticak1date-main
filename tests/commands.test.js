const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');

const commandDirectory = path.join(__dirname, '..', 'commands');
const commandFiles = fs.readdirSync(commandDirectory).filter(file => file.endsWith('.js'));
const commands = new Map(commandFiles.map(file => {
    const command = require(path.join(commandDirectory, file));
    return [command.data.name, command];
}));

test('help, ping, and setup commands load and serialize for registration', () => {
    assert.deepEqual([...commands.keys()].sort(), ['help', 'ping', 'setup']);
    for (const command of commands.values()) {
        assert.equal(typeof command.execute, 'function');
        assert.equal(command.data.toJSON().name, command.data.name);
    }
});

test('help responds with all registered command names', async () => {
    let replyPayload;
    const client = {
        user: {
            displayAvatarURL: () => 'https://example.com/avatar.png',
            avatarURL: () => 'https://example.com/avatar.png',
            username: 'Test bot'
        }
    };

    await commands.get('help').execute({
        reply: async payload => { replyPayload = payload; }
    }, client);

    const fields = replyPayload.embeds[0].toJSON().fields;
    assert.deepEqual(fields.map(field => field.name).sort(), ['/help', '/ping', '/setup']);
});

test('ping replies and edits the response with latency details', async () => {
    const replies = [];
    const interaction = {
        createdTimestamp: Date.now(),
        reply: async payload => replies.push(payload),
        editReply: async payload => replies.push(payload)
    };
    const client = {
        ws: { ping: 42 },
        user: {
            displayAvatarURL: () => 'https://example.com/avatar.png',
            avatarURL: () => 'https://example.com/avatar.png',
            username: 'Test bot'
        }
    };

    await commands.get('ping').execute(interaction, client);

    assert.equal(replies[0].content, 'Checking bot latency...');
    assert.match(replies[1].embeds[0].toJSON().description, /API Latency is 42ms/);
});

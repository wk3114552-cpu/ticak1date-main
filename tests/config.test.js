const assert = require('node:assert/strict');
const { test } = require('node:test');
const { loadConfig } = require('../config/config');

function makeToken(applicationId) {
    return `${Buffer.from(applicationId).toString('base64url')}.test-signature.test-secret`;
}

test('configuration requires DISCORD_TOKEN and gives a clear error', () => {
    assert.throws(
        () => loadConfig({}),
        error => error.message.includes('Missing required environment variable DISCORD_TOKEN')
    );
});

test('configuration trims boundary whitespace and rejects internal whitespace', () => {
    const token = makeToken('1440208572746301450');
    assert.equal(loadConfig({ DISCORD_TOKEN: `  ${token}\n` }).token, token);
    assert.throws(
        () => loadConfig({ DISCORD_TOKEN: `${token.slice(0, 6)} ${token.slice(6)}` }),
        /DISCORD_TOKEN contains whitespace/
    );
});

test('configuration rejects a token for a different Discord application', () => {
    assert.throws(
        () => loadConfig({ DISCORD_TOKEN: makeToken('123456789012345678') }),
        /different Discord application/
    );
});

test('configuration preserves the configured application ID for the matching token', () => {
    const config = loadConfig({ DISCORD_TOKEN: makeToken('1440208572746301450') });
    assert.equal(config.clientID, '1440208572746301450');
    assert.equal(config.ownerID, require('../config.json').ownerID);
});

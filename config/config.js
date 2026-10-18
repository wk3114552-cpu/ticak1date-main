const settings = require('../config.json');

function loadConfig(env = process.env) {
    const rawToken = env.DISCORD_TOKEN;
    if (typeof rawToken !== 'string' || rawToken.trim() === '') {
        throw new Error('Missing required environment variable DISCORD_TOKEN.');
    }

    const token = rawToken.trim();
    if (/\s/.test(token)) {
        throw new Error('DISCORD_TOKEN contains whitespace. Paste the bot token without spaces or line breaks.');
    }

    const clientID = String(settings.clientID || '');
    if (!/^\d{17,20}$/.test(clientID)) {
        throw new Error('config.json must contain a valid numeric clientID.');
    }

    const encodedApplicationId = token.split('.')[0];
    const tokenApplicationId = Buffer.from(encodedApplicationId, 'base64url').toString('utf8');
    if (/^\d+$/.test(tokenApplicationId) && tokenApplicationId !== clientID) {
        throw new Error('DISCORD_TOKEN belongs to a different Discord application than config.json clientID.');
    }

    return { ...settings, token, clientID };
}

module.exports = { loadConfig };

# Gelişmiş Slashlı Log Bot

## Deployment

The bot uses Node.js 18 or newer. Set the `DISCORD_TOKEN` environment variable in Railway's service Variables settings, then deploy with the `npm start` command. Do not put the bot token in `config.json` or commit it to Git.

The application ID (`clientID`) and owner ID (`ownerID`) stay in `config.json`. Run `npm run deploy-commands` to register slash commands separately when needed. Run `npm test` for the test suite. Enable the **Message Content** and **Server Members** privileged gateway intents for the application in the Discord Developer Portal.

For local development, provide `DISCORD_TOKEN` in the shell environment before starting the bot. The bot checks that it is present and matches the configured application ID before making Discord API requests. `DISCORD_RPC_CLIENT_ID` is optional and only enables local Discord RPC support.

If a token has been committed to a public repository, revoke it in the Discord Developer Portal and set a newly generated token as `DISCORD_TOKEN` in Railway.

- **events -> ready.js** dosyasından botun durumunu değiştirebilirsin.

# İletişim

Her türlü iletişim için Discord : [Void](https://discord.gg/dcbot) veya Larex#0001 Sentinel#0003


![](https://img.shields.io/github/stars/larexq/slash-destek) ![](https://img.shields.io/github/forks/larexq/slash-destek) ![](https://img.shields.io/github/v/tag/larexq/slash-destek) ![](https://img.shields.io/github/issues/larexq/slash-destek)

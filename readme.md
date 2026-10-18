# Gelişmiş Slashlı Log Bot

## Deployment

The bot uses Node.js 18 or newer. Set the `DISCORD_TOKEN` environment variable in Railway's service Variables settings, then deploy with the `npm start` command. Do not put the bot token in `config.json` or commit it to Git.

The application ID (`clientID`) and owner ID (`ownerID`) stay in `config.json`. Run `npm run deploy-commands` to register slash commands separately when needed. Run `npm test` for the test suite. Enable the **Message Content** and **Server Members** privileged gateway intents for the application in the Discord Developer Portal.

For local development, provide `DISCORD_TOKEN` in the shell environment before starting the bot. The bot checks that it is present and matches the configured application ID before making Discord API requests. `DISCORD_RPC_CLIENT_ID` is optional and only enables local Discord RPC support.

If a token has been committed to a public repository, revoke it in the Discord Developer Portal and set a newly generated token as `DISCORD_TOKEN` in Railway.

## Ticket transcript links

Manual ticket closures and the 48-hour automatic close use the same customer DM details. The HTML transcript is saved to persistent storage and the DM includes an **Open HTML Transcript** button instead of an HTML attachment. The transcript page includes ticket metadata, message search and participant filtering, attachment previews, replies, reactions, and a clear empty state.

Railway production needs a public service domain and a persistent volume mounted at `/data`. Set `TRANSCRIPT_STORAGE_DIR=/data/transcripts` and `TRANSCRIPT_BASE_URL=https://<your-railway-domain>` on the bot service. Transcript URLs use random, unlisted IDs and are served with no-cache/no-index headers. Anyone who receives a transcript URL can view that ticket, so customers should avoid sharing it publicly. Files remain on the volume until an operator removes them.

- **events -> ready.js** dosyasından botun durumunu değiştirebilirsin.

# İletişim

Her türlü iletişim için Discord : [Void](https://discord.gg/dcbot) veya Larex#0001 Sentinel#0003


![](https://img.shields.io/github/stars/larexq/slash-destek) ![](https://img.shields.io/github/forks/larexq/slash-destek) ![](https://img.shields.io/github/v/tag/larexq/slash-destek) ![](https://img.shields.io/github/issues/larexq/slash-destek)

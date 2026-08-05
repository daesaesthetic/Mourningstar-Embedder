# Mourningstar Embed System

A modular Discord bot built with discord.js v14, focused on embed generation, role management, and server utilities.

## Run & Operate

- `cd artifacts/discord-bot && node src/index.js` — run the bot (managed by the "Discord Bot — Mourningstar" workflow)
- `cd artifacts/discord-bot && node src/deploy-commands.js` — manually re-deploy slash commands (also runs automatically on startup)

## Stack

- pnpm workspaces, Node.js, discord.js v14
- Persistent storage: JSON file at `artifacts/discord-bot/data/db.json`
- No database required

## Where things live

- `artifacts/discord-bot/src/commands/` — one file per slash command
- `artifacts/discord-bot/src/events/` — Discord event handlers (ready, interactionCreate, messageReactionAdd/Remove)
- `artifacts/discord-bot/src/handlers/` — command & event auto-loaders
- `artifacts/discord-bot/src/lib/embedInteraction.js` — modal + button logic for /embed
- `artifacts/discord-bot/src/database/db.js` — JSON persistence helpers
- `artifacts/discord-bot/data/db.json` — runtime data (reaction roles, tickets)

## Commands

| Command | Category | Description |
|---|---|---|
| `/embed` | Embeds | Opens a modal editor; ephemeral preview with Send/Edit/Dismiss buttons |
| `/format` | Embeds | Discord formatting reference (mentions, timestamps, markdown) |
| `/help` | Info | Full command list |
| `/avatar [user]` | Media | High-quality avatar display |
| `/servericon` | Media | Server icon display |
| `/reactionrole` | Roles | Map emoji → role on any message (persistent) |
| `/role humans/bots/in` | Roles | Batch role assignment |
| `/speak` | Utility | Send a message as the bot |
| `/ticket create/close/claim` | Tickets | Private support ticket channels |

## Architecture decisions

- Embed editor uses Discord modals (5-field) + ephemeral message with action buttons so the editor stays visible after sending
- Reaction roles and ticket state persisted to JSON (no DB dependency)
- Slash commands auto-deployed on every bot startup via `deploy-commands.js`
- Staff role name for tickets is configurable via `TICKET_STAFF_ROLE` env var (defaults to "Staff")

## User preferences

_Populate as you build._

## Gotchas

- `DISCORD_GUILD_ID` env var enables guild-scoped (instant) command deployment instead of global (up to 1 hour)
- `TICKET_STAFF_ROLE` env var sets the staff role name used by `/ticket` (default: "Staff")
- Reaction role emoji must be accessible to the bot — custom emojis from other servers won't work
- `/role humans|bots|in` fetches all members; large servers may hit rate limits and take time

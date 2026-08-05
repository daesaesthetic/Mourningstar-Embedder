const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
  ],
});

client.commands = new Collection();
client.cooldowns = new Collection();

loadCommands(client);
loadEvents(client);

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('[FATAL] DISCORD_TOKEN is not set. Please add it to environment secrets.');
  process.exit(1);
}

client.login(token).catch((err) => {
  console.error('[FATAL] Failed to login:', err.message);
  process.exit(1);
});

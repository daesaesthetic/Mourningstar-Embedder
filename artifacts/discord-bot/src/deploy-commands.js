const { REST, Routes } = require('discord.js');
const path = require('path');
const fs = require('fs');

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID; // optional — set for faster dev deploys

if (!token || !clientId) {
  console.error('[FATAL] DISCORD_TOKEN and DISCORD_CLIENT_ID must be set.');
  process.exit(1);
}

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    commands.push(command.data.toJSON());
    console.log(`  Loaded command: ${command.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(token);

(async () => {
  try {
    console.log(`\nDeploying ${commands.length} slash commands...`);

    let data;
    if (guildId) {
      // Guild-scoped (instant update, dev mode)
      data = await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
      console.log(`✓ Deployed ${data.length} commands to guild ${guildId}`);
    } else {
      // Global (takes up to 1 hour to propagate)
      data = await rest.put(Routes.applicationCommands(clientId), { body: commands });
      console.log(`✓ Deployed ${data.length} commands globally`);
    }
  } catch (err) {
    console.error('[ERROR] Deploy failed:', err);
  }
})();

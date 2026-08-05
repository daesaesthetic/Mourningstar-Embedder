const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if (!command.data || !command.execute) {
      console.warn(`[WARN] Command file ${file} is missing data or execute export.`);
      continue;
    }
    client.commands.set(command.data.name, command);
    console.log(`[CMD] Registered: /${command.data.name}`);
  }
}

module.exports = { loadCommands };

const { ActivityType } = require('discord.js');

module.exports = {
  name: 'clientReady',
  once: true,
  execute(client) {
    client.user.setPresence({
      activities: [{ name: '/help | Mourningstar', type: ActivityType.Watching }],
      status: 'dnd',
    });

    console.log(`\n╔══════════════════════════════════════╗`);
    console.log(`║   Mourningstar Embed System — Online  ║`);
    console.log(`╠══════════════════════════════════════╣`);
    console.log(`║  Tag:    ${client.user.tag.padEnd(27)}║`);
    console.log(`║  Guilds: ${String(client.guilds.cache.size).padEnd(27)}║`);
    console.log(`║  Cmds:   ${String(client.commands.size).padEnd(27)}║`);
    console.log(`╚══════════════════════════════════════╝\n`);

    // Auto-deploy slash commands on startup
    const { execSync } = require('child_process');
    try {
      execSync('node src/deploy-commands.js', { stdio: 'inherit', cwd: process.cwd() });
    } catch (err) {
      console.error('[WARN] Auto-deploy failed:', err.message);
    }
  },
};

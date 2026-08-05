const { getReactionRole } = require('../database/db');

module.exports = {
  name: 'messageReactionRemove',
  once: false,
  async execute(reaction, user, client) {
    if (user.bot) return;

    if (reaction.partial) {
      try { await reaction.fetch(); } catch { return; }
    }
    if (reaction.message.partial) {
      try { await reaction.message.fetch(); } catch { return; }
    }

    const { guild } = reaction.message;
    if (!guild) return;

    const emojiKey = reaction.emoji.id
      ? `<:${reaction.emoji.name}:${reaction.emoji.id}>`
      : reaction.emoji.name;

    const roleId = getReactionRole(guild.id, reaction.message.id, emojiKey);
    if (!roleId) return;

    try {
      const member = await guild.members.fetch(user.id);
      if (member.roles.cache.has(roleId)) {
        await member.roles.remove(roleId);
        console.log(`[REACTION-ROLE] -${roleId} → ${user.tag}`);
      }
    } catch (err) {
      console.error('[REACTION-ROLE] Failed to remove role:', err.message);
    }
  },
};

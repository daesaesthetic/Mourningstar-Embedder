const { Collection, EmbedBuilder } = require('discord.js');

const COOLDOWN_DEFAULT = 3; // seconds

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    // ── Slash Commands ─────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) {
        return interaction.reply({ content: '❌ Unknown command.', ephemeral: true });
      }

      // Cooldown
      const { cooldowns } = client;
      if (!cooldowns.has(command.data.name)) cooldowns.set(command.data.name, new Collection());
      const now = Date.now();
      const timestamps = cooldowns.get(command.data.name);
      const cooldownAmount = (command.cooldown ?? COOLDOWN_DEFAULT) * 1000;

      if (timestamps.has(interaction.user.id)) {
        const exp = timestamps.get(interaction.user.id) + cooldownAmount;
        if (now < exp) {
          const remaining = ((exp - now) / 1000).toFixed(1);
          const e = new EmbedBuilder()
            .setColor(0xfee75c)
            .setDescription(`⏳ Please wait **${remaining}s** before using \`/${command.data.name}\` again.`)
            .setFooter({ text: 'Mourningstar • Rate Limited' });
          return interaction.reply({ embeds: [e], ephemeral: true });
        }
      }

      timestamps.set(interaction.user.id, now);
      setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

      try {
        await command.execute(interaction, client);
      } catch (err) {
        console.error(`[ERROR] /${command.data.name}:`, err);
        const e = new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle('Something went wrong')
          .setDescription('An unexpected error occurred while executing this command.')
          .setFooter({ text: 'Mourningstar • Error' });
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ embeds: [e], ephemeral: true });
        } else {
          await interaction.reply({ embeds: [e], ephemeral: true });
        }
      }
      return;
    }

    // ── Embed Modal Submit ──────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === 'embed_modal') {
      const embedCmd = require('../lib/embedInteraction');
      return embedCmd.handleModalSubmit(interaction);
    }

    // ── Embed Buttons ───────────────────────────────────────────────────
    if (interaction.isButton()) {
      const id = interaction.customId;
      if (id === 'embed_send' || id === 'embed_edit' || id === 'embed_dismiss') {
        const embedCmd = require('../lib/embedInteraction');
        return embedCmd.handleButton(interaction);
      }
    }
  },
};

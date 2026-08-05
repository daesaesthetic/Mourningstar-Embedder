const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  cooldown: 5,
  data: new SlashCommandBuilder()
    .setName('speak')
    .setDescription('Send a message as the bot')
    .addStringOption(opt =>
      opt.setName('message').setDescription('Message to send').setRequired(true).setMaxLength(2000))
    .addChannelOption(opt =>
      opt.setName('channel').setDescription('Target channel (defaults to current channel)').setRequired(false)),

  async execute(interaction) {
    const message = interaction.options.getString('message');
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const { member, guild } = interaction;

    const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

    // Block @everyone / @here unless admin
    if (!isAdmin && (message.includes('@everyone') || message.includes('@here'))) {
      return interaction.reply({
        content: '❌ You must be an **Administrator** to use `@everyone` or `@here`.',
        ephemeral: true,
      });
    }

    // Sanitize @everyone/@here for non-admins (extra safety)
    const sanitized = isAdmin
      ? message
      : message.replace(/@(everyone|here)/g, '@\u200b$1');

    // Check bot can send in target channel
    const botMember = await guild.members.fetchMe();
    if (!targetChannel.permissionsFor(botMember).has(PermissionFlagsBits.SendMessages)) {
      return interaction.reply({
        content: `❌ I don't have permission to send messages in ${targetChannel}.`,
        ephemeral: true,
      });
    }

    try {
      await targetChannel.send(sanitized);
      await interaction.reply({
        content: `✓ Message sent in ${targetChannel}.`,
        ephemeral: true,
      });
      console.log(`[SPEAK] ${member.user.tag} → #${targetChannel.name}: ${sanitized.slice(0, 80)}`);
    } catch (err) {
      await interaction.reply({
        content: `❌ Failed to send message: ${err.message}`,
        ephemeral: true,
      });
    }
  },
};

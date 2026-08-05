const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Display a user\'s avatar in full quality')
    .addUserOption(opt =>
      opt.setName('user').setDescription('Target user (defaults to you)').setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('user') || interaction.user;

    const avatarUrl = target.displayAvatarURL({ size: 4096, extension: 'png', forceStatic: false });

    const embed = new EmbedBuilder()
      .setColor(0x1a1a2e)
      .setTitle(`${target.username}'s Avatar`)
      .setDescription([
        `[PNG](${target.displayAvatarURL({ extension: 'png', size: 4096 })}) · ` +
        `[WEBP](${target.displayAvatarURL({ extension: 'webp', size: 4096 })}) · ` +
        `[JPG](${target.displayAvatarURL({ extension: 'jpg', size: 4096 })})`,
      ].join('\n'))
      .setImage(avatarUrl)
      .setFooter({ text: `ID: ${target.id} • Mourningstar` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

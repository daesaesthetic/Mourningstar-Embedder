const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('servericon')
    .setDescription('Display the current server icon in full quality'),

  async execute(interaction) {
    const { guild } = interaction;

    if (!guild.iconURL()) {
      return interaction.reply({
        content: '❌ This server does not have an icon set.',
        ephemeral: true,
      });
    }

    const iconUrl = guild.iconURL({ size: 4096, extension: 'png', forceStatic: false });

    const embed = new EmbedBuilder()
      .setColor(0x1a1a2e)
      .setTitle(`${guild.name} — Server Icon`)
      .setDescription(
        `[PNG](${guild.iconURL({ extension: 'png', size: 4096 })}) · ` +
        `[WEBP](${guild.iconURL({ extension: 'webp', size: 4096 })}) · ` +
        `[JPG](${guild.iconURL({ extension: 'jpg', size: 4096 })})`
      )
      .setImage(iconUrl)
      .setFooter({ text: `Server ID: ${guild.id} • Mourningstar` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

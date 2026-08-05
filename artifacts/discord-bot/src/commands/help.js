const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Display all commands and their usage'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x1a1a2e)
      .setTitle('Mourningstar Embed System — Command List')
      .setDescription('A clean, powerful server toolkit. All commands use slash syntax.')
      .addFields(
        {
          name: '🎨 Embed Tools',
          value: [
            '`/embed` — Build and send a fully custom embed',
            '`/format` — Discord formatting & syntax reference',
          ].join('\n'),
        },
        {
          name: '🖼️ Media & Info',
          value: [
            '`/avatar [user]` — Display a user\'s avatar in full quality',
            '`/servericon` — Display the server icon',
          ].join('\n'),
        },
        {
          name: '🎭 Role Management',
          value: [
            '`/reactionrole` — Create a reaction → role mapping on a message',
            '`/role humans <role>` — Assign a role to all human members',
            '`/role bots <role>` — Assign a role to all bots',
            '`/role in <target-role> <role>` — Assign a role to members with a specific role',
          ].join('\n'),
        },
        {
          name: '🛠️ Utility',
          value: [
            '`/speak <message> [channel]` — Send a message as the bot',
          ].join('\n'),
        },
        {
          name: '🎫 Ticket System',
          value: [
            '`/ticket create` — Open a private support ticket',
            '`/ticket close` — Close and archive the current ticket',
            '`/ticket claim` — Claim the current ticket as a staff member',
          ].join('\n'),
        },
      )
      .setFooter({ text: 'Mourningstar • /help' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

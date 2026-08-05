const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('format')
    .setDescription('Discord formatting reference — mentions, timestamps, markdown & more'),

  async execute(interaction) {
    const now = Math.floor(Date.now() / 1000);

    const embed = new EmbedBuilder()
      .setColor(0x1a1a2e)
      .setTitle('Discord Formatting Reference')
      .setDescription('A complete guide to Discord markdown, mentions, and special syntax.')
      .addFields(
        {
          name: '👤 Mentions',
          value: [
            '`<@USER_ID>` → <@1234567890> — User mention',
            '`<#CHANNEL_ID>` → <#1234567890> — Channel mention',
            '`<@&ROLE_ID>` → <@&1234567890> — Role mention',
          ].join('\n'),
        },
        {
          name: '😀 Custom Emoji',
          value: [
            '`<:name:EMOJI_ID>` — Static custom emoji',
            '`<a:name:EMOJI_ID>` — Animated custom emoji',
            'To get an emoji ID: type `\\:emojiname:` in chat',
          ].join('\n'),
        },
        {
          name: '🕐 Timestamps',
          value: [
            `\`<t:UNIX>\` → <t:${now}> — Default (relative)`,
            `\`<t:UNIX:F>\` → <t:${now}:F> — Full date & time`,
            `\`<t:UNIX:D>\` → <t:${now}:D> — Short date`,
            `\`<t:UNIX:T>\` → <t:${now}:T> — Short time`,
            `\`<t:UNIX:R>\` → <t:${now}:R> — Relative time`,
            '**Get UNIX:** [epochconverter.com](https://www.epochconverter.com)',
          ].join('\n'),
        },
        {
          name: '📝 Text Formatting',
          value: [
            '`**text**` → **bold**',
            '`*text*` → *italic*',
            '`__text__` → __underline__',
            '`~~text~~` → ~~strikethrough~~',
            '`||text||` → ||spoiler||',
            '`> text` → blockquote',
            '`# text` → Heading 1',
            '`## text` → Heading 2',
            '`### text` → Heading 3',
          ].join('\n'),
        },
        {
          name: '💻 Code Blocks',
          value: [
            '\\`inline code\\` → `inline code`',
            '\\`\\`\\`language' + '\ncode block\n' + '\\`\\`\\`',
            'Supported: js, py, ts, css, json, bash, sql, yaml…',
          ].join('\n'),
        },
        {
          name: '🔗 Links & IDs',
          value: [
            'Enable **Developer Mode**: User Settings → Advanced → Developer Mode',
            'Right-click any user/channel/message → **Copy ID**',
            '`[text](url)` → Hyperlink *(only works in embeds)*',
          ].join('\n'),
        },
      )
      .setFooter({ text: 'Mourningstar • Formatting Reference' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

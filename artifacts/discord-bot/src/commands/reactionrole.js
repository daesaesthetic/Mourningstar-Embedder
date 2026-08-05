const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addReactionRole } = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Attach a reaction → role mapping to a message')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addStringOption(opt =>
      opt.setName('message_id').setDescription('ID of the target message').setRequired(true))
    .addStringOption(opt =>
      opt.setName('emoji').setDescription('Emoji to react with (Unicode or custom <:name:id>)').setRequired(true))
    .addRoleOption(opt =>
      opt.setName('role').setDescription('Role to assign/remove on react').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const messageId = interaction.options.getString('message_id');
    const emojiInput = interaction.options.getString('emoji').trim();
    const role = interaction.options.getRole('role');
    const { guild, channel } = interaction;

    // Permission check
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.editReply('❌ I need the **Manage Roles** permission to assign roles.');
    }
    if (role.position >= botMember.roles.highest.position) {
      return interaction.editReply('❌ That role is higher than or equal to my highest role — I cannot assign it.');
    }
    if (role.managed) {
      return interaction.editReply('❌ That role is managed by an integration and cannot be assigned manually.');
    }

    // Fetch the target message
    let targetMessage;
    try {
      targetMessage = await channel.messages.fetch(messageId);
    } catch {
      return interaction.editReply('❌ Could not find that message in this channel. Make sure the ID is correct and the message is in this channel.');
    }

    // Resolve emoji key
    let emojiKey;
    const customEmojiMatch = emojiInput.match(/^<a?:(\w+):(\d+)>$/);
    if (customEmojiMatch) {
      emojiKey = emojiInput; // Store full custom emoji string
    } else {
      emojiKey = emojiInput; // Unicode emoji
    }

    // Add reaction to message
    try {
      const reactEmoji = customEmojiMatch ? customEmojiMatch[2] : emojiInput;
      await targetMessage.react(reactEmoji);
    } catch {
      return interaction.editReply('❌ Could not react with that emoji. Make sure it\'s a valid emoji the bot has access to.');
    }

    // Persist mapping
    addReactionRole(guild.id, messageId, emojiKey, role.id);

    const confirmEmbed = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle('Reaction Role Created')
      .addFields(
        { name: 'Message', value: `[Jump to message](${targetMessage.url})`, inline: true },
        { name: 'Emoji', value: emojiKey, inline: true },
        { name: 'Role', value: `${role}`, inline: true },
      )
      .setFooter({ text: 'Mourningstar • Reaction Roles' })
      .setTimestamp();

    await interaction.editReply({ embeds: [confirmEmbed] });

    console.log(`[REACTION-ROLE] Created: msg=${messageId} emoji=${emojiKey} role=${role.id} guild=${guild.id}`);
  },
};

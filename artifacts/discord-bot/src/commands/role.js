const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

async function batchAssignRole(members, role, botHighest) {
  let added = 0;
  let skipped = 0;
  const errors = [];

  for (const member of members) {
    if (member.roles.cache.has(role.id)) { skipped++; continue; }
    if (member.roles.highest.position >= botHighest.position) { skipped++; continue; }
    try {
      await member.roles.add(role, 'Batch role assignment via /role');
      added++;
    } catch (err) {
      errors.push(member.user.tag);
    }
  }

  return { added, skipped, errors };
}

module.exports = {
  cooldown: 10,
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Batch role assignment utilities')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .addSubcommand(sub =>
      sub.setName('humans')
        .setDescription('Assign a role to all human members')
        .addRoleOption(opt => opt.setName('role').setDescription('Role to assign').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('bots')
        .setDescription('Assign a role to all bots')
        .addRoleOption(opt => opt.setName('role').setDescription('Role to assign').setRequired(true)))
    .addSubcommand(sub =>
      sub.setName('in')
        .setDescription('Assign a role to all members who have a specific role')
        .addRoleOption(opt => opt.setName('target_role').setDescription('Source role (members must have this)').setRequired(true))
        .addRoleOption(opt => opt.setName('role').setDescription('Role to assign').setRequired(true))),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const sub = interaction.options.getSubcommand();
    const role = interaction.options.getRole('role');
    const { guild } = interaction;

    // Permission checks
    const botMember = await guild.members.fetchMe();
    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.editReply('❌ I need the **Manage Roles** permission.');
    }
    if (role.position >= botMember.roles.highest.position) {
      return interaction.editReply('❌ That role is higher than or equal to my highest role.');
    }
    if (role.managed) {
      return interaction.editReply('❌ That role is managed by an integration.');
    }

    // Fetch all members
    await guild.members.fetch();

    let targets;
    if (sub === 'humans') {
      targets = guild.members.cache.filter(m => !m.user.bot);
    } else if (sub === 'bots') {
      targets = guild.members.cache.filter(m => m.user.bot);
    } else if (sub === 'in') {
      const targetRole = interaction.options.getRole('target_role');
      targets = guild.members.cache.filter(m => m.roles.cache.has(targetRole.id));
    }

    const memberArray = [...targets.values()];
    if (memberArray.length === 0) {
      return interaction.editReply('❌ No members match the criteria.');
    }

    await interaction.editReply(`⏳ Processing ${memberArray.length} members… this may take a moment.`);

    const { added, skipped, errors } = await batchAssignRole(memberArray, role, botMember.roles.highest);

    const resultEmbed = new EmbedBuilder()
      .setColor(errors.length > 0 ? 0xfee75c : 0x57f287)
      .setTitle(`Batch Role Assignment — /role ${sub}`)
      .addFields(
        { name: 'Role', value: `${role}`, inline: true },
        { name: 'Members Processed', value: String(memberArray.length), inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: '✅ Added', value: String(added), inline: true },
        { name: '⏭️ Skipped', value: String(skipped), inline: true },
        { name: '❌ Errors', value: String(errors.length), inline: true },
      )
      .setFooter({ text: 'Mourningstar • Role Management' })
      .setTimestamp();

    if (errors.length > 0) {
      resultEmbed.addFields({
        name: 'Failed Members',
        value: errors.slice(0, 10).join(', ') + (errors.length > 10 ? ` and ${errors.length - 10} more…` : ''),
      });
    }

    console.log(`[ROLE/${sub.toUpperCase()}] role=${role.id} added=${added} skipped=${skipped} errors=${errors.length}`);

    await interaction.editReply({ content: '', embeds: [resultEmbed] });
  },
};

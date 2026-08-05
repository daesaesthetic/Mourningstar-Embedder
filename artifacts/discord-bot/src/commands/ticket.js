const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  ChannelType,
  OverwriteType,
} = require('discord.js');
const { createTicket, getTicket, updateTicket, getNextTicketNumber } = require('../database/db');

const STAFF_ROLE_NAME = process.env.TICKET_STAFF_ROLE || 'Staff';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Support ticket system')
    .addSubcommand(sub =>
      sub.setName('create').setDescription('Open a new private support ticket'))
    .addSubcommand(sub =>
      sub.setName('close').setDescription('Close and lock the current ticket'))
    .addSubcommand(sub =>
      sub.setName('claim').setDescription('Claim this ticket as a staff member')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const { guild, member, channel } = interaction;

    if (sub === 'create') {
      await interaction.deferReply({ ephemeral: true });

      // Check for existing open tickets by this user
      const existing = guild.channels.cache.find(ch =>
        ch.name.startsWith('ticket-') &&
        ch.permissionsFor(member).has(PermissionFlagsBits.ViewChannel) &&
        getTicket(ch.id)?.userId === member.id &&
        getTicket(ch.id)?.status === 'open'
      );

      if (existing) {
        return interaction.editReply(`❌ You already have an open ticket: ${existing}`);
      }

      const ticketNum = getNextTicketNumber(guild.id);
      const channelName = `ticket-${String(ticketNum).padStart(4, '0')}`;

      // Find staff role
      const staffRole = guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);

      // Build permission overwrites
      const overwrites = [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
          ],
        },
      ];

      if (staffRole) {
        overwrites.push({
          id: staffRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.AttachFiles,
            PermissionFlagsBits.ManageMessages,
          ],
        });
      }

      // Add bot itself
      const botMember = await guild.members.fetchMe();
      overwrites.push({
        id: botMember.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
          PermissionFlagsBits.ManageChannels,
        ],
      });

      let ticketChannel;
      try {
        ticketChannel = await guild.channels.create({
          name: channelName,
          type: ChannelType.GuildText,
          topic: `Support ticket for ${member.user.tag} | Ticket #${ticketNum}`,
          permissionOverwrites: overwrites,
        });
      } catch (err) {
        return interaction.editReply(`❌ Failed to create ticket channel: ${err.message}`);
      }

      // Persist ticket
      createTicket(ticketChannel.id, member.id, guild.id, ticketNum);

      // Send welcome message in ticket channel
      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x1a1a2e)
        .setTitle(`Ticket #${ticketNum}`)
        .setDescription(
          `Welcome, ${member}.\n\nA staff member will be with you shortly. ` +
          `Please describe your issue in detail.\n\n` +
          `**Commands:**\n` +
          `\`/ticket claim\` — Staff: claim this ticket\n` +
          `\`/ticket close\` — Close this ticket`
        )
        .addFields(
          { name: 'Opened By', value: `${member}`, inline: true },
          { name: 'Ticket #', value: String(ticketNum), inline: true },
          { name: 'Status', value: '🟢 Open', inline: true },
        )
        .setFooter({ text: 'Mourningstar • Ticket System' })
        .setTimestamp();

      await ticketChannel.send({
        content: staffRole ? `${staffRole} — new ticket opened` : `${member} — ticket opened`,
        embeds: [welcomeEmbed],
      });

      await interaction.editReply(`✅ Your ticket has been created: ${ticketChannel}`);
      console.log(`[TICKET] Created #${ticketNum} by ${member.user.tag} in ${guild.name}`);

    } else if (sub === 'close') {
      const ticket = getTicket(channel.id);
      if (!ticket) {
        return interaction.reply({ content: '❌ This is not a ticket channel.', ephemeral: true });
      }
      if (ticket.status === 'closed') {
        return interaction.reply({ content: '❌ This ticket is already closed.', ephemeral: true });
      }

      // Permission: ticket owner or staff
      const staffRole = guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);
      const isStaff = staffRole ? member.roles.cache.has(staffRole.id) : false;
      const isOwner = ticket.userId === member.id;
      const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

      if (!isOwner && !isStaff && !isAdmin) {
        return interaction.reply({ content: '❌ Only the ticket owner or staff can close this ticket.', ephemeral: true });
      }

      await interaction.deferReply();

      updateTicket(channel.id, { status: 'closed', closedBy: member.id, closedAt: new Date().toISOString() });

      const closeEmbed = new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle('Ticket Closed')
        .setDescription(`This ticket has been closed by ${member}.`)
        .addFields(
          { name: 'Closed By', value: `${member}`, inline: true },
          { name: 'Status', value: '🔴 Closed', inline: true },
        )
        .setFooter({ text: 'Mourningstar • Ticket System' })
        .setTimestamp();

      await interaction.editReply({ embeds: [closeEmbed] });

      // Lock the channel after a brief delay
      setTimeout(async () => {
        try {
          await channel.permissionOverwrites.edit(ticket.userId, { SendMessages: false });
          await channel.setName(`closed-${channel.name}`);
        } catch {}
      }, 3000);

      console.log(`[TICKET] Closed by ${member.user.tag} in ${guild.name}`);

    } else if (sub === 'claim') {
      const ticket = getTicket(channel.id);
      if (!ticket) {
        return interaction.reply({ content: '❌ This is not a ticket channel.', ephemeral: true });
      }
      if (ticket.status === 'closed') {
        return interaction.reply({ content: '❌ This ticket is already closed.', ephemeral: true });
      }

      // Permission: staff or admin only
      const staffRole = guild.roles.cache.find(r => r.name === STAFF_ROLE_NAME);
      const isStaff = staffRole ? member.roles.cache.has(staffRole.id) : false;
      const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

      if (!isStaff && !isAdmin) {
        return interaction.reply({ content: `❌ Only members with the **${STAFF_ROLE_NAME}** role can claim tickets.`, ephemeral: true });
      }

      if (ticket.claimedBy) {
        const claimedMember = await guild.members.fetch(ticket.claimedBy).catch(() => null);
        return interaction.reply({
          content: `❌ This ticket is already claimed by ${claimedMember || `<@${ticket.claimedBy}>`}.`,
          ephemeral: true,
        });
      }

      updateTicket(channel.id, { claimedBy: member.id, claimedAt: new Date().toISOString() });

      const claimEmbed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle('Ticket Claimed')
        .setDescription(`${member} has claimed this ticket and will handle your request.`)
        .addFields(
          { name: 'Claimed By', value: `${member}`, inline: true },
          { name: 'Status', value: '🟣 Claimed', inline: true },
        )
        .setFooter({ text: 'Mourningstar • Ticket System' })
        .setTimestamp();

      await interaction.reply({ embeds: [claimEmbed] });
      console.log(`[TICKET] Claimed by ${member.user.tag} in ${guild.name}`);
    }
  },
};

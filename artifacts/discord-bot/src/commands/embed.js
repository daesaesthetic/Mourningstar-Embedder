const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');

// In-memory session store: userId → { title, description, color, footer, image }
const sessions = new Map();

const PRESETS = {
  black:   0x000000,
  white:   0xffffff,
  red:     0xff0000,
  green:   0x00ff00,
  blue:    0x0000ff,
  yellow:  0xffff00,
  purple:  0x800080,
  orange:  0xffa500,
  pink:    0xff69b4,
  blurple: 0x5865f2,
  dark:    0x1a1a2e,
  gold:    0xffd700,
};

function resolveColor(input) {
  if (!input || input.trim() === '') return 0x1a1a2e;
  const lower = input.trim().toLowerCase();
  if (PRESETS[lower] !== undefined) return PRESETS[lower];
  const hex = lower.replace('#', '');
  if (/^[0-9a-f]{6}$/i.test(hex)) return parseInt(hex, 16);
  return null;
}

function buildModal(data = {}) {
  return new ModalBuilder()
    .setCustomId('embed_modal')
    .setTitle('Embed Editor — Mourningstar')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('embed_title')
          .setLabel('Title')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(256)
          .setRequired(true)
          .setValue(data.title || ''),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('embed_description')
          .setLabel('Description')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(4000)
          .setRequired(true)
          .setValue(data.description || ''),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('embed_color')
          .setLabel('Color (hex or preset name)')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(32)
          .setRequired(false)
          .setValue(data.color || ''),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('embed_image')
          .setLabel('Image URL (optional)')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(512)
          .setRequired(false)
          .setValue(data.image || ''),
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('embed_footer')
          .setLabel('Footer text (optional)')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(2048)
          .setRequired(false)
          .setValue(data.footer || ''),
      ),
    );
}

function buildEmbedFromData(data) {
  const embed = new EmbedBuilder()
    .setTitle(data.title)
    .setDescription(data.description)
    .setColor(data.resolvedColor ?? 0x1a1a2e)
    .setTimestamp();
  if (data.image)  embed.setImage(data.image);
  if (data.footer) embed.setFooter({ text: data.footer });
  return embed;
}

function buildButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('embed_send')
      .setLabel('Send to Channel')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('embed_edit')
      .setLabel('Edit')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('embed_dismiss')
      .setLabel('Dismiss')
      .setStyle(ButtonStyle.Danger),
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('embed')
    .setDescription('Open the embed editor'),

  async execute(interaction) {
    // Show a blank modal to start
    await interaction.showModal(buildModal({}));
  },

  buildModal,
  buildEmbedFromData,
  buildButtons,
  resolveColor,
  sessions,
};

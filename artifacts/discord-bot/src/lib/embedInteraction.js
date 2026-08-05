const { EmbedBuilder } = require('discord.js');
const { buildModal, buildEmbedFromData, buildButtons, resolveColor, sessions } = require('../commands/embed');

// ── Modal Submit ────────────────────────────────────────────────────────────

async function handleModalSubmit(interaction) {
  const title       = interaction.fields.getTextInputValue('embed_title').trim();
  const description = interaction.fields.getTextInputValue('embed_description').trim();
  const colorRaw    = interaction.fields.getTextInputValue('embed_color').trim();
  const image       = interaction.fields.getTextInputValue('embed_image').trim();
  const footer      = interaction.fields.getTextInputValue('embed_footer').trim();

  // Validate color
  const resolvedColor = resolveColor(colorRaw);
  if (colorRaw && resolvedColor === null) {
    return interaction.reply({
      content: `❌ Invalid color: \`${colorRaw}\`.\nUse a hex like \`#5865f2\` or a preset: black, red, green, blue, purple, blurple, dark, gold, orange, pink…`,
      ephemeral: true,
    });
  }

  // Validate image URL
  const urlPattern = /^https?:\/\/.+/i;
  if (image && !urlPattern.test(image)) {
    return interaction.reply({
      content: '❌ Image must be a valid URL starting with `http://` or `https://`.',
      ephemeral: true,
    });
  }

  const data = { title, description, color: colorRaw, image, footer, resolvedColor };

  // Save session so buttons can reference the latest data
  sessions.set(interaction.user.id, data);

  const previewEmbed = buildEmbedFromData(data);
  const editorNote   = buildEditorNote(colorRaw);

  await interaction.reply({
    content: editorNote,
    embeds: [previewEmbed],
    components: [buildButtons()],
    ephemeral: true,
  });
}

// ── Button Interactions ─────────────────────────────────────────────────────

async function handleButton(interaction) {
  const userId = interaction.user.id;
  const id     = interaction.customId;

  if (id === 'embed_send') {
    const data = sessions.get(userId);
    if (!data) {
      return interaction.update({
        content: '❌ Session expired — please run `/embed` again.',
        embeds: [],
        components: [],
      });
    }

    // Send to channel
    try {
      const embed = buildEmbedFromData(data);
      await interaction.channel.send({ embeds: [embed] });
    } catch (err) {
      return interaction.update({
        content: `❌ Failed to send: ${err.message}`,
        embeds: [buildEmbedFromData(data)],
        components: [buildButtons()],
      });
    }

    // Keep the editor open — just update the status line
    const sentAt = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const previewEmbed = buildEmbedFromData(data);

    await interaction.update({
      content: buildEditorNote(data.color, `✅ Sent at **${sentAt}** — editor still open`),
      embeds: [previewEmbed],
      components: [buildButtons()],
    });
  }

  else if (id === 'embed_edit') {
    // Show modal pre-filled with current session data
    const data = sessions.get(userId) || {};
    await interaction.showModal(buildModal(data));
    // The modal submission will create a new interaction handled by handleModalSubmit.
    // We need to update this message so the user knows the modal opened.
    // (Discord handles this automatically — showing the modal IS the response.)
  }

  else if (id === 'embed_dismiss') {
    sessions.delete(userId);
    await interaction.update({
      content: '✕ Embed editor dismissed.',
      embeds: [],
      components: [],
    });
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function buildEditorNote(colorRaw, extra = '') {
  const parts = ['**Embed Editor** — preview below'];
  if (colorRaw) parts.push(`Color: \`${colorRaw}\``);
  if (extra)    parts.push(extra);
  parts.push('-# Click **Edit** to change fields · **Send** to post · **Dismiss** to close');
  return parts.join('\n');
}

module.exports = { handleModalSubmit, handleButton };

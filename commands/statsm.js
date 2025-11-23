const { SlashCommandBuilder } = require('discord.js');

// Role ID that can use commands
const ALLOWED_ROLE_ID = "1438249316559884499";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('statsm')
    .setDescription('Check monthly media statistics (Placeholder)'),
  
  async execute(interaction) {
    // Check if user has the allowed role
    const member = interaction.member;
    const hasAllowedRole = member.roles.cache.has(ALLOWED_ROLE_ID);
    
    if (!hasAllowedRole) {
      await interaction.editReply('❌ You do not have permission to use this command!');
      return;
    }

    const statusEmbed = {
      title: "📅 MONTHLY MEDIA STATISTICS",
      color: 0x9B59B6,
      description: "**Currently tracking last 7 days only**\n\nMonthly statistics feature is in development and requires database storage for historical data tracking.",
      fields: [
        {
          name: "📊 CURRENT SYSTEM",
          value: "• Last 7 days scanning\n• 50 channels + 4 forums\n• Media: Attachments + Embeds\n• Weekly automated reports",
          inline: false
        },
        {
          name: "🔄 MANUAL REPORT",
          value: "Use `/stats` for current week",
          inline: true
        },
        {
          name: "📈 STATUS",
          value: "Use `/status` for bot info",
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "Monthly tracking coming in future update"
      }
    };

    await interaction.editReply({ embeds: [statusEmbed] });
  },
};

const { SlashCommandBuilder } = require('discord.js');

// Role ID that can use commands
const ALLOWED_ROLE_ID = "1438249316559884499";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status-month')
    .setDescription('Check monthly attachment statistics'),
  
  async execute(interaction) {
    // Check if user has the allowed role
    const member = interaction.member;
    const hasAllowedRole = member.roles.cache.has(ALLOWED_ROLE_ID);
    
    if (!hasAllowedRole) {
      await interaction.reply({ 
        content: '❌ You do not have permission to use this command!', 
        ephemeral: true 
      });
      return;
    }

    await interaction.reply({ 
      content: '📊 Generating monthly statistics...', 
      ephemeral: true 
    });

    // This would need to be implemented with database storage
    // For now, we'll show a placeholder with instructions
    const statusEmbed = {
      title: "📅 MONTHLY ATTACHMENT STATISTICS",
      color: 0x9B59B6,
      description: "Monthly tracking requires database storage. Currently scanning last 7 days only.",
      fields: [
        {
          name: "🟡 Status",
          value: "Feature in Development",
          inline: false
        },
        {
          name: "📈 Current Scope",
          value: "Last 7 Days Only",
          inline: true
        },
        {
          name: "🗓️ Monthly Tracking",
          value: "Coming Soon",
          inline: true
        },
        {
          name: "💾 Storage",
          value: "Requires Database",
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "Monthly statistics will be available in future update"
      }
    };

    await interaction.editReply({ 
      content: null,
      embeds: [statusEmbed] 
    });
  },
};

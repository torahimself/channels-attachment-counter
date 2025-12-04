const { SlashCommandBuilder } = require('discord.js');

// Role ID that can use commands
const ALLOWED_ROLE_ID = "1438249316559884499";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check bot status and next report time'),
  
  async execute(interaction) {
    // Check if user has the allowed role
    const member = interaction.member;
    const hasAllowedRole = member.roles.cache.has(ALLOWED_ROLE_ID);
    
    if (!hasAllowedRole) {
      await interaction.editReply('❌ You do not have permission to use this command!');
      return;
    }

    const now = new Date();
    const nextFriday = new Date();
    const nextMonthStart = new Date();
    
    // Calculate next Friday 2:00 PM Riyadh time
    nextFriday.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);
    nextFriday.setHours(14, 0, 0, 0); // 2 PM Riyadh time
    
    // Calculate 1st of next month 2:00 PM Riyadh time
    nextMonthStart.setMonth(now.getMonth() + 1, 1);
    nextMonthStart.setHours(14, 0, 0, 0);
    
    // Calculate time until next Friday report
    const timeUntilFriday = nextFriday.getTime() - now.getTime();
    const daysUntilFriday = Math.floor(timeUntilFriday / (1000 * 60 * 60 * 24));
    const hoursUntilFriday = Math.floor((timeUntilFriday % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesUntilFriday = Math.floor((timeUntilFriday % (1000 * 60 * 60)) / (1000 * 60));
    
    // Calculate time until next monthly report
    const timeUntilMonthly = nextMonthStart.getTime() - now.getTime();
    const daysUntilMonthly = Math.floor(timeUntilMonthly / (1000 * 60 * 60 * 24));
    const hoursUntilMonthly = Math.floor((timeUntilMonthly % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const statusEmbed = {
      title: "🤖 Attachment Counter Bot Status",
      color: 0x00AE86,
      fields: [
        {
          name: "🟢 Bot Status",
          value: "Operational ✅",
          inline: true
        },
        {
          name: "📊 Next Weekly Report",
          value: `<t:${Math.floor(nextFriday.getTime() / 1000)}:F>`,
          inline: true
        },
        {
          name: "📅 Next Monthly Report",
          value: `<t:${Math.floor(nextMonthStart.getTime() / 1000)}:F>`,
          inline: true
        },
        {
          name: "⏰ Time Until Weekly",
          value: `${daysUntilFriday}d ${hoursUntilFriday}h ${minutesUntilFriday}m`,
          inline: true
        },
        {
          name: "📅 Time Until Monthly",
          value: `${daysUntilMonthly} days ${hoursUntilMonthly} hours`,
          inline: true
        },
        {
          name: "📁 Channels Monitored",
          value: "50 channels + 4 forums",
          inline: true
        },
        {
          name: "👥 Tracked Roles",
          value: "7 roles",
          inline: true
        },
        {
          name: "🕒 Weekly Schedule",
          value: "Every Friday 2:00 PM Riyadh Time",
          inline: true
        },
        {
          name: "📅 Monthly Schedule",
          value: "1st of each month 2:00 PM Riyadh Time",
          inline: true
        }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: "Use /stats for weekly or /statsm for monthly reports"
      }
    };

    await interaction.editReply({ embeds: [statusEmbed] });
  },
};

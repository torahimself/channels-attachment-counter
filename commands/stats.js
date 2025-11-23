const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Role ID that can use /stats command
const ALLOWED_ROLE_ID = "1438249316559884499";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Generate manual attachment report (Last 7 days)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction, scheduler = null) {
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

    if (!scheduler) {
      await interaction.reply({ 
        content: '❌ Scheduler not available yet. Please try again in a moment.', 
        ephemeral: true 
      });
      return;
    }
    
    await scheduler.generateManualReport(interaction);
  },
};

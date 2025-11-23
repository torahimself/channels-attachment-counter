const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Role ID that can use /stats command
const ALLOWED_ROLE_ID = "1438249316559884499";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Generate manual media report (Last 7 days)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction, scheduler = null) {
    console.log(`🔧 /stats command received from ${interaction.user.tag}`);
    
    // Check if user has the allowed role
    const member = interaction.member;
    const hasAllowedRole = member.roles.cache.has(ALLOWED_ROLE_ID);
    
    if (!hasAllowedRole) {
      console.log(`🚫 User ${interaction.user.tag} does not have permission for /stats`);
      await interaction.reply({ 
        content: '❌ You do not have permission to use this command!', 
        ephemeral: true 
      });
      return;
    }

    console.log(`✅ User ${interaction.user.tag} has permission, proceeding with /stats`);

    if (!scheduler) {
      console.log('❌ Scheduler not available for /stats command');
      await interaction.reply({ 
        content: '❌ Scheduler not available yet. Please try again in a moment.', 
        ephemeral: true 
      });
      return;
    }
    
    console.log('🔄 Starting manual report via /stats command');
    await scheduler.generateManualReport(interaction);
  },
};

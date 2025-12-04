const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

// Role ID that can use commands
const ALLOWED_ROLE_ID = "1438249316559884499";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('statsm')
    .setDescription('Generate monthly media report')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  
  async execute(interaction, scheduler = null) {
    console.log(`🔧 /statsm command received from ${interaction.user.tag}`);
    
    // Check if user has the allowed role
    const member = interaction.member;
    const hasAllowedRole = member.roles.cache.has(ALLOWED_ROLE_ID);
    
    if (!hasAllowedRole) {
      console.log(`🚫 User ${interaction.user.tag} does not have permission for /statsm`);
      await interaction.editReply('❌ You do not have permission to use this command!');
      return;
    }

    console.log(`✅ User ${interaction.user.tag} has permission, proceeding with /statsm`);
    
    // The scheduler should now be provided by interactionCreate.js
    // If it's still null, we'll handle it here
    if (!scheduler) {
      console.log('❌ Scheduler parameter is NULL in statsm command');
      console.log(`🔍 Checking client.scheduler:`, interaction.client.scheduler ? 'EXISTS' : 'NULL');
      
      await interaction.editReply('❌ Scheduler is not available. The bot may still be initializing. Please wait 10 seconds and try again, or restart the bot.');
      return;
    }
    
    console.log('🔄 Starting manual monthly report via /statsm command');
    console.log(`🔍 Scheduler type: ${scheduler.constructor.name}`);
    
    try {
      await scheduler.generateManualMonthlyReport(interaction);
    } catch (error) {
      console.error(`❌ Error in generateManualMonthlyReport:`, error.message);
      console.error(`🔍 Error stack:`, error.stack);
      await interaction.editReply('❌ Failed to generate monthly report. Check bot logs for details.');
    }
  },
};

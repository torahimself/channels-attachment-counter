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
    
    const member = interaction.member;
    const hasAllowedRole = member.roles.cache.has(ALLOWED_ROLE_ID);
    
    if (!hasAllowedRole) {
      console.log(`🚫 User ${interaction.user.tag} does not have permission for /statsm`);
      await interaction.editReply('❌ You do not have permission to use this command!');
      return;
    }

    console.log(`✅ User ${interaction.user.tag} has permission, proceeding with /statsm`);
    
    // Get scheduler from parameter or client
    let activeScheduler = scheduler || interaction.client.scheduler;
    
    console.log(`🔍 Scheduler object:`, activeScheduler ? 'Exists' : 'NULL');
    
    if (!activeScheduler) {
      console.log('❌ Scheduler not available for /statsm command');
      await interaction.editReply('❌ Scheduler is not available. The bot is still initializing. Please wait 30 seconds and try again, or check the bot logs.');
      return;
    }
    
    console.log('🔄 Starting manual monthly report via /statsm command');
    
    try {
      await activeScheduler.generateManualMonthlyReport(interaction);
    } catch (error) {
      console.error(`❌ Error in generateManualMonthlyReport:`, error.message);
      console.error(`🔍 Error stack:`, error.stack);
      await interaction.editReply('❌ Failed to generate monthly report. Check bot logs for details.');
    }
  },
};

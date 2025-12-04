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

    // Try to get scheduler from parameter first, then from client
    let activeScheduler = scheduler;
    
    // If scheduler parameter is null, try to get it from client
    if (!activeScheduler && interaction.client.scheduler) {
      activeScheduler = interaction.client.scheduler;
      console.log(`✅ Retrieved scheduler from client object`);
    }
    
    // Debug: Check what scheduler looks like
    console.log(`🔍 Scheduler object:`, activeScheduler ? 'Exists' : 'NULL');
    console.log(`🔍 Scheduler type:`, typeof activeScheduler);
    
    if (!activeScheduler) {
      console.log('❌ Scheduler not available for /statsm command');
      console.log(`🔍 Client object has scheduler:`, interaction.client.scheduler ? 'YES' : 'NO');
      console.log(`🔍 Client properties:`, Object.keys(interaction.client).slice(0, 10));
      
      await interaction.editReply('❌ Scheduler is not available. The bot may still be initializing or there was an error.');
      return;
    }
    
    console.log('🔄 Starting manual monthly report via /statsm command');
    await activeScheduler.generateManualMonthlyReport(interaction);
  },
};

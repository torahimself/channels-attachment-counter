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

    // Check if scheduler is available
    if (!scheduler) {
      console.log('❌ Scheduler not available for /statsm command');
      await interaction.editReply('❌ Scheduler is not available. The bot may still be initializing or there was an error.');
      return;
    }
    
    console.log('🔄 Starting manual monthly report via /statsm command');
    await scheduler.generateManualMonthlyReport(interaction);
  },
};

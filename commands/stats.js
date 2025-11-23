const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Generate manual attachment report'),
  
  async execute(interaction, scheduler = null) {
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

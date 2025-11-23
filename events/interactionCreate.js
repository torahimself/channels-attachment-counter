const commandHandler = require('../handlers/commandHandler');
const { getScheduler } = require('./ready');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      // Only handle slash commands
      if (!interaction.isChatInputCommand()) return;

      console.log(`🔧 Command received: ${interaction.commandName}`);
      
      const scheduler = getScheduler();
      if (!scheduler) {
        await interaction.reply({ 
          content: '❌ Bot is still initializing, please try again in a moment.', 
          ephemeral: true 
        });
        return;
      }

      await commandHandler.executeCommand(interaction, scheduler);
      
    } catch (error) {
      console.error(`❌ Error handling interaction:`, error);
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: 'There was an error executing this command!', 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: 'There was an error executing this command!', 
          ephemeral: true 
        });
      }
    }
  },
};

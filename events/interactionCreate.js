const commandHandler = require('../handlers/commandHandler');

// Global scheduler instance (we'll manage this differently)
let globalScheduler = null;

function setScheduler(scheduler) {
  globalScheduler = scheduler;
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      // Only handle slash commands
      if (!interaction.isChatInputCommand()) return;

      console.log(`🔧 Command received: ${interaction.commandName}`);
      
      // Get the command from handler
      const command = commandHandler.commands.get(interaction.commandName);
      if (!command) {
        console.log(`❌ No command matching ${interaction.commandName} was found.`);
        await interaction.reply({ 
          content: '❌ Command not found!', 
          ephemeral: true 
        });
        return;
      }

      // Execute the command with scheduler if available
      if (globalScheduler) {
        await command.execute(interaction, globalScheduler);
      } else {
        await command.execute(interaction);
      }
      
      console.log(`✅ Command executed: ${interaction.commandName}`);
      
    } catch (error) {
      console.error(`❌ Error executing command ${interaction.commandName}:`, error);
      
      const errorMessage = '❌ There was an error executing this command!';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: errorMessage, 
          ephemeral: true 
        });
      } else {
        await interaction.reply({ 
          content: errorMessage, 
          ephemeral: true 
        });
      }
    }
  },
  setScheduler
};

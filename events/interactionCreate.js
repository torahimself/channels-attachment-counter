const commandHandler = require('../handlers/commandHandler');

// Global scheduler instance
let globalScheduler = null;

function setScheduler(scheduler) {
  globalScheduler = scheduler;
  console.log('✅ Scheduler set in interaction handler');
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
          flags: 64 // ephemeral
        });
        return;
      }

      // Execute the command with scheduler if available
      if (globalScheduler) {
        console.log(`✅ Executing ${interaction.commandName} with scheduler`);
        await command.execute(interaction, globalScheduler);
      } else {
        console.log(`⚠️ Executing ${interaction.commandName} without scheduler (scheduler not ready)`);
        await command.execute(interaction);
      }
      
      console.log(`✅ Command executed: ${interaction.commandName}`);
      
    } catch (error) {
      console.error(`❌ Error executing command ${interaction.commandName}:`, error);
      
      const errorMessage = '❌ There was an error executing this command!';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ 
          content: errorMessage, 
          flags: 64 // ephemeral
        });
      } else {
        await interaction.reply({ 
          content: errorMessage, 
          flags: 64 // ephemeral
        });
      }
    }
  },
  setScheduler
};

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
    if (!interaction.isChatInputCommand()) return;

    console.log(`🔧 Command received: ${interaction.commandName}`);
    
    // Defer reply immediately
    try {
      await interaction.deferReply({ flags: 64 });
      console.log(`✅ Deferred reply for ${interaction.commandName}`);
    } catch (error) {
      console.error(`❌ Error deferring reply:`, error.message);
      return;
    }

    const command = commandHandler.commands.get(interaction.commandName);
    if (!command) {
      console.log(`❌ No command matching ${interaction.commandName} was found.`);
      await interaction.editReply('❌ Command not found!');
      return;
    }

    try {
      // Get scheduler from global or client
      let activeScheduler = globalScheduler || interaction.client.scheduler;
      
      console.log(`✅ Executing ${interaction.commandName} with scheduler`);
      console.log(`🔍 Scheduler available:`, activeScheduler ? 'YES' : 'NO');
      
      if (!activeScheduler) {
        console.log(`❌ No scheduler available for ${interaction.commandName}`);
        await interaction.editReply('❌ Scheduler is not available. The bot may still be initializing. Please wait 30 seconds and try again.');
        return;
      }
      
      await command.execute(interaction, activeScheduler);
      console.log(`✅ Command executed: ${interaction.commandName}`);
      
    } catch (error) {
      console.error(`❌ Error executing command ${interaction.commandName}:`, error);
      console.error(`🔍 Full error stack:`, error.stack);
      await interaction.editReply('❌ There was an error executing this command!');
    }
  },
  setScheduler
};

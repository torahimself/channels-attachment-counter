const commandHandler = require('../handlers/commandHandler');
const readyEvent = require('./ready'); // Import ready event to access global scheduler

// Global scheduler instance
let globalScheduler = null;

function setScheduler(scheduler) {
  globalScheduler = scheduler;
  console.log('✅ Scheduler set in interaction handler');
  console.log(`🔍 Scheduler is now: ${globalScheduler ? 'SET' : 'NULL'}`);
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // Only handle slash commands
    if (!interaction.isChatInputCommand()) return;

    console.log(`🔧 Command received: ${interaction.commandName}`);
    console.log(`🔍 Global scheduler at command start: ${globalScheduler ? 'SET' : 'NULL'}`);
    
    // Defer reply immediately to avoid "Unknown interaction" error
    try {
      await interaction.deferReply({ flags: 64 }); // ephemeral
      console.log(`✅ Deferred reply for ${interaction.commandName}`);
    } catch (error) {
      console.error(`❌ Error deferring reply for ${interaction.commandName}:`, error.message);
      return;
    }

    // Get the command from handler
    const command = commandHandler.commands.get(interaction.commandName);
    if (!command) {
      console.log(`❌ No command matching ${interaction.commandName} was found.`);
      await interaction.editReply('❌ Command not found!');
      return;
    }

    try {
      // Get scheduler from multiple sources with fallbacks
      let activeScheduler = null;
      
      // 1. Try global scheduler from interaction handler
      if (globalScheduler) {
        activeScheduler = globalScheduler;
        console.log(`✅ Using global scheduler`);
      }
      // 2. Try client's scheduler
      else if (interaction.client.scheduler) {
        activeScheduler = interaction.client.scheduler;
        console.log(`✅ Using client.scheduler`);
      }
      // 3. Try getting from ready event's global
      else {
        const readyScheduler = readyEvent.getGlobalScheduler();
        if (readyScheduler) {
          activeScheduler = readyScheduler;
          console.log(`✅ Using scheduler from ready event`);
        }
      }
      
      console.log(`✅ Executing ${interaction.commandName} with scheduler`);
      console.log(`🔍 Active scheduler: ${activeScheduler ? 'AVAILABLE' : 'NULL'}`);
      
      if (!activeScheduler) {
        console.log(`❌ No scheduler available for ${interaction.commandName}`);
        await interaction.editReply('❌ Scheduler is not available. The bot may still be initializing. Please wait a moment and try again.');
        return;
      }
      
      // Execute command with the found scheduler
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

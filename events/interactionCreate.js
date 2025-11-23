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
    // Only handle slash commands
    if (!interaction.isChatInputCommand()) return;

    console.log(`🔧 Command received: ${interaction.commandName}`);
    
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
      // Execute the command with scheduler if available
      if (globalScheduler) {
        console.log(`✅ Executing ${interaction.commandName} with scheduler`);
        await command.execute(interaction, globalScheduler);
      } else {
        console.log(`⚠️ Executing ${interaction.commandName} without scheduler`);
        await command.execute(interaction);
      }
      
      console.log(`✅ Command executed: ${interaction.commandName}`);
      
    } catch (error) {
      console.error(`❌ Error executing command ${interaction.commandName}:`, error);
      await interaction.editReply('❌ There was an error executing this command!');
    }
  },
  setScheduler
};

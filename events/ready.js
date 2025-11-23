const { REST, Routes } = require('discord.js');
const config = require('../config.js');
const commandHandler = require('../handlers/commandHandler');
const interactionHandler = require('./interactionCreate');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`🎉 READY EVENT FIRED! Bot logged in as ${client.user.tag}!`);

    try {
      // Simple command registration without scheduler for now
      console.log('🔄 Registering commands...');
      const rest = new REST({ version: '10' }).setToken(config.botToken);
      const commands = commandHandler.getCommands();
      
      console.log(`📋 Commands to register:`, commands.map(cmd => cmd.name));
      
      if (commands.length > 0) {
        const data = await rest.put(
          Routes.applicationCommands(client.user.id),
          { body: commands }
        );
        console.log(`✅ Successfully registered ${data.length} commands:`, data.map(cmd => cmd.name));
      }

      console.log('🤖 Bot is ready! (Scheduler disabled for testing)');

    } catch (error) {
      console.error('❌ Error during bot initialization:', error);
    }
  }
};

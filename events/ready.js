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
      // Initialize core systems - IMPORT HERE to avoid circular dependencies
      console.log('🔄 Initializing core systems...');
      const AttachmentCounter = require('../utils/attachmentCounter');
      const ReportGenerator = require('../utils/reportGenerator');
      const Scheduler = require('../utils/scheduler');
      
      const attachmentCounter = new AttachmentCounter(client);
      const reportGenerator = new ReportGenerator(client);
      const scheduler = new Scheduler(client, attachmentCounter, reportGenerator);
      
      // Store on client
      client.scheduler = scheduler;
      console.log('✅ Scheduler attached to client object');

      // Share scheduler with interaction handler
      interactionHandler.setScheduler(scheduler);
      console.log('✅ Scheduler set in interaction handler');

      // Load and register commands
      commandHandler.loadCommands();
      
      const rest = new REST({ version: '10' }).setToken(config.botToken);
      const commands = commandHandler.getCommands();
      
      console.log(`📋 Registering ${commands.length} commands...`);
      
      const data = await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands }
      );
      
      console.log(`✅ Registered ${data.length} commands`);

      // Start scheduler
      scheduler.scheduleWeeklyReport();
      console.log('⏰ Schedulers started');
      
      console.log('🤖 Bot is fully operational!');

    } catch (error) {
      console.error('❌ Error during initialization:', error.message);
      console.error('🔍 Stack trace:', error.stack);
    }
  }
};

const { REST, Routes } = require('discord.js');
const config = require('../config.js');
const commandHandler = require('../handlers/commandHandler');
const AttachmentCounter = require('../utils/attachmentCounter');
const ReportGenerator = require('../utils/reportGenerator');
const Scheduler = require('../utils/scheduler');
const interactionHandler = require('./interactionCreate');
const path = require('path');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`🎉 READY EVENT FIRED! Bot logged in as ${client.user.tag}!`);

    try {
      // Initialize core systems
      console.log('🔄 Initializing attachment counter...');
      const attachmentCounter = new AttachmentCounter(client);
      
      console.log('🔄 Initializing report generator...');
      const reportGenerator = new ReportGenerator(client);
      
      console.log('🔄 Initializing scheduler...');
      const scheduler = new Scheduler(client, attachmentCounter, reportGenerator);
      
      // Store scheduler on client for global access
      client.scheduler = scheduler;
      console.log('✅ Scheduler attached to client object');

      // Share scheduler with interaction handler
      console.log('🔄 Setting scheduler in interaction handler...');
      interactionHandler.setScheduler(scheduler);
      console.log('✅ Scheduler initialized and set in interaction handler!');

      // Refresh command cache to ensure commands have latest scheduler reference
      console.log('🔄 Refreshing command cache...');
      const commandsPath = path.join(__dirname, '../commands');
      const commandFiles = ['stats.js', 'statsm.js', 'status.js'];
      
      for (const file of commandFiles) {
        try {
          const commandPath = path.join(commandsPath, file);
          delete require.cache[require.resolve(commandPath)];
          console.log(`✅ Cleared cache for: ${file}`);
        } catch (error) {
          console.log(`⚠️ Could not clear cache for ${file}:`, error.message);
        }
      }

      // Reload commands after clearing cache
      commandHandler.loadCommands();
      console.log('✅ Commands reloaded with scheduler reference');

      // Register slash commands
      console.log('🔄 Registering slash commands...');
      const rest = new REST({ version: '10' }).setToken(config.botToken);
      const commands = commandHandler.getCommands();
      
      console.log(`📋 Commands to register:`, commands.map(cmd => cmd.name));
      
      if (commands.length > 0) {
        console.log(`🔄 Registering ${commands.length} commands...`);
        
        const data = await rest.put(
          Routes.applicationCommands(client.user.id),
          { body: commands }
        );
        
        console.log(`✅ Successfully registered ${data.length} application commands!`);
      }

      // Start both weekly and monthly schedulers
      console.log('🔄 Starting schedulers...');
      scheduler.scheduleWeeklyReport();
      console.log('⏰ Weekly and Monthly report schedulers started!');

      // Calculate next report times
      const now = new Date();
      const nextFriday = new Date();
      const nextMonthStart = new Date();
      
      nextFriday.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);
      nextFriday.setHours(14, 0, 0, 0);
      
      nextMonthStart.setMonth(now.getMonth() + 1, 1);
      nextMonthStart.setHours(14, 0, 0, 0);
      
      console.log(`📅 Next weekly report: ${nextFriday.toLocaleString()} (Riyadh Time)`);
      console.log(`📅 Next monthly report: ${nextMonthStart.toLocaleString()} (Riyadh Time)`);
      console.log('🤖 Attachment Counter Bot is fully operational!');

    } catch (error) {
      console.error('❌ Error during bot initialization:', error);
      console.error('Full error details:', error);
    }
  }
};

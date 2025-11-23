const { REST, Routes } = require('discord.js');
const config = require('../config.js');
const commandHandler = require('../handlers/commandHandler');
const AttachmentCounter = require('../utils/attachmentCounter');
const ReportGenerator = require('../utils/reportGenerator');
const Scheduler = require('../utils/scheduler');
const interactionHandler = require('./interactionCreate');

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

      // Share scheduler with interaction handler
      console.log('🔄 Setting scheduler in interaction handler...');
      interactionHandler.setScheduler(scheduler);
      console.log('✅ Scheduler initialized and set in interaction handler!');

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
        
        console.log(`✅ Successfully registered ${commands.length} application commands!`);
      } else {
        console.log('ℹ️  No commands to register');
      }

      // TEMPORARY: Force command refresh (delete this section after it works)
      console.log('🔄 Starting temporary command refresh in 10 seconds...');
      setTimeout(async () => {
        console.log('🔄 Forcing command refresh...');
        try {
          // Clear all commands
          await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: [] }
          );
          console.log('✅ Cleared all commands');
          
          // Re-register commands
          const commands = commandHandler.getCommands();
          if (commands.length > 0) {
            const data = await rest.put(
              Routes.applicationCommands(client.user.id),
              { body: commands }
            );
            console.log(`✅ Re-registered ${commands.length} commands:`, data.map(cmd => cmd.name));
          }
        } catch (error) {
          console.error('❌ Error refreshing commands:', error);
        }
      }, 10000); // Wait 10 seconds after startup
      // END TEMPORARY SECTION

      // Start the weekly scheduler
      console.log('🔄 Starting weekly scheduler...');
      scheduler.scheduleWeeklyReport();
      console.log('⏰ Weekly report scheduler started!');

      // Calculate next report time
      const now = new Date();
      const nextFriday = new Date();
      nextFriday.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);
      nextFriday.setHours(14, 0, 0, 0); // 2 PM Riyadh time
      
      console.log(`📅 Next automated report: ${nextFriday.toLocaleString()} (Riyadh Time)`);
      console.log('🤖 Attachment Counter Bot is fully operational!');

    } catch (error) {
      console.error('❌ Error during bot initialization:', error);
    }
  }
};

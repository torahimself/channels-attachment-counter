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

    // NUCLEAR OPTION: Force command refresh immediately
    await forceCommandRefresh(client);
    
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

      // Start the weekly scheduler
      console.log('🔄 Starting weekly scheduler...');
      scheduler.scheduleWeeklyReport();
      console.log('⏰ Weekly report scheduler started!');

      console.log('🤖 Attachment Counter Bot is fully operational!');

    } catch (error) {
      console.error('❌ Error during bot initialization:', error);
    }
  }
};

// NUCLEAR COMMAND REFRESH FUNCTION
async function forceCommandRefresh(client) {
  console.log('💥 STARTING NUCLEAR COMMAND REFRESH...');
  
  const rest = new REST({ version: '10' }).setToken(config.botToken);
  
  try {
    // Step 1: Get current commands
    const currentCommands = await rest.get(Routes.applicationCommands(client.user.id));
    console.log(`📋 Found ${currentCommands.length} current commands:`, currentCommands.map(cmd => cmd.name));
    
    // Step 2: DELETE ALL COMMANDS
    console.log('🗑️ DELETING ALL COMMANDS...');
    await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
    console.log('✅ ALL COMMANDS DELETED!');
    
    // Step 3: Wait 3 seconds
    console.log('⏳ Waiting 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Step 4: Register our commands
    const commands = commandHandler.getCommands();
    console.log(`🔄 Registering ${commands.length} commands:`, commands.map(cmd => cmd.name));
    
    const data = await rest.put(
      Routes.applicationCommands(client.user.id),
      { body: commands }
    );
    
    console.log(`✅ SUCCESS! Registered ${data.length} commands:`, data.map(cmd => cmd.name));
    console.log('🎉 NUCLEAR REFRESH COMPLETE! Commands should appear in 1-2 minutes.');
    
  } catch (error) {
    console.error('❌ Error during nuclear refresh:', error);
  }
}

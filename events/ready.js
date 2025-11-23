const { REST, Routes } = require('discord.js');
const config = require('../config.js');
const commandHandler = require('../handlers/commandHandler');
const AttachmentCounter = require('../utils/attachmentCounter');
const ReportGenerator = require('../utils/reportGenerator');
const Scheduler = require('../utils/scheduler');

// Global instances to share across the bot
let attachmentCounter;
let reportGenerator;
let scheduler;

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`✅ Bot logged in as ${client.user.tag}!`);

    // Initialize core systems
    attachmentCounter = new AttachmentCounter(client);
    reportGenerator = new ReportGenerator(client);
    scheduler = new Scheduler(client, attachmentCounter, reportGenerator);

    // Register slash commands
    try {
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
    } catch (error) {
      console.error('❌ Could not register commands:', error);
    }

    // Start the weekly scheduler
    scheduler.scheduleWeeklyReport();
    console.log('⏰ Weekly report scheduler started!');

    // Calculate next report time
    const now = new Date();
    const nextFriday = new Date();
    nextFriday.setDate(now.getDate() + (5 - now.getDay() + 7) % 7);
    nextFriday.setHours(14, 0, 0, 0); // 2 PM Riyadh time
    
    console.log(`📅 Next automated report: ${nextFriday.toLocaleString()} (Riyadh Time)`);
    console.log('🤖 Attachment Counter Bot is fully operational!');
  },
};

// Export instances for use in other files
module.exports.getScheduler = () => scheduler;

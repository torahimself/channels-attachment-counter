const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config.js');

// Discord client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ],
});

// Load handlers
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');

commandHandler.loadCommands();
eventHandler.loadEvents(client);

// Start Discord bot
client.login(config.botToken)
  .then(() => {
    console.log('🔑 Discord login successful');
  })
  .catch(error => {
    console.error('❌ Discord login failed:', error);
    process.exit(1);
  });

// Error handling
client.on('error', (error) => {
  console.error('🔴 Discord client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('🔴 Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('🔴 Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔻 Received SIGTERM, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔻 Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`🎉 READY EVENT FIRED! Bot logged in as ${client.user.tag}!`);
    
    // Just log that we're ready, don't initialize anything complex yet
    console.log('✅ Bot is ready and events are working!');
  }
};

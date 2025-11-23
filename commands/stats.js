const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Generate manual attachment report'),
  
  async execute(interaction, scheduler) {
    await scheduler.generateManualReport(interaction);
  },
};

const cron = require('node-cron');
const config = require('../config.js');

class Scheduler {
  constructor(client, attachmentCounter, reportGenerator) {
    this.client = client;
    this.attachmentCounter = attachmentCounter;
    this.reportGenerator = reportGenerator;
    this.isRunning = false;
  }

  // Schedule the weekly report
  scheduleWeeklyReport() {
    console.log(`⏰ Scheduling weekly reports: ${config.schedule} (Friday 2:00 PM Riyadh Time)`);
    console.log(`📁 Scanning ${config.channels.length} specified channels`);
    
    const task = cron.schedule(config.schedule, async () => {
      if (this.isRunning) {
        console.log('⚠️  Report generation already in progress, skipping...');
        return;
      }

      this.isRunning = true;
      console.log('🔄 Starting scheduled weekly report generation...');
      
      try {
        await this.generateAndSendReport();
        console.log('✅ Scheduled weekly report completed successfully');
      } catch (error) {
        console.error('❌ Error in scheduled report generation:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: true,
      timezone: config.timezone
    });

    return task;
  }

  // Generate and send the complete report
  async generateAndSendReport() {
    try {
      const reportChannel = this.client.channels.cache.get(config.reportChannel);
      if (!reportChannel) {
        console.log('❌ Report channel not found');
        return;
      }

      console.log('🔍 Scanning for attachments...');
      const userStats = await this.attachmentCounter.scanChannels(config.channels, config.trackedRoles);
      
      if (userStats.size === 0) {
        console.log('ℹ️  No attachments found from tracked roles this week');
        await reportChannel.send('@everyone\n📊 **WEEKLY ATTACHMENT REPORT**\n\nNo attachments found from tracked roles this week. 📭');
        return;
      }

      const topUsers = this.attachmentCounter.getTopUsers(userStats, 5);
      const channelBreakdown = this.attachmentCounter.getChannelBreakdown(userStats, config.channels);
      const totalAttachments = this.reportGenerator.calculateTotalAttachments(userStats);

      // Send main report
      console.log('📊 Generating main report...');
      const mainEmbed = this.reportGenerator.generateMainReport(topUsers, channelBreakdown, totalAttachments);
      await reportChannel.send({ 
        content: '@everyone', 
        embeds: [mainEmbed] 
      });

      // Send individual user reports
      console.log(`👤 Generating ${userStats.size} individual user reports...`);
      for (const [userId, userData] of userStats) {
        if (userData.total > 0) {
          const userEmbed = this.reportGenerator.generateUserEmbed(userId, userData, this.client);
          await reportChannel.send({ embeds: [userEmbed] });
          
          // Small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      console.log(`✅ Report generation complete! Sent ${userStats.size} user reports`);

    } catch (error) {
      console.error('❌ Error generating report:', error);
      throw error;
    }
  }

  // Manual report trigger
  async generateManualReport(interaction = null) {
    if (this.isRunning) {
      if (interaction) {
        await interaction.reply('⚠️ Report generation is already in progress!');
      }
      return;
    }

    this.isRunning = true;
    
    try {
      if (interaction) {
        await interaction.reply('🔄 Generating manual report...');
      }

      console.log('🔄 Starting manual report generation...');
      await this.generateAndSendReport();

      if (interaction) {
        await interaction.editReply('✅ Manual report generated successfully!');
      }

    } catch (error) {
      console.error('❌ Error in manual report generation:', error);
      
      if (interaction) {
        await interaction.editReply('❌ Error generating report! Check console for details.');
      }
    } finally {
      this.isRunning = false;
    }
  }
}

module.exports = Scheduler;

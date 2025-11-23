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

      console.log('🔍 Scanning for media...');
      const userStats = await this.attachmentCounter.scanChannels(config.channels, config.trackedRoles);
      
      console.log(`📊 Scan completed. Users found: ${userStats.size}`);
      
      if (userStats.size === 0) {
        console.log('ℹ️  No media found from tracked roles this week');
        await reportChannel.send('@everyone\n📊 **WEEKLY MEDIA REPORT**\n\nNo media found from tracked roles this week. 📭');
        return;
      }

      const topUsers = this.attachmentCounter.getTopUsers(userStats, 5);
      const channelBreakdown = this.attachmentCounter.getChannelBreakdown(userStats, config.channels);
      const totalMedia = this.reportGenerator.calculateTotalMedia(userStats);

      console.log(`📈 Generating report: ${totalMedia} total media, ${topUsers.length} top users`);

      // Send main report
      console.log('📊 Generating main report...');
      const mainEmbed = this.reportGenerator.generateMainReport(topUsers, channelBreakdown, totalMedia);
      await reportChannel.send({ 
        content: '@everyone', 
        embeds: [mainEmbed] 
      });

      // Send individual user reports
      console.log(`👤 Generating ${userStats.size} individual user reports...`);
      let userReportCount = 0;
      for (const [userId, userData] of userStats) {
        if (userData.total > 0) {
          try {
            const userEmbed = this.reportGenerator.generateUserEmbed(userId, userData, this.client);
            await reportChannel.send({ embeds: [userEmbed] });
            userReportCount++;
            
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`❌ Error sending user report for ${userId}:`, error);
          }
        }
      }

      console.log(`✅ Report generation complete! Sent ${userReportCount} user reports`);

    } catch (error) {
      console.error('❌ Error generating report:', error);
      throw error;
    }
  }

  // Manual report trigger with better error handling
  async generateManualReport(interaction = null) {
    if (this.isRunning) {
      if (interaction) {
        // Use editReply since we already deferred
        await interaction.editReply('⚠️ Report generation is already in progress!');
      }
      return;
    }

    this.isRunning = true;
    
    try {
      if (interaction) {
        // Update the deferred reply instead of creating a new one
        await interaction.editReply('🔄 Generating manual report... This may take a few minutes.');
      }

      console.log('🔄 Starting manual report generation...');
      await this.generateAndSendReport();

      if (interaction) {
        await interaction.editReply('✅ Manual report generated successfully! Check the reports channel.');
      }

    } catch (error) {
      console.error('❌ Error in manual report generation:', error);
      
      if (interaction) {
        const errorMessage = '❌ Error generating report! Check console for details.';
        // Use editReply since we already deferred
        await interaction.editReply(errorMessage);
      }
    } finally {
      this.isRunning = false;
    }
  }
}

module.exports = Scheduler;

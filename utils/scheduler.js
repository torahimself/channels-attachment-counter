const cron = require('node-cron');
const config = require('../config.js');

class Scheduler {
  constructor(client, attachmentCounter, reportGenerator) {
    this.client = client;
    this.attachmentCounter = attachmentCounter;
    this.reportGenerator = reportGenerator;
    this.isRunning = false;
    this.isMonthlyRunning = false;
  }

  // Schedule both weekly and monthly reports
  scheduleWeeklyReport() {
    console.log(`⏰ Scheduling weekly reports: ${config.weeklySchedule} (Friday 2:00 PM Riyadh Time)`);
    console.log(`⏰ Scheduling monthly reports: ${config.monthlySchedule} (1st of month 2:00 PM Riyadh Time)`);
    console.log(`📁 Scanning ${config.channels.length} specified channels`);
    
    // Schedule weekly report
    const weeklyTask = cron.schedule(config.weeklySchedule, async () => {
      if (this.isRunning) {
        console.log('⚠️  Weekly report generation already in progress, skipping...');
        return;
      }

      this.isRunning = true;
      console.log('🔄 Starting scheduled weekly report generation...');
      
      try {
        await this.generateAndSendReport('weekly');
        console.log('✅ Scheduled weekly report completed successfully');
      } catch (error) {
        console.error('❌ Error in scheduled weekly report generation:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: true,
      timezone: config.timezone
    });

    // Schedule monthly report
    const monthlyTask = cron.schedule(config.monthlySchedule, async () => {
      if (this.isMonthlyRunning) {
        console.log('⚠️  Monthly report generation already in progress, skipping...');
        return;
      }

      this.isMonthlyRunning = true;
      console.log('🔄 Starting scheduled monthly report generation...');
      
      try {
        await this.generateAndSendReport('monthly');
        console.log('✅ Scheduled monthly report completed successfully');
      } catch (error) {
        console.error('❌ Error in scheduled monthly report generation:', error);
      } finally {
        this.isMonthlyRunning = false;
      }
    }, {
      scheduled: true,
      timezone: config.timezone
    });

    return { weeklyTask, monthlyTask };
  }

  // Generate and send report (weekly or monthly)
  async generateAndSendReport(reportType = 'weekly') {
    const isMonthly = reportType === 'monthly';
    const reportChannelId = isMonthly ? config.monthlyReportChannel : config.reportChannel;
    
    try {
      const reportChannel = this.client.channels.cache.get(reportChannelId);
      if (!reportChannel) {
        console.log(`❌ ${reportType} report channel not found: ${reportChannelId}`);
        return;
      }

      // Check if bot can send messages to report channel
      const canSend = reportChannel.permissionsFor(this.client.user)?.has('SendMessages');
      if (!canSend) {
        console.log(`❌ Bot cannot send messages to ${reportType} report channel`);
        return;
      }

      console.log(`🔍 Scanning for ${reportType} media...`);
      
      let userStats;
      if (isMonthly) {
        userStats = await this.attachmentCounter.scanChannelsMonthly(config.channels, config.trackedRoles);
      } else {
        userStats = await this.attachmentCounter.scanChannels(config.channels, config.trackedRoles);
      }
      
      console.log(`📊 ${reportType.toUpperCase()} scan completed. Users found: ${userStats.size}`);
      
      if (userStats.size === 0) {
        console.log(`ℹ️  No media found from tracked roles this ${reportType}`);
        try {
          await reportChannel.send(`📊 **${reportType.toUpperCase()} MEDIA REPORT**\n\nNo media found from tracked roles this ${reportType}. 📭`);
        } catch (error) {
          console.error(`❌ Cannot send to ${reportType} report channel:`, error.message);
        }
        return;
      }

      const topUsers = this.attachmentCounter.getTopUsers(userStats, 10);
      const channelBreakdown = this.attachmentCounter.getChannelBreakdown(userStats, config.channels);
      const totalMedia = this.reportGenerator.calculateTotalMedia(userStats);

      console.log(`📈 Generating ${reportType} report: ${totalMedia} total media, ${topUsers.length} top users`);

      // Send main report
      console.log(`📊 Generating ${reportType} main report...`);
      const mainEmbed = this.reportGenerator.generateMainReport(topUsers, channelBreakdown, totalMedia, reportType);
      try {
        await reportChannel.send({ 
          content: `📊 **${reportType.toUpperCase()} MEDIA REPORT**`, 
          embeds: [mainEmbed] 
        });
      } catch (error) {
        console.error(`❌ Cannot send ${reportType} main report:`, error.message);
        return;
      }

      // Send individual user reports
      console.log(`👤 Generating ${userStats.size} individual user reports for ${reportType}...`);
      let userReportCount = 0;
      for (const [userId, userData] of userStats) {
        if (userData.total > 0) {
          try {
            const userEmbed = this.reportGenerator.generateUserEmbed(userId, userData, this.client, reportType);
            await reportChannel.send({ embeds: [userEmbed] });
            userReportCount++;
            
            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`❌ Error sending ${reportType} user report for ${userId}:`, error.message);
          }
        }
      }

      console.log(`✅ ${reportType.toUpperCase()} report generation complete! Sent ${userReportCount} user reports`);

    } catch (error) {
      console.error(`❌ Error generating ${reportType} report:`, error);
      throw error;
    }
  }

  // Manual weekly report trigger
  async generateManualReport(interaction = null) {
    if (this.isRunning) {
      if (interaction) {
        await interaction.editReply('⚠️ Weekly report generation is already in progress!');
      }
      return;
    }

    this.isRunning = true;
    
    try {
      if (interaction) {
        await interaction.editReply('🔄 Generating manual weekly report... This may take a few minutes.');
      }

      console.log('🔄 Starting manual weekly report generation...');
      await this.generateAndSendReport('weekly');

      if (interaction) {
        await interaction.editReply('✅ Weekly report generated successfully! Check the reports channel.');
      }

    } catch (error) {
      console.error('❌ Error in manual weekly report generation:', error);
      
      if (interaction) {
        const errorMessage = '❌ Error generating weekly report! Check console for details.';
        await interaction.editReply(errorMessage);
      }
    } finally {
      this.isRunning = false;
    }
  }

  // Manual monthly report trigger
  async generateManualMonthlyReport(interaction = null) {
    if (this.isMonthlyRunning) {
      if (interaction) {
        await interaction.editReply('⚠️ Monthly report generation is already in progress!');
      }
      return;
    }

    this.isMonthlyRunning = true;
    
    try {
      if (interaction) {
        await interaction.editReply('🔄 Generating manual monthly report... This may take a few minutes.');
      }

      console.log('🔄 Starting manual monthly report generation...');
      await this.generateAndSendReport('monthly');

      if (interaction) {
        await interaction.editReply('✅ Monthly report generated successfully! Check the reports channel.');
      }

    } catch (error) {
      console.error('❌ Error in manual monthly report generation:', error);
      
      if (interaction) {
        const errorMessage = '❌ Error generating monthly report! Check console for details.';
        await interaction.editReply(errorMessage);
      }
    } finally {
      this.isMonthlyRunning = false;
    }
  }
}

module.exports = Scheduler;

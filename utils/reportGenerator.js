const { EmbedBuilder } = require('discord.js');

class ReportGenerator {
  constructor(client) {
    this.client = client;
  }

  // Generate main report embed with better formatting
  generateMainReport(topUsers, channelBreakdown, totalMedia) {
    const embed = new EmbedBuilder()
      .setTitle('📊 WEEKLY MEDIA REPORT')
      .setColor(0x00AE86)
      .setTimestamp()
      .setFooter({ text: 'Weekly Media Counter • Report generated' });

    // Top Contributors field with mentions
    if (topUsers.length > 0) {
      const topUsersText = topUsers.map((user, index) => 
        `**${index + 1}.** <@${user.userId}> - **${user.total}** media items`
      ).join('\n\n');
      
      embed.addFields({
        name: '🏆 TOP CONTRIBUTORS',
        value: topUsersText || 'No media found this week',
        inline: false
      });
    }

    // Channel Breakdown field (show top 8 channels only)
    const sortedChannels = Array.from(channelBreakdown.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 8);

    const channelText = sortedChannels
      .map(([channelId, data]) => 
        `• ${data.name} - **${data.total}** items`
      ).join('\n\n');

    if (sortedChannels.length > 0) {
      embed.addFields({
        name: `📁 TOP CHANNELS`,
        value: channelText,
        inline: false
      });
    }

    // Summary field
    const activeUsers = topUsers.length;
    const activeChannels = Array.from(channelBreakdown.values()).filter(ch => ch.total > 0).length;
    
    embed.addFields(
      {
        name: '📈 SUMMARY',
        value: `**Total Media:** ${totalMedia}\n**Active Users:** ${activeUsers}\n**Active Channels:** ${activeChannels}`,
        inline: true
      },
      {
        name: '🕒 NEXT REPORT',
        value: `Friday 2:00 PM\nRiyadh Time`,
        inline: true
      },
      {
        name: '📊 SCOPE',
        value: `Last 7 Days\n50 Channels + 4 Forums`,
        inline: true
      }
    );

    return embed;
  }

  // Generate individual user embed with user mention
  generateUserEmbed(userId, userData, client) {
    const user = client.users.cache.get(userId);
    const username = user ? user.tag : userData.username;

    const embed = new EmbedBuilder()
      .setTitle(`👤 USER MEDIA REPORT`)
      .setColor(0x0099FF)
      .setTimestamp()
      .setFooter({ text: 'Individual User Report • Click user mention to profile' });

    // User info with mention
    embed.addFields({
      name: '👤 USER INFORMATION',
      value: `**User:** <@${userId}>\n**Username:** ${username}\n**User ID:** ${userId}`,
      inline: false
    });

    // Total media
    embed.addFields({
      name: '📊 TOTAL MEDIA',
      value: `**${userData.total}** media items this week\n*(attachments + embed links)*`,
      inline: false
    });

    // Channels breakdown (with forum thread grouping)
    if (userData.channels.size > 0) {
      const channelGroups = new Map();
      
      // Group by parent channel (especially for forums)
      for (const [channelKey, count] of userData.channels) {
        if (channelKey.startsWith('forum-')) {
          // Forum thread: forum-{forumId}-{threadId}
          const parts = channelKey.split('-');
          const forumId = parts[1];
          const forum = client.channels.cache.get(forumId);
          const forumName = forum ? forum.name : `Forum-${forumId}`;
          
          if (!channelGroups.has(forumName)) {
            channelGroups.set(forumName, { total: 0, isForum: true });
          }
          channelGroups.get(forumName).total += count;
        } else {
          // Regular channel
          const channel = client.channels.cache.get(channelKey);
          const channelName = channel ? `#${channel.name}` : `Channel-${channelKey}`;
          
          if (!channelGroups.has(channelName)) {
            channelGroups.set(channelName, { total: 0, isForum: false });
          }
          channelGroups.get(channelName).total += count;
        }
      }

      const channelText = Array.from(channelGroups.entries())
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 6) // Limit to top 6 locations
        .map(([name, data]) => {
          const prefix = data.isForum ? '🏛️ ' : '• ';
          return `${prefix}${name}: **${data.total}** items`;
        })
        .join('\n\n');

      if (channelGroups.size > 6) {
        channelText += `\n\n• ... and ${channelGroups.size - 6} more locations`;
      }

      embed.addFields({
        name: `📍 ACTIVITY LOCATIONS`,
        value: channelText || 'No channel data',
        inline: false
      });
    }

    // Activity period
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    
    embed.addFields({
      name: '📅 REPORT PERIOD',
      value: `<t:${Math.floor(startDate.getTime() / 1000)}:D> to <t:${Math.floor(endDate.getTime() / 1000)}:D>`,
      inline: true
    });

    return embed;
  }

  // Calculate total media from all users
  calculateTotalMedia(userStats) {
    let total = 0;
    for (const userData of userStats.values()) {
      total += userData.total;
    }
    return total;
  }
}

module.exports = ReportGenerator;

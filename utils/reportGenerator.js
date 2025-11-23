const { EmbedBuilder } = require('discord.js');

class ReportGenerator {
  constructor(client) {
    this.client = client;
  }

  // Generate main report embed
  generateMainReport(topUsers, channelBreakdown, totalAttachments) {
    const embed = new EmbedBuilder()
      .setTitle('📊 WEEKLY ATTACHMENT REPORT')
      .setColor(0x00AE86)
      .setTimestamp()
      .setFooter({ text: 'Weekly Attachment Counter • Report generated' });

    // Top Contributors field
    if (topUsers.length > 0) {
      const topUsersText = topUsers.map((user, index) => 
        `**${index + 1}.** ${user.username} - **${user.total}** attachments`
      ).join('\n');
      
      embed.addFields({
        name: '🏆 Top Contributors',
        value: topUsersText || 'No attachments found this week',
        inline: false
      });
    }

    // Channel Breakdown field (show top 10 channels only)
    const sortedChannels = Array.from(channelBreakdown.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10); // Show only top 10 channels

    const channelText = sortedChannels
      .map(([channelId, data]) => 
        `• ${data.name} - **${data.total}** attachments`
      ).join('\n');

    embed.addFields({
      name: `📁 Top Channels (${sortedChannels.length} of ${channelBreakdown.size})`,
      value: channelText || 'No channels with attachments',
      inline: false
    });

    // Totals field
    embed.addFields({
      name: '📈 Summary',
      value: `**Total Attachments:** ${totalAttachments}\n**Top Contributors:** ${topUsers.length} users\n**Channels Scanned:** ${channelBreakdown.size}`,
      inline: true
    });

    const nextFriday = new Date();
    nextFriday.setDate(nextFriday.getDate() + (5 - nextFriday.getDay() + 7) % 7);
    nextFriday.setHours(14, 0, 0, 0); // 2 PM Riyadh time

    embed.addFields({
      name: '🕒 Next Report',
      value: `<t:${Math.floor(nextFriday.getTime() / 1000)}:F> (<t:${Math.floor(nextFriday.getTime() / 1000)}:R>)`,
      inline: true
    });

    return embed;
  }

  // Generate individual user embed with better forum display
  generateUserEmbed(userId, userData, client) {
    const user = client.users.cache.get(userId);
    const username = user ? user.tag : userData.username;

    const embed = new EmbedBuilder()
      .setTitle(`👤 User Attachment Report`)
      .setColor(0x0099FF)
      .setTimestamp()
      .setFooter({ text: 'Individual User Report' });

    // User info
    embed.addFields({
      name: 'User Information',
      value: `**Username:** ${username}\n**User ID:** ${userId}`,
      inline: false
    });

    // Total attachments
    embed.addFields({
      name: '📊 Total Attachments',
      value: `**${userData.total}** attachments this week`,
      inline: true
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
        .slice(0, 8) // Limit to top 8 locations
        .map(([name, data]) => {
          const prefix = data.isForum ? '🏛️ ' : '• ';
          return `${prefix}${name}: **${data.total}** attachments`;
        })
        .join('\n');

      if (channelGroups.size > 8) {
        channelText += `\n• ... and ${channelGroups.size - 8} more locations`;
      }

      embed.addFields({
        name: `📍 Activity Locations (${channelGroups.size} locations)`,
        value: channelText || 'No channel data',
        inline: false
      });
    }

    // Activity period
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const endDate = new Date();
    
    embed.addFields({
      name: '📅 Period',
      value: `<t:${Math.floor(startDate.getTime() / 1000)}:D> to <t:${Math.floor(endDate.getTime() / 1000)}:D>`,
      inline: true
    });

    return embed;
  }

  // Calculate total attachments from all users
  calculateTotalAttachments(userStats) {
    let total = 0;
    for (const userData of userStats.values()) {
      total += userData.total;
    }
    return total;
  }
}

module.exports = ReportGenerator;

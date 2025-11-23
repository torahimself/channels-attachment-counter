const { EmbedBuilder } = require('discord.js');

class ReportGenerator {
  constructor(client) {
    this.client = client;
  }

  // Generate main report embed
  generateMainReport(topUsers, categoryBreakdown, totalAttachments) {
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

    // Category Breakdown field
    const categoryText = Array.from(categoryBreakdown.entries())
      .map(([categoryId, data]) => 
        `• **${data.name}** - **${data.total}** attachments (${data.channelCount} channels)`
      ).join('\n');

    embed.addFields({
      name: '📁 Category Breakdown',
      value: categoryText || 'No categories scanned',
      inline: false
    });

    // Totals field
    embed.addFields({
      name: '📈 Summary',
      value: `**Total Attachments:** ${totalAttachments}\n**Top Contributors:** ${topUsers.length} users\n**Categories Scanned:** ${categoryBreakdown.size}`,
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

  // Generate individual user embed
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

    // Channels breakdown
    if (userData.channels.size > 0) {
      const channelText = Array.from(userData.channels.entries())
        .slice(0, 10) // Limit to top 10 channels
        .map(([channelId, count]) => {
          const channel = client.channels.cache.get(channelId);
          const channelName = channel ? `#${channel.name}` : `Unknown Channel (${channelId})`;
          return `• ${channelName}: **${count}** attachments`;
        })
        .join('\n');

      if (userData.channels.size > 10) {
        channelText += `\n• ... and ${userData.channels.size - 10} more channels`;
      }

      embed.addFields({
        name: `📍 Channel Breakdown (${userData.channels.size} channels)`,
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

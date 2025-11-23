const CategoryScanner = require('./categoryScanner');

class AttachmentCounter {
  constructor(client) {
    this.client = client;
    this.scanner = new CategoryScanner(client);
    this.weeklyData = new Map(); // Store userID -> { total: number, channels: Map }
  }

  // Check if user has any of the tracked roles
  userHasTrackedRole(member, trackedRoles) {
    if (!member) return false;
    return member.roles.cache.some(role => trackedRoles.includes(role.id));
  }

  // Scan a single channel for attachments from tracked roles
  async scanChannel(channel, trackedRoles, sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
    console.log(`🔍 Scanning channel: ${channel.name} (${channel.id})`);
    
    const userStats = new Map();
    let messageCount = 0;
    let attachmentCount = 0;

    try {
      let lastMessageId = null;
      let hasMoreMessages = true;

      // Fetch messages in batches
      while (hasMoreMessages) {
        const options = { limit: 100 };
        if (lastMessageId) options.before = lastMessageId;

        const messages = await channel.messages.fetch(options);
        if (messages.size === 0) break;

        for (const [messageId, message] of messages) {
          // Stop if we've reached messages older than our date range
          if (message.createdAt < sinceDate) {
            hasMoreMessages = false;
            break;
          }

          // Only count messages from users with tracked roles
          if (message.author.bot) continue;
          if (!this.userHasTrackedRole(message.member, trackedRoles)) continue;

          const attachments = message.attachments.size;
          if (attachments > 0) {
            const userId = message.author.id;
            const username = message.author.tag;

            if (!userStats.has(userId)) {
              userStats.set(userId, {
                username: username,
                total: 0,
                channels: new Map()
              });
            }

            const userData = userStats.get(userId);
            userData.total += attachments;
            userData.channels.set(channel.id, (userData.channels.get(channel.id) || 0) + attachments);

            attachmentCount += attachments;
          }

          messageCount++;
          lastMessageId = messageId;
        }

        // Safety limit to prevent infinite loops
        if (messageCount > 5000) break;
      }

    } catch (error) {
      console.error(`❌ Error scanning channel ${channel.name}:`, error.message);
    }

    console.log(`✅ Scanned ${messageCount} messages in ${channel.name}, found ${attachmentCount} attachments`);
    return userStats;
  }

  // Scan all channels in specified categories
  async scanAllChannels(categoryIds, trackedRoles) {
    console.log(`🔄 Starting attachment scan for ${categoryIds.length} categories...`);
    
    const channels = this.scanner.getChannelsFromCategories(categoryIds);
    console.log(`📁 Found ${channels.length} channels to scan`);
    
    const allUserStats = new Map();
    const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    for (const channel of channels) {
      const channelStats = await this.scanChannel(channel, trackedRoles, sinceDate);
      
      // Merge channel stats into overall stats
      for (const [userId, userData] of channelStats) {
        if (!allUserStats.has(userId)) {
          allUserStats.set(userId, {
            username: userData.username,
            total: 0,
            channels: new Map()
          });
        }

        const overallData = allUserStats.get(userId);
        overallData.total += userData.total;

        // Merge channel data
        for (const [channelId, count] of userData.channels) {
          overallData.channels.set(channelId, (overallData.channels.get(channelId) || 0) + count);
        }
      }
    }

    console.log(`🎯 Scan complete. Found ${allUserStats.size} users with attachments`);
    return allUserStats;
  }

  // Get category breakdown
  getCategoryBreakdown(userStats, categoryIds) {
    const categoryData = new Map();
    
    for (const categoryId of categoryIds) {
      const categoryChannels = this.scanner.getChannelsFromCategories([categoryId]);
      let categoryTotal = 0;

      for (const userData of userStats.values()) {
        for (const [channelId, count] of userData.channels) {
          if (categoryChannels.some(ch => ch.id === channelId)) {
            categoryTotal += count;
          }
        }
      }

      categoryData.set(categoryId, {
        name: this.scanner.getCategoryName(categoryId),
        total: categoryTotal,
        channelCount: categoryChannels.length
      });
    }

    return categoryData;
  }

  // Get top users sorted by attachment count
  getTopUsers(userStats, limit = 10) {
    return Array.from(userStats.entries())
      .map(([userId, data]) => ({
        userId,
        username: data.username,
        total: data.total,
        channelCount: data.channels.size
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }
}

module.exports = AttachmentCounter;

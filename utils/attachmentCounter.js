const { Collection } = require('discord.js');

class AttachmentCounter {
  constructor(client) {
    this.client = client;
    this.weeklyData = new Map();
    this.monthlyData = new Map();
    this.userCache = new Map(); // Cache for user data to avoid repeated fetches
  }

  // Clear cache periodically to prevent memory issues
  clearCache() {
    this.userCache.clear();
    console.log('🧹 Cleared user cache');
  }

  // Check if user has any of the tracked roles
  userHasTrackedRole(member, trackedRoles) {
    if (!member) {
      return false;
    }
    
    const hasRole = member.roles.cache.some(role => trackedRoles.includes(role.id));
    
    return hasRole;
  }

  // Get user's roles for debugging
  getUserRoles(member) {
    if (!member) return [];
    return member.roles.cache.map(role => ({
      id: role.id,
      name: role.name
    }));
  }

  // Count both attachments and embeds
  countMessageMedia(message) {
    let count = 0;
    
    // Count file attachments (images, videos, files)
    count += message.attachments.size;
    
    // Count embed media (links with rich embeds)
    if (message.embeds.length > 0) {
      message.embeds.forEach(embed => {
        if (embed.image || embed.video || embed.thumbnail) {
          count += 1;
        }
      });
    }
    
    return count;
  }

  // Get member data with caching and error handling
  async getMemberData(guild, userId, username) {
    // Check cache first
    const cacheKey = `${guild.id}-${userId}`;
    if (this.userCache.has(cacheKey)) {
      return this.userCache.get(cacheKey);
    }

    // Skip deleted users and bots early
    if (username === 'Deleted User' || username.includes('#0000')) {
      this.userCache.set(cacheKey, null);
      return null;
    }

    try {
      const member = await guild.members.fetch(userId);
      this.userCache.set(cacheKey, member);
      return member;
    } catch (error) {
      // Only log actual errors, not "Unknown Member" (code 10007)
      if (error.code !== 10007 && !error.message.includes('Unknown Member')) {
        console.log(`⚠️ Could not fetch member data for ${username}:`, error.message);
      }
      this.userCache.set(cacheKey, null);
      return null;
    }
  }

  // Scan ALL messages in a channel from sinceDate (with pagination)
  async scanAllChannelMessages(channel, trackedRoles, sinceDate) {
    console.log(`🔍 Scanning messages in ${channel.name} since ${sinceDate.toLocaleString()}`);
    
    const userStats = new Map();
    let totalMessages = 0;
    let totalMedia = 0;
    let lastMessageId = null;
    let hasMoreMessages = true;
    let batchCount = 0;
    let deletedUserCount = 0;
    let skippedMessages = 0;

    try {
      while (hasMoreMessages) {
        batchCount++;
        const options = { limit: 100 };
        if (lastMessageId) {
          options.before = lastMessageId;
        }

        const messages = await channel.messages.fetch(options);
        
        // Check if channel is empty
        if (messages.size === 0) {
          console.log(`📭 Channel ${channel.name} has no messages`);
          hasMoreMessages = false;
          break;
        }

        console.log(`📦 Batch ${batchCount}: Found ${messages.size} messages in ${channel.name}`);

        let batchOlderThanRange = false;
        let processedInBatch = 0;

        for (const [messageId, message] of messages) {
          // Stop if we've reached messages older than our date range
          if (message.createdAt < sinceDate) {
            batchOlderThanRange = true;
            break;
          }

          // Skip bot messages
          if (message.author.bot) {
            skippedMessages++;
            continue;
          }
          
          // Check for deleted users early
          if (message.author.tag === 'Deleted User' || message.author.discriminator === '0000') {
            deletedUserCount++;
            lastMessageId = messageId;
            totalMessages++;
            continue;
          }

          // Get member data with caching
          let member = message.member;
          if (!member && message.guild) {
            member = await this.getMemberData(message.guild, message.author.id, message.author.tag);
            if (!member) {
              deletedUserCount++;
              lastMessageId = messageId;
              totalMessages++;
              continue;
            }
          }

          if (!member) {
            deletedUserCount++;
            lastMessageId = messageId;
            totalMessages++;
            continue;
          }
          
          // Check if user has tracked roles
          const hasTrackedRole = this.userHasTrackedRole(member, trackedRoles);
          
          if (!hasTrackedRole) {
            lastMessageId = messageId;
            totalMessages++;
            continue;
          }

          // Count media in this message
          const mediaItems = this.countMessageMedia(message);
          
          if (mediaItems > 0) {
            const userId = message.author.id;
            const username = message.author.tag;

            if (!userStats.has(userId)) {
              userStats.set(userId, {
                username: username,
                total: 0,
                channels: new Map(),
                roles: this.getUserRoles(member)
              });
            }

            const userData = userStats.get(userId);
            userData.total += mediaItems;
            userData.channels.set(channel.id, (userData.channels.get(channel.id) || 0) + mediaItems);

            totalMedia += mediaItems;
            processedInBatch++;
            
            // Log progress every 50 media items
            if (totalMedia % 50 === 0) {
              console.log(`📎 Found ${mediaItems} media from ${username} in ${channel.name} (Total: ${totalMedia})`);
            }
          }

          totalMessages++;
          lastMessageId = messageId;
        }

        // Log batch summary
        if (processedInBatch > 0) {
          console.log(`✅ Batch ${batchCount}: Processed ${processedInBatch} media items`);
        }

        // If this batch contained messages older than our range, we're done
        if (batchOlderThanRange) {
          console.log(`⏰ Reached messages older than scan range in ${channel.name}`);
          hasMoreMessages = false;
          break;
        }

        // Add delay between batches to avoid rate limits (adjustable based on needs)
        const delay = batchCount % 10 === 0 ? 2000 : 1000; // Longer delay every 10 batches
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Safety limit: don't scan more than 5000 messages per channel
        if (totalMessages >= 5000) {
          console.log(`⚠️ Safety limit: scanned ${totalMessages} messages in ${channel.name}`);
          break;
        }
      }

    } catch (error) {
      console.error(`❌ Error scanning channel ${channel.name}:`, error.message);
      console.error(`🔍 Error details:`, error.code || 'No error code');
    }

    // Log summary for this channel
    console.log(`✅ Scanned ${totalMessages} messages in ${channel.name}`);
    console.log(`📊 Found ${totalMedia} media items from ${userStats.size} users`);
    if (deletedUserCount > 0) {
      console.log(`🗑️  Skipped ${deletedUserCount} messages from deleted users`);
    }
    if (skippedMessages > 0) {
      console.log(`🤖 Skipped ${skippedMessages} bot messages`);
    }
    
    return userStats;
  }

  // Scan forum threads (special handling for forums)
  async scanForumChannel(forumChannel, trackedRoles, sinceDate) {
    console.log(`🏛️  Scanning forum: ${forumChannel.name} (${forumChannel.id})`);
    
    const userStats = new Map();
    let totalThreads = 0;
    let totalMedia = 0;

    try {
      // Fetch active threads in the forum
      const activeThreads = await forumChannel.threads.fetchActive();
      const archivedThreads = await forumChannel.threads.fetchArchived({ limit: 20 }); // Reduced limit
      
      const allThreads = new Collection();
      activeThreads.threads.forEach(thread => allThreads.set(thread.id, thread));
      archivedThreads.threads.forEach(thread => allThreads.set(thread.id, thread));

      console.log(`📂 Found ${allThreads.size} threads in forum ${forumChannel.name}`);

      // Scan each thread
      for (const [threadId, thread] of allThreads) {
        // Skip threads created before our date range
        if (thread.createdAt && thread.createdAt < sinceDate) {
          console.log(`⏰ Skipping thread ${thread.name} (created before scan range)`);
          continue;
        }
        
        totalThreads++;
        console.log(`📖 Scanning thread ${totalThreads}/${allThreads.size}: ${thread.name}`);
        
        const threadStats = await this.scanAllChannelMessages(thread, trackedRoles, sinceDate);
        
        // Merge thread stats into forum stats
        for (const [userId, userData] of threadStats) {
          if (!userStats.has(userId)) {
            userStats.set(userId, {
              username: userData.username,
              total: 0,
              channels: new Map(),
              roles: userData.roles
            });
          }

          const overallData = userStats.get(userId);
          overallData.total += userData.total;
          totalMedia += userData.total;

          // Track forum thread as a "channel" with forum prefix
          const forumThreadKey = `forum-${forumChannel.id}-${thread.id}`;
          overallData.channels.set(forumThreadKey, userData.total);
        }

        // Delay between threads to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

    } catch (error) {
      console.error(`❌ Error scanning forum ${forumChannel.name}:`, error.message);
    }

    console.log(`✅ Scanned ${totalThreads} threads in forum ${forumChannel.name}`);
    console.log(`📊 Found ${totalMedia} media items from ${userStats.size} users`);
    
    return userStats;
  }

  // Optimized channel scanning with pagination
  async scanChannel(channel, trackedRoles, sinceDate) {
    console.log(`🔍 Scanning ${channel.type === 15 ? 'forum thread' : 'channel'}: ${channel.name} (${channel.id})`);
    console.log(`📅 Scanning messages since: ${sinceDate.toLocaleDateString()}`);
    
    // Handle forum channels differently
    if (channel.type === 15) { // 15 = GUILD_FORUM
      return await this.scanForumChannel(channel, trackedRoles, sinceDate);
    } else if (channel.isTextBased()) {
      return await this.scanAllChannelMessages(channel, trackedRoles, sinceDate);
    } else {
      console.log(`❌ Channel is not text-based: ${channel.name} (type: ${channel.type})`);
      return new Map();
    }
  }

  // New method for monthly scanning
  async scanChannelsMonthly(channelIds, trackedRoles) {
    console.log(`🔄 Starting MONTHLY attachment scan for ${channelIds.length} channels...`);
    console.log(`🎯 Tracking users with ANY of these roles: ${trackedRoles.join(', ')}`);
    
    const allUserStats = new Map();
    
    // Calculate start of current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    console.log(`📅 Scanning period: ${firstDayOfMonth.toLocaleDateString()} to ${now.toLocaleDateString()}`);
    
    let totalChannelsScanned = 0;
    let startTime = Date.now();

    for (const channelId of channelIds) {
      totalChannelsScanned++;
      
      // Clear cache every 10 channels to prevent memory issues
      if (totalChannelsScanned % 10 === 0) {
        this.clearCache();
      }
      
      console.log(`\n📊 Progress: ${totalChannelsScanned}/${channelIds.length} channels`);
      console.log(`⏱️  Elapsed: ${Math.floor((Date.now() - startTime) / 1000)} seconds`);
      
      const channel = this.client.channels.cache.get(channelId);
      if (!channel) {
        console.log(`❌ Channel not found: ${channelId}`);
        continue;
      }

      console.log(`🔍 Scanning channel ${totalChannelsScanned}/${channelIds.length}: ${channel.name}`);
      const channelStats = await this.scanChannel(channel, trackedRoles, firstDayOfMonth);

      // Merge channel stats into overall stats
      for (const [userId, userData] of channelStats) {
        if (!allUserStats.has(userId)) {
          allUserStats.set(userId, {
            username: userData.username,
            total: 0,
            channels: new Map(),
            roles: userData.roles
          });
        }

        const overallData = allUserStats.get(userId);
        overallData.total += userData.total;

        // Merge channel data
        for (const [channelKey, count] of userData.channels) {
          overallData.channels.set(channelKey, (overallData.channels.get(channelKey) || 0) + count);
        }
      }

      // Progress update
      const currentTotal = Array.from(allUserStats.values()).reduce((sum, user) => sum + user.total, 0);
      console.log(`📈 Running total: ${currentTotal} media items from ${allUserStats.size} users`);

      // Variable delay based on progress
      const delay = totalChannelsScanned % 5 === 0 ? 3000 : 2000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.log(`\n🎯 MONTHLY SCAN COMPLETE!`);
    console.log(`⏱️  Total time: ${totalTime} seconds`);
    console.log(`📊 Scanned ${totalChannelsScanned} channels`);
    console.log(`👤 Found ${allUserStats.size} users with media items`);
    
    // Log user totals
    let grandTotal = 0;
    const sortedUsers = Array.from(allUserStats.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10); // Show top 10 users
    
    console.log(`🏆 TOP CONTRIBUTORS:`);
    for (const [userId, userData] of sortedUsers) {
      console.log(`  👤 ${userData.username}: ${userData.total} media items`);
      grandTotal += userData.total;
    }
    
    // Add remaining users to total
    if (allUserStats.size > 10) {
      const remainingUsers = Array.from(allUserStats.values())
        .slice(10)
        .reduce((sum, user) => sum + user.total, 0);
      grandTotal += remainingUsers;
      console.log(`  ... and ${allUserStats.size - 10} more users with ${remainingUsers} items`);
    }
    
    console.log(`🏆 MONTHLY GRAND TOTAL: ${grandTotal} media items found`);
    
    // Clear cache at the end
    this.clearCache();
    
    return allUserStats;
  }

  // Weekly scanning method
  async scanChannels(channelIds, trackedRoles) {
    console.log(`🔄 Starting WEEKLY attachment scan for ${channelIds.length} channels...`);
    console.log(`🎯 Tracking users with ANY of these roles: ${trackedRoles.join(', ')}`);
    
    const allUserStats = new Map();
    const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    
    console.log(`📅 Scanning period: ${sinceDate.toLocaleDateString()} to ${new Date().toLocaleDateString()}`);
    
    let totalChannelsScanned = 0;
    let startTime = Date.now();

    for (const channelId of channelIds) {
      totalChannelsScanned++;
      
      // Clear cache every 10 channels
      if (totalChannelsScanned % 10 === 0) {
        this.clearCache();
      }
      
      console.log(`\n📊 Progress: ${totalChannelsScanned}/${channelIds.length} channels`);
      console.log(`⏱️  Elapsed: ${Math.floor((Date.now() - startTime) / 1000)} seconds`);
      
      const channel = this.client.channels.cache.get(channelId);
      if (!channel) {
        console.log(`❌ Channel not found: ${channelId}`);
        continue;
      }

      console.log(`🔍 Scanning channel ${totalChannelsScanned}/${channelIds.length}: ${channel.name}`);
      const channelStats = await this.scanChannel(channel, trackedRoles, sinceDate);

      // Merge channel stats into overall stats
      for (const [userId, userData] of channelStats) {
        if (!allUserStats.has(userId)) {
          allUserStats.set(userId, {
            username: userData.username,
            total: 0,
            channels: new Map(),
            roles: userData.roles
          });
        }

        const overallData = allUserStats.get(userId);
        overallData.total += userData.total;

        // Merge channel data
        for (const [channelKey, count] of userData.channels) {
          overallData.channels.set(channelKey, (overallData.channels.get(channelKey) || 0) + count);
        }
      }

      // Progress update
      const currentTotal = Array.from(allUserStats.values()).reduce((sum, user) => sum + user.total, 0);
      console.log(`📈 Running total: ${currentTotal} media items from ${allUserStats.size} users`);

      // Variable delay
      const delay = totalChannelsScanned % 5 === 0 ? 3000 : 2000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    console.log(`\n🎯 WEEKLY SCAN COMPLETE!`);
    console.log(`⏱️  Total time: ${totalTime} seconds`);
    console.log(`📊 Scanned ${totalChannelsScanned} channels`);
    console.log(`👤 Found ${allUserStats.size} users with media items`);
    
    // Log user totals
    let grandTotal = 0;
    const sortedUsers = Array.from(allUserStats.entries())
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 10);
    
    console.log(`🏆 TOP CONTRIBUTORS:`);
    for (const [userId, userData] of sortedUsers) {
      console.log(`  👤 ${userData.username}: ${userData.total} media items`);
      grandTotal += userData.total;
    }
    
    if (allUserStats.size > 10) {
      const remainingUsers = Array.from(allUserStats.values())
        .slice(10)
        .reduce((sum, user) => sum + user.total, 0);
      grandTotal += remainingUsers;
      console.log(`  ... and ${allUserStats.size - 10} more users with ${remainingUsers} items`);
    }
    
    console.log(`🏆 WEEKLY GRAND TOTAL: ${grandTotal} media items found`);
    
    // Clear cache at the end
    this.clearCache();
    
    return allUserStats;
  }

  // Get channel breakdown
  getChannelBreakdown(userStats, channelIds) {
    const channelData = new Map();
    
    for (const channelId of channelIds) {
      const channel = this.client.channels.cache.get(channelId);
      let channelTotal = 0;

      for (const userData of userStats.values()) {
        // Check both direct channel IDs and forum thread keys
        for (const [channelKey, count] of userData.channels) {
          if (channelKey === channelId || channelKey.startsWith(`forum-${channelId}-`)) {
            channelTotal += count;
          }
        }
      }

      const channelName = channel ? 
        (channel.type === 15 ? `🏛️ ${channel.name}` : `#${channel.name}`) : 
        `Unknown Channel (${channelId})`;

      channelData.set(channelId, {
        name: channelName,
        total: channelTotal
      });
    }

    // Sort by total media
    return new Map([...channelData.entries()].sort((a, b) => b[1].total - a[1].total));
  }

  // Get top users sorted by attachment count
  getTopUsers(userStats, limit = 10) {
    return Array.from(userStats.entries())
      .map(([userId, data]) => ({
        userId,
        username: data.username,
        total: data.total,
        channelCount: data.channels.size,
        roles: data.roles
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }
}

module.exports = AttachmentCounter;

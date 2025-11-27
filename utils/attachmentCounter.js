const { Collection } = require('discord.js');

class AttachmentCounter {
  constructor(client) {
    this.client = client;
    this.weeklyData = new Map();
  }

  // Check if user has any of the tracked roles
  userHasTrackedRole(member, trackedRoles) {
    if (!member) {
      console.log(`❌ No member object provided for role check`);
      return false;
    }
    
    const hasRole = member.roles.cache.some(role => trackedRoles.includes(role.id));
    
    // Enhanced debugging
    if (!hasRole) {
      console.log(`🔍 Role check FAILED for ${member.user.tag}:`);
      console.log(`   Needed roles: ${trackedRoles.join(', ')}`);
      console.log(`   User's role IDs: ${Array.from(member.roles.cache.keys()).join(', ')}`);
      
      // Check if any role IDs match
      const matchingRoles = member.roles.cache.filter(role => trackedRoles.includes(role.id));
      if (matchingRoles.size > 0) {
        console.log(`   ⚠️  FOUND MATCHING ROLES:`, matchingRoles.map(r => `${r.name} (${r.id})`));
      }
    } else {
      console.log(`✅ Role check PASSED for ${member.user.tag}`);
    }
    
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

  // Scan ALL messages in a channel from sinceDate (with pagination)
  async scanAllChannelMessages(channel, trackedRoles, sinceDate) {
    console.log(`🔍 Scanning ALL messages in ${channel.name} since ${sinceDate.toLocaleString()}`);
    
    const userStats = new Map();
    let totalMessages = 0;
    let totalMedia = 0;
    let lastMessageId = null;
    let hasMoreMessages = true;
    let batchCount = 0;

    try {
      while (hasMoreMessages) {
        batchCount++;
        const options = { limit: 100 };
        if (lastMessageId) {
          options.before = lastMessageId;
        }

        const messages = await channel.messages.fetch(options);
        console.log(`📦 Batch ${batchCount}: Found ${messages.size} messages in ${channel.name}`);

        if (messages.size === 0) {
          hasMoreMessages = false;
          break;
        }

        let batchOlderThanRange = false;

        for (const [messageId, message] of messages) {
          // Stop if we've reached messages older than our date range
          if (message.createdAt < sinceDate) {
            batchOlderThanRange = true;
            break;
          }

          // Only count messages from users with tracked roles
          if (message.author.bot) continue;
          
          // Ensure we have member data
          let member = message.member;
          if (!member && message.guild) {
            try {
              member = await message.guild.members.fetch(message.author.id);
            } catch (error) {
              console.log(`❌ Could not fetch member data for ${message.author.tag}:`, error.message);
              continue;
            }
          }

          if (!member) {
            console.log(`❌ No member data for ${message.author.tag}, skipping`);
            continue;
          }
          
          const hasTrackedRole = this.userHasTrackedRole(member, trackedRoles);
          
          if (!hasTrackedRole) {
            continue;
          }

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
            
            // Only log every 10th media item to reduce spam
            if (totalMedia % 10 === 0) {
              console.log(`📎 Found ${mediaItems} media items from ${username} in ${channel.name} (Total: ${totalMedia})`);
            }
          }

          totalMessages++;
          lastMessageId = messageId;
        }

        // If this batch contained messages older than our range, we're done
        if (batchOlderThanRange) {
          console.log(`⏰ Reached messages older than scan range in ${channel.name}`);
          hasMoreMessages = false;
          break;
        }

        // Small delay between batches to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Safety limit: don't scan more than 2000 messages per channel
        if (totalMessages >= 2000) {
          console.log(`⚠️  Safety limit reached: scanned ${totalMessages} messages in ${channel.name}`);
          break;
        }
      }

    } catch (error) {
      console.error(`❌ Error scanning channel ${channel.name}:`, error.message);
    }

    console.log(`✅ Scanned ${totalMessages} total messages in ${channel.name}, found ${totalMedia} media items in ${batchCount} batches`);
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
      const archivedThreads = await forumChannel.threads.fetchArchived({ limit: 50 });
      
      const allThreads = new Collection();
      activeThreads.threads.forEach(thread => allThreads.set(thread.id, thread));
      archivedThreads.threads.forEach(thread => allThreads.set(thread.id, thread));

      console.log(`📂 Found ${allThreads.size} threads in forum ${forumChannel.name}`);

      // Scan each thread
      for (const [threadId, thread] of allThreads) {
        if (thread.createdAt < sinceDate) continue;
        
        totalThreads++;
        console.log(`📖 Scanning thread: ${thread.name}`);
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

          // Track forum thread as a "channel"
          const forumThreadKey = `forum-${forumChannel.id}-${thread.id}`;
          overallData.channels.set(forumThreadKey, userData.total);
        }

        // Delay between threads
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(`❌ Error scanning forum ${forumChannel.name}:`, error.message);
    }

    console.log(`✅ Scanned ${totalThreads} threads in forum ${forumChannel.name}, found ${totalMedia} media items`);
    return userStats;
  }

  // Optimized channel scanning with pagination
  async scanChannel(channel, trackedRoles, sinceDate) {
    console.log(`🔍 Scanning ${channel.type === 15 ? 'forum thread' : 'channel'}: ${channel.name} (${channel.id})`);
    console.log(`📅 Scanning ALL messages since: ${sinceDate.toLocaleString()}`);
    
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

  // Scan only specified channels (with forum support)
  async scanChannels(channelIds, trackedRoles) {
    console.log(`🔄 Starting COMPLETE attachment scan for ${channelIds.length} channels...`);
    console.log(`🎯 Tracking users with ANY of these roles: ${trackedRoles.join(', ')}`);
    
    const allUserStats = new Map();
    const sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
    let totalChannelsScanned = 0;

    for (const channelId of channelIds) {
      totalChannelsScanned++;
      console.log(`\n📊 Progress: ${totalChannelsScanned}/${channelIds.length} channels`);
      
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

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    console.log(`\n🎯 COMPLETE SCAN FINISHED!`);
    console.log(`📊 Scanned ${totalChannelsScanned} channels`);
    console.log(`👤 Found ${allUserStats.size} users with media items`);
    
    // Log user totals
    let grandTotal = 0;
    for (const [userId, userData] of allUserStats) {
      console.log(`👤 ${userData.username} (${userId}) - ${userData.total} media items`);
      grandTotal += userData.total;
    }
    
    console.log(`🏆 GRAND TOTAL: ${grandTotal} media items found`);
    
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

    return channelData;
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

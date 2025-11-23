// In the scanChannel method, update the date check:
async scanChannel(channel, trackedRoles, sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) {
    console.log(`🔍 Scanning ${channel.type === 15 ? 'forum thread' : 'channel'}: ${channel.name} (${channel.id})`);
    console.log(`📅 Scanning messages since: ${sinceDate.toLocaleString()}`);
    
    const userStats = new Map();
    let messageCount = 0;
    let mediaCount = 0;

    try {
      // Use proper limit (100 is Discord's maximum)
      const messages = await channel.messages.fetch({ limit: 100 });
      console.log(`📨 Found ${messages.size} messages in ${channel.name}`);

      for (const [messageId, message] of messages) {
        // Stop if we've reached messages older than our date range
        if (message.createdAt < sinceDate) {
          console.log(`⏰ Reached messages older than scan range in ${channel.name}`);
          break;
        }

        // Only count messages from users with tracked roles
        if (message.author.bot) continue;
        
        const hasTrackedRole = this.userHasTrackedRole(message.member, trackedRoles);
        const userRoles = this.getUserRoles(message.member);
        
        if (!hasTrackedRole) {
          // Only log this occasionally to reduce spam
          if (Math.random() < 0.1) { // 10% chance to log
            console.log(`🚫 Skipping message from ${message.author.tag} - No tracked roles`);
          }
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
              roles: userRoles
            });
          }

          const userData = userStats.get(userId);
          userData.total += mediaItems;
          userData.channels.set(channel.id, (userData.channels.get(channel.id) || 0) + mediaItems);

          mediaCount += mediaItems;
          console.log(`📎 Found ${mediaItems} media items from ${username} in ${channel.name}`);
        }

        messageCount++;
      }

    } catch (error) {
      console.error(`❌ Error scanning channel ${channel.name}:`, error.message);
    }

    console.log(`✅ Scanned ${messageCount} messages in ${channel.name}, found ${mediaCount} media items`);
    return userStats;
  }

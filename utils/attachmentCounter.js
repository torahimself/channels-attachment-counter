// New method for monthly scanning
async scanChannelsMonthly(channelIds, trackedRoles) {
  console.log(`🔄 Starting MONTHLY attachment scan for ${channelIds.length} channels...`);
  console.log(`🎯 Tracking users with ANY of these roles: ${trackedRoles.join(', ')}`);
  
  const allUserStats = new Map();
  
  // Calculate start of current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
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

    // Small delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log(`\n🎯 MONTHLY SCAN FINISHED!`);
  console.log(`📊 Scanned ${totalChannelsScanned} channels`);
  console.log(`👤 Found ${allUserStats.size} users with media items`);
  
  // Log user totals
  let grandTotal = 0;
  for (const [userId, userData] of allUserStats) {
    console.log(`👤 ${userData.username} (${userId}) - ${userData.total} media items`);
    grandTotal += userData.total;
  }
  
  console.log(`🏆 MONTHLY GRAND TOTAL: ${grandTotal} media items found`);
  
  return allUserStats;
}

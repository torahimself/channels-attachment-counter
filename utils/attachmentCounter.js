// Add to constructor:
constructor(client) {
  this.client = client;
  this.weeklyData = new Map();
  this.monthlyData = new Map();
  this.allChannelsCache = []; // Cache for all channels including categories
}

// NEW METHOD: Get all channels including category expansion
getAllChannelsToScan(config) {
  if (this.allChannelsCache.length > 0) {
    return this.allChannelsCache;
  }
  
  const allChannels = [...config.channels];
  
  // Add all channels from specified categories
  for (const categoryId of config.categories || []) {
    const category = this.client.channels.cache.get(categoryId);
    if (category && category.type === 4) { // GUILD_CATEGORY
      const categoryChannels = category.children.cache
        .filter(ch => ch.isTextBased() && !ch.isThread())
        .map(ch => ch.id);
      
      console.log(`📂 Adding ${categoryChannels.length} channels from category: ${category.name}`);
      allChannels.push(...categoryChannels);
    }
  }
  
  // Remove duplicates
  const uniqueChannels = [...new Set(allChannels)];
  this.allChannelsCache = uniqueChannels;
  
  console.log(`📊 Total channels to scan: ${uniqueChannels.length}`);
  console.log(`📁 From config: ${config.channels.length}`);
  console.log(`📂 From categories: ${uniqueChannels.length - config.channels.length}`);
  
  return uniqueChannels;
}

// Update the scanChannels method to use getAllChannelsToScan:
async scanChannels(config, trackedRoles, reportType = 'weekly') {
  console.log(`🔄 Starting ${reportType.toUpperCase()} attachment scan...`);
  
  const allChannels = this.getAllChannelsToScan(config);
  const allUserStats = new Map();
  
  // Calculate date range
  let sinceDate;
  if (reportType === 'monthly') {
    // First day of current month
    const now = new Date();
    sinceDate = new Date(now.getFullYear(), now.getMonth(), 1);
    console.log(`📅 Monthly scan: From ${sinceDate.toLocaleDateString()} to now`);
  } else {
    // Last 7 days for weekly
    sinceDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    console.log(`📅 Weekly scan: Last 7 days from ${sinceDate.toLocaleDateString()}`);
  }
  
  let totalChannelsScanned = 0;

  for (const channelId of allChannels) {
    totalChannelsScanned++;
    console.log(`\n📊 Progress: ${totalChannelsScanned}/${allChannels.length} channels`);
    
    const channel = this.client.channels.cache.get(channelId);
    if (!channel) {
      console.log(`❌ Channel not found: ${channelId}`);
      continue;
    }

    console.log(`🔍 Scanning channel ${totalChannelsScanned}/${allChannels.length}: ${channel.name}`);
    const channelStats = await this.scanChannel(channel, trackedRoles, sinceDate);

    // Merge channel stats into overall stats
    for (const [userId, userData] of channelStats) {
      if (!allUserStats.has(userId)) {
        allUserStats.set(userId, {
          username: userData.username,
          total: 0,
          channels: new Map(),
          roles: userData.roles,
          userMention: `<@${userId}>`
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
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n🎯 ${reportType.toUpperCase()} SCAN FINISHED!`);
  console.log(`📊 Scanned ${totalChannelsScanned} channels`);
  console.log(`👤 Found ${allUserStats.size} users with media items`);
  
  // Log user totals with mentions
  let grandTotal = 0;
  for (const [userId, userData] of allUserStats) {
    console.log(`👤 ${userData.username} (${userId}) - ${userData.total} media items`);
    console.log(`   Mention: <@${userId}>`);
    grandTotal += userData.total;
  }
  
  console.log(`🏆 ${reportType.toUpperCase()} GRAND TOTAL: ${grandTotal} media items found`);
  
  return allUserStats;
}

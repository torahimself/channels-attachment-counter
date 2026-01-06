// Update the generateMainReport method:
generateMainReport(topUsers, channelBreakdown, totalMedia, reportType = 'weekly', userStats = null) {
  const isMonthly = reportType === 'monthly';
  const title = isMonthly ? '📅 MONTHLY MEDIA REPORT' : '📊 WEEKLY MEDIA REPORT';
  const color = isMonthly ? 0x9B59B6 : 0x00AE86;
  const period = isMonthly ? 'Last 30 Days' : 'Last 7 Days';
  const nextReport = isMonthly ? '1st of next month\n1:00 AM Riyadh Time' : 'Friday 1:00 AM\nRiyadh Time';
  
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Media Counter • Report generated` });

  // Top Contributors with mentions
  if (topUsers.length > 0) {
    const topUsersText = topUsers.map((user, index) => {
      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
      return `${medal} <@${user.userId}> - **${user.total}** media items`;
    }).join('\n\n');
    
    embed.addFields({
      name: '🏆 TOP CONTRIBUTORS',
      value: topUsersText || 'No media found this period',
      inline: false
    });
  }

  // Channel Breakdown
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

  // User Participation Summary
  if (userStats) {
    const userCount = userStats.size;
    const activeUsers = Array.from(userStats.values()).filter(u => u.total > 0).length;
    
    embed.addFields({
      name: '👥 USER PARTICIPATION',
      value: `**Total Tracked Users:** ${userCount}\n**Active Contributors:** ${activeUsers}\n**Participation Rate:** ${Math.round((activeUsers / userCount) * 100)}%`,
      inline: true
    });
  }

  // Media Summary
  const activeChannels = Array.from(channelBreakdown.values()).filter(ch => ch.total > 0).length;
  
  embed.addFields(
    {
      name: '📈 MEDIA SUMMARY',
      value: `**Total Media:** ${totalMedia}\n**Avg per User:** ${Math.round(totalMedia / (userStats?.size || 1))}\n**Active Channels:** ${activeChannels}`,
      inline: true
    },
    {
      name: '⏰ NEXT REPORT',
      value: nextReport,
      inline: true
    }
  );

  return embed;
}

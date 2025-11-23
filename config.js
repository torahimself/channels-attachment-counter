module.exports = {
  // Bot Configuration
  botToken: process.env.BOT_TOKEN,
  
  // Categories to scan for attachments
  categories: [
    "1357360836229730537",
    "1357342267081359380", 
    "1358456147191005336",
    "1364189917412069457"
  ],
  
  // Roles to track (only count attachments from these roles)
  trackedRoles: [
    "1357406949989155079",
    "1429900051223806122",
    "1429899952699474112",
    "1429900133268721796", 
    "1357421725481959565",
    "1407774752319344763",
    "1357281801940369418"
  ],
  
  // Report channel where weekly reports are sent
  reportChannel: "1435870655508774972",
  
  // Schedule (Friday 2:00 PM Riyadh time = 11:00 AM UTC)
  schedule: "0 11 * * 5", // cron: minute 0, hour 11, any day of month, any month, Friday (5)
  
  // Timezone for reporting
  timezone: "Asia/Riyadh"
};

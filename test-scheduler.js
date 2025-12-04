// Test script to check scheduler availability
const { Client, GatewayIntentBits } = require('discord.js');
const config = require('./config.js');

// Create a minimal test
async function testScheduler() {
  console.log('🧪 Testing scheduler initialization...');
  
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent
    ],
  });
  
  // Simulate ready event
  const AttachmentCounter = require('./utils/attachmentCounter');
  const ReportGenerator = require('./utils/reportGenerator');
  const Scheduler = require('./utils/scheduler');
  
  console.log('🔄 Initializing systems...');
  const attachmentCounter = new AttachmentCounter(client);
  const reportGenerator = new ReportGenerator(client);
  const scheduler = new Scheduler(client, attachmentCounter, reportGenerator);
  
  client.scheduler = scheduler;
  console.log('✅ Scheduler attached to client:', client.scheduler ? 'YES' : 'NO');
  
  // Test command execution simulation
  console.log('\n🧪 Testing command simulation...');
  const statsmCommand = require('./commands/statsm');
  
  // Create mock interaction
  const mockInteraction = {
    user: { tag: 'TestUser#1234' },
    member: {
      roles: {
        cache: {
          has: (roleId) => roleId === "1438249316559884499"
        }
      }
    },
    client: { scheduler: scheduler },
    editReply: (message) => {
      console.log(`📝 Bot would reply: ${message}`);
      return Promise.resolve();
    }
  };
  
  console.log('🔄 Executing statsm command test...');
  try {
    await statsmCommand.execute(mockInteraction, scheduler);
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('🔍 Error stack:', error.stack);
  }
  
  process.exit(0);
}

testScheduler().catch(console.error);

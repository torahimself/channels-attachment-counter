// Quick test to check scheduler initialization
console.log('🧪 Testing scheduler flow...');

// Check if ready.js exports getGlobalScheduler
try {
  const readyEvent = require('./events/ready');
  console.log(`✅ Ready event loaded:`, typeof readyEvent.getGlobalScheduler);
} catch (error) {
  console.log(`❌ Error loading ready event:`, error.message);
}

// Check interactionCreate
try {
  const interactionHandler = require('./events/interactionCreate');
  console.log(`✅ Interaction handler loaded:`, typeof interactionHandler.setScheduler);
} catch (error) {
  console.log(`❌ Error loading interaction handler:`, error.message);
}

// Check statsm command
try {
  const statsmCommand = require('./commands/statsm');
  console.log(`✅ Statsm command loaded:`, typeof statsmCommand.execute);
} catch (error) {
  console.log(`❌ Error loading statsm command:`, error.message);
}

console.log('\n📋 MANUAL TEST STEPS:');
console.log('1. Restart your bot on Render');
console.log('2. Wait for "READY EVENT FIRED!" in logs');
console.log('3. Check if "✅ Scheduler attached to client object" appears');
console.log('4. Use /statsm command in Discord');

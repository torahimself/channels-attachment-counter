// Test file to check for syntax errors
try {
  require('./events/ready.js');
  console.log('✅ ready.js loaded successfully');
} catch (error) {
  console.log('❌ Error in ready.js:', error.message);
}

try {
  require('./utils/attachmentCounter.js');
  console.log('✅ attachmentCounter.js loaded successfully');
} catch (error) {
  console.log('❌ Error in attachmentCounter.js:', error.message);
}

try {
  require('./utils/scheduler.js');
  console.log('✅ scheduler.js loaded successfully');
} catch (error) {
  console.log('❌ Error in scheduler.js:', error.message);
}

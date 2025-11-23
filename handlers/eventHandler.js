const fs = require('fs');
const path = require('path');

function loadEvents(client) {
  try {
    const eventsPath = path.join(__dirname, '../events');
    
    if (!fs.existsSync(eventsPath)) {
      console.log('⚠️  Events directory not found, creating...');
      fs.mkdirSync(eventsPath, { recursive: true });
      return;
    }

    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    console.log(`📁 Found event files: ${eventFiles.join(', ')}`);

    let loadedCount = 0;

    for (const file of eventFiles) {
      try {
        const eventPath = path.join(eventsPath, file);
        console.log(`🔧 Loading event from: ${file}`);
        
        const event = require(eventPath);
        
        if (!event.name || !event.execute) {
          console.log(`❌ Invalid event structure in ${file}: missing name or execute`);
          continue;
        }
        
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args));
        } else {
          client.on(event.name, (...args) => event.execute(...args));
        }
        
        console.log(`✅ Loaded event: ${event.name} from ${file}`);
        loadedCount++;
      } catch (error) {
        console.error(`❌ Error loading event ${file}:`, error.message);
      }
    }

    console.log(`✅ Loaded ${loadedCount} events`);
  } catch (error) {
    console.error('❌ Error loading events:', error);
  }
}

module.exports = { loadEvents };

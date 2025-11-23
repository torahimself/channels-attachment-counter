const fs = require('fs');
const path = require('path');

const commands = new Map();

function loadCommands() {
  try {
    const commandsPath = path.join(__dirname, '../commands');
    
    if (!fs.existsSync(commandsPath)) {
      console.log('⚠️  Commands directory not found, creating...');
      fs.mkdirSync(commandsPath, { recursive: true });
      return;
    }

    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
      try {
        const commandPath = path.join(commandsPath, file);
        const command = require(commandPath);
        
        if (command.data && typeof command.data.name === 'string') {
          commands.set(command.data.name, command);
          console.log(`✅ Loaded command: ${command.data.name}`);
        } else {
          console.log(`❌ Invalid command structure in ${file}`);
        }
      } catch (error) {
        console.error(`❌ Error loading command ${file}:`, error.message);
      }
    }

    console.log(`✅ Loaded ${commands.size} commands`);
  } catch (error) {
    console.error('❌ Error loading commands:', error);
  }
}

function getCommands() {
  return Array.from(commands.values()).map(cmd => cmd.data.toJSON());
}

function executeCommand(interaction, scheduler) {
  const command = commands.get(interaction.commandName);
  if (!command) {
    console.log(`❌ Command not found: ${interaction.commandName}`);
    return false;
  }

  try {
    command.execute(interaction, scheduler);
    return true;
  } catch (error) {
    console.error(`Error executing command ${interaction.commandName}:`, error);
    
    if (interaction.replied || interaction.deferred) {
      interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
    } else {
      interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
    }
    
    return true;
  }
}

module.exports = {
  loadCommands,
  getCommands,
  executeCommand,
  commands
};

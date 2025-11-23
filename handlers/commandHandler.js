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
    console.log(`📁 Found command files: ${commandFiles.join(', ')}`);

    for (const file of commandFiles) {
      try {
        const commandPath = path.join(commandsPath, file);
        console.log(`🔧 Loading command from: ${file}`);
        
        const command = require(commandPath);
        
        if (command.data && typeof command.data.name === 'string') {
          commands.set(command.data.name, command);
          console.log(`✅ Loaded command: ${command.data.name} from ${file}`);
        } else {
          console.log(`❌ Invalid command structure in ${file}:`, command);
        }
      } catch (error) {
        console.error(`❌ Error loading command ${file}:`, error.message);
      }
    }

    console.log(`✅ Loaded ${commands.size} commands: ${Array.from(commands.keys()).join(', ')}`);
  } catch (error) {
    console.error('❌ Error loading commands:', error);
  }
}

function getCommands() {
  const commandList = Array.from(commands.values()).map(cmd => cmd.data.toJSON());
  console.log(`📋 Registering commands: ${commandList.map(cmd => cmd.name).join(', ')}`);
  return commandList;
}

function executeCommand(interaction, scheduler) {
  console.log(`🔧 Looking for command: ${interaction.commandName}`);
  console.log(`📝 Available commands: ${Array.from(commands.keys()).join(', ')}`);
  
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

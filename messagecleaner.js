const Discord = require('discord.js');
const { Client, Intents } = require('discord.js');
const colors = require('colors');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES
  ]
});

const channelId = 'CHANNEL_ID';
let deleteDelay = 0; // Delete delay in milliseconds
const searchInterval = 30; // Number of deletions before fetching new messages
const messagesToDelete = 600; // Number of messages to delete before triggering cooldown
const cooldown = 2500; // Cooldown period in milliseconds
const baseDeleteDelay = 55; // Base delete delay in milliseconds

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  deleteMessages();
});

client.on('rateLimit', (rateLimitInfo) => {
  console.log(colors.red(`Rate Limited by the API. Retry after ${rateLimitInfo.timeout}ms`));
  if (deleteDelay === baseDeleteDelay) {
    deleteDelay = cooldown;
    console.log(colors.yellow(`Increasing delete delay to ${deleteDelay}ms`));
  } else {
    const newDeleteDelay = Math.max(deleteDelay - 100, baseDeleteDelay);
    if (newDeleteDelay !== deleteDelay) {
      deleteDelay = newDeleteDelay;
      console.log(colors.yellow(`Decreasing delete delay to ${deleteDelay}ms`));
    } else if (deleteDelay > baseDeleteDelay) {
      console.log(colors.yellow(`Delete delay already at minimum. Keeping it at ${deleteDelay}ms`));
    }
  }
});

async function deleteMessages() {
  const channel = await client.channels.fetch(channelId);
  if (!channel) {
    console.log(`Channel with ID ${channelId} not found.`);
    return;
  }

  let deletedCount = 0;
  let searchedCount = 0;
  let startTime = Date.now();
  let deleteCounter = 0;
  let isCooldown = false;

  while (true) {
    try {
      if (searchedCount === searchInterval) {
        console.log(colors.green('Fetching next 30 messages...'));
        searchedCount = 0;
      }

      const fetchedMessages = await channel.messages.fetch({ limit: 30 });
      if (fetchedMessages.size === 0) {
        break;
      }

      for (const [messageId, message] of fetchedMessages) {
        if (!isCooldown) {
          console.log(`Deleted message with ID ${messageId}. Delete delay: ${deleteDelay}ms`);
          await message.delete();
          deletedCount++;
          searchedCount++;
          deleteCounter++;

          if (deleteCounter === messagesToDelete) {
            isCooldown = true;
            console.log(colors.yellow(`Cooldown activated. Waiting for ${cooldown / 1000} seconds...`));
            await delay(cooldown);
            isCooldown = false;
            deleteCounter = 0;
          } else if (deleteDelay > baseDeleteDelay) {
            const newDeleteDelay = Math.max(deleteDelay - 100, baseDeleteDelay);
            if (newDeleteDelay !== deleteDelay) {
              deleteDelay = newDeleteDelay;
              console.log(colors.yellow(`Decreasing delete delay to ${deleteDelay}ms`));
            } else if (deleteDelay > baseDeleteDelay) {
              console.log(colors.yellow(`Delete delay already at minimum. Keeping it at ${deleteDelay}ms`));
            }
          }

          await delay(deleteDelay);
        } else {
          console.log(colors.yellow('Cooldown active. Skipping message deletion.'));
        }
      }
    } catch (error) {
      if (error.code === 403) {
        console.log(colors.red('[Error] Invalid permissions to delete messages in the channel.'));
        break;
      } else {
        console.log(colors.red(`[Error] ${error.message}`));
      }
    }
  }

  const endTime = Date.now();
  const elapsedTime = endTime - startTime;

  console.log(`Deleted ${deletedCount} messages. Channel cleared.`);
  console.log(`Elapsed time: ${formatTime(elapsedTime)}.`);
}

client.login('BOT_TOKEN_HERE');

// Delay function to introduce a delay in milliseconds
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Format time in milliseconds to a human-readable format
function formatTime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} minutes, ${remainingSeconds} seconds`;
}

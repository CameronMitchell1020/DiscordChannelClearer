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
const deleteDelay = 0; // Delete delay in milliseconds
const searchInterval = 30; // Number of deletions before fetching new messages
const rateLimitDelay = 3000; // Delay in milliseconds for rate-limited requests

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  deleteMessages();
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

  while (true) {
    try {
      if (searchedCount === searchInterval) {
        console.log(colors.yellow('Fetching next 30 messages...'));
        searchedCount = 0;
      }

      const fetchedMessages = await channel.messages.fetch({ limit: 30 });
      if (fetchedMessages.size === 0) {
        break;
      }

      for (const [messageId, message] of fetchedMessages) {
        console.log(`Deleted message with ID ${messageId}. Delete delay: ${deleteDelay}ms`);
        await message.delete();
        deletedCount++;
        searchedCount++;
        await delay(deleteDelay);
      }
    } catch (error) {
      if (error.code === 429) {
        console.log(colors.yellow('[Rate Limited] Being rate limited by the API.'));
        await delay(rateLimitDelay);
      } else if (error.code === 403) {
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

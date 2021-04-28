const { WebClient } = require('@slack/web-api');
const { createEventAdapter } = require('@slack/events-api');
const moment = require('moment');
// Read the signing secret from the environment variables
const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const USER_TOKEN = process.env.SLACK_USER_TOKEN;
const port = 4040;
const slackEvents = createEventAdapter(slackSigningSecret);

let channelId = null;
let messageTs = null;
let query = null;
let userAskingQuery = null;
const webUser = new WebClient(USER_TOKEN);
const webBot = new WebClient(BOT_TOKEN);

slackEvents.on('app_mention', (event) => {
  if (event.bot_id) return;
  channelId = event.channel;
  messageTs = event.ts;
  query = extractUser(event.text);
  userAskingQuery = event.user;
  console.log(`Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`);
  searchForMessage(event.channel, query, userAskingQuery);
});
function extractUser(text) {
  const exp = new RegExp("<@(\\w+)(?:\\|\\w+)?>", "gm");
  return text.replace(exp, '');
}
const searchForMessage = (teamId, message, userId) => {
  (async () => {
    
    // searching with entire query
    if (message) {
      const searchResults = await webUser.search.messages({
        query: message,
        team_id: teamId,
        count: 10,
        sort: 'score',
        sort_dir: 'desc',
      });
      if (searchResults.ok) {
        postMessages(searchResults.messages.matches)
      }
    }
  })();
}
function truncateString(str, num) {
  // If the length of str is less than or equal to num
  // just return str--don't truncate it.
  if (str.length <= num) {
    return str
  }
  // Return str truncated with '...' concatenated to the end of str.
  return str.slice(0, num) + '...'
}

const postMessages = (matches) => {
  let messageToBePosted = [{
    "type": "section",
    "text": {
      "type": "mrkdwn",
      text: `*Hi <@${userAskingQuery}>, here are responses similar to your questions*`,
    }
  }];
  if (matches.length > 0) {
    matches.forEach((match) => {

      if (match.username !== 'slack_overflow' && match.type !== 'im' && !match.channel.is_private && !match.text.includes('U01U67LH00L')) {
        if (match.user) {
          messageToBePosted.push(
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": `*${match.username}*  ${extractUser(truncateString(match.text, 200))}`
              }
            })
          messageToBePosted.push({
            "type": "context",
            "elements": [
              {
                "type": "mrkdwn",
                "text": `>Posted in <${match.permalink}| #${match.channel.name}> at ${moment.unix(match.ts).format('MMMM, Do yy')} <${match.permalink}|view message> \n\n`
              }
            ]
          })
          messageToBePosted.push({
            type: 'divider',
          })
        }
      }
    })
  }
  postMessage(messageToBePosted)
}
var encodedStr = rawStr => rawStr.replace(/[&]/g, function (i) {
  return '&amp';
}).replace(/[<]/g, function (i) {
  return '&lt;';
}).replace(/[>]/g, function (i) {
  return '&gt;';
}).replace(/[\n]/g, function (i) {
  return ' ';
});



const postMessage = async (message) => {
  const noMatchFound = [{
    "type": "section",
    "block_id": "nomathc",
    "text": {
      "type": "mrkdwn",
      "text": `Hi <@${userAskingQuery}>, *Sorry* I couldn't find any queries similar to yours. Try refining your query with different keywords`
    },
    "accessory": {
      "type": "image",
      "image_url": "https://tenor.com/view/pikachu-cry-pokemon-sad-gif-18104014",
      "alt_text": "sad pikachu"
    }
  }];
  // console.log(message)
  if (message.length > 1) {
    await webBot.chat.postMessage({ channel: channelId, blocks: message, mrkdwn: true, thread_ts: messageTs, contentType: 'application/json', "unfurl_links": false, })
  } else {
    await webBot.chat.postMessage({ channel: channelId, blocks: noMatchFound, mrkdwn: true, thread_ts: messageTs, contentType: 'application/json', "unfurl_links": false })
  }
}
(async () => {
  const server = await slackEvents.start(port);
  console.log(`Listening for events on ${server.address().port}`);
})();



slackEvents.on('error', (error) => {
  console.log(error);
})
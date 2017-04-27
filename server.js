// .envÇÉçÅ[Éh
require('dotenv').config();

var Discord = require('discord.io');

var bot = new Discord.Client({
    token: process.env.DISCORD_TOKEN,
    autorun: true
});
 
bot.on('ready', function() {
    console.log('Logged in as %s - %s\n', bot.username, bot.id);
});
 
bot.on('message', function(user, userID, channelID, message, event) {
    console.log(message);
    if (userID != bot.id && channelID ===process.env.DISCORD_TARGET_CHANNEL) {
        bot.sendMessage({
            to: channelID,
            message: message
        });
    }
});

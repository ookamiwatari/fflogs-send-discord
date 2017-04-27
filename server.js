// .env�����[�h
require('dotenv').config();

var express = require('express');
var app = express();
var Discord = require('discord.io');
var request = require('sync-request');

var bot = new Discord.Client({
	token: process.env.DISCORD_TOKEN,
	autorun: true
});

var targetUserList = ['ookamiwatari', 'whitebaku'];
var targetReportList = [];

// discord�ɐڑ�������
var discordReady = false;


// ���|�[�g���X�g���擾���郋�[�v
setInterval(getReportList, 5000);

app.get('/', function (req, res) {
  res.send('Hello, World!');
});

app.listen(process.env.PORT || 3000);


bot.on('ready', function() {
	console.log('Logged in as %s - %s\n', bot.username, bot.id);
	discordReady = true;
});
 
bot.on('message', function(user, userID, channelID, message, event) {
	
	if (channelID !== process.env.DISCORD_TARGET_CHANNEL) {
		return;
	}
	
	var messageArray = message.split(' ');
	
	if (messageArray.length < 2 || messageArray[0] !== 'logs') {
		return;
	}
	
	// user list�̖��߂�ǉ�
	// ToDo: �킩��₷���`�悳����
	if (messageArray[1] === 'user' && messageArray[2] === 'list' && messageArray.length == 3 ) {
		sendDiscord(targetUserList.join('\n'));
	}
	
	// user add *�̖��߂�ǉ�
	if (messageArray[1] === 'user' && messageArray[2] === 'add' && messageArray.length == 4 ) {
	
		// ���̖��O�����݂��邩�m�F
		var url = 'https://www.fflogs.com/v1/reports/user/' + messageArray[3] + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		var response = request('GET', url);
		if (response.statusCode == 400) {
			var message = 'User \'' + messageArray[3] + '\' cannot be found.'
			sendDiscord(message);
			return;
		}
		
		// ���ɒǉ�����Ă���ꍇ
		if (targetUserList.indexOf(messageArray[3]) >=0 ) {
			var message = 'User \'' + messageArray[3] + '\' already exists.'
			sendDiscord(message);
			return;
		}
		
		// ���X�g�ɒǉ�
		var message = 'User \'' + messageArray[3] + '\' was added successfully.'
		sendDiscord(message);
		targetUserList.push(messageArray[3]);
	}
	
	// user delete *�̖��߂�ǉ�
	if (messageArray[1] === 'user' && messageArray[2] === 'delete' && messageArray.length == 4 ) {
	
		// ���̖��O�����݂��邩�m�F
		var index = targetUserList.indexOf(messageArray[3]);
		if (index >=0 ) {
			targetUserList.splice(index,1);
			var message = 'User \'' + messageArray[3] + '\' was deleted successfully.'
			sendDiscord(message);
			return;
			
		} else {
			// ���݂��Ȃ��ꍇ
			var message = 'User \'' + messageArray[3] + '\' is undefined.'
			sendDiscord(message);
			return;
		}
	}
	
	// user delete �̖��߂�ǉ�
	if (messageArray[1] === 'user' && messageArray[2] === 'delete' && messageArray.length == 3 ) {
		targetUserList = [];
		var message = 'UserList delete successfully.'
		sendDiscord(message);
		return;
	}

	// user list�̖��߂�ǉ�
	// ToDo: �킩��₷���`�悳����
	if (messageArray[1] === 'report' && messageArray[2] === 'list' && messageArray.length == 3 ) {
		sendDiscord(targetReportList.join('\n'));
	}
	
	// user add *�̖��߂�ǉ�
	if (messageArray[1] === 'report' && messageArray[2] === 'add' && messageArray.length == 4 ) {
	
		// ���̖��O�����݂��邩�m�F
		var url = 'https://www.fflogs.com/v1/report/fights/' + messageArray[3] + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		var response = request('GET', url);
		if (response.statusCode == 400) {
			var message = 'Report \'' + messageArray[3] + '\' cannot be found.'
			sendDiscord(message);
			return;
		}
		
		// ���ɒǉ�����Ă���ꍇ
		if (targetReportList.indexOf(messageArray[3]) >=0 ) {
			var message = 'Report \'' + messageArray[3] + '\' already exists.'
			sendDiscord(message);
			return;
		}
		
		// ���X�g�ɒǉ�
		var message = 'Report \'' + messageArray[3] + '\' was added successfully.'
		sendDiscord(message);
		targetReportList.push(messageArray[3]);
	}
	
	// user delete *�̖��߂�ǉ�
	if (messageArray[1] === 'report' && messageArray[2] === 'delete' && messageArray.length == 4 ) {
	
		// ���̖��O�����݂��邩�m�F
		var index = targetReportList.indexOf(messageArray[3]);
		if (index >=0 ) {
			targetReportList.splice(index,1);
			var message = 'Report \'' + messageArray[3] + '\' was deleted successfully.'
			sendDiscord(message);
			return;
			
		} else {
			// ���݂��Ȃ��ꍇ
			var message = 'Report \'' + messageArray[3] + '\' is undefined.'
			sendDiscord(message);
			return;
		}
	}
	
	// user delete �̖��߂�ǉ�
	if (messageArray[1] === 'report' && messageArray[2] === 'delete' && messageArray.length == 3 ) {
		targetReportList = [];
		var message = 'ReportList delete successfully.'
		sendDiscord(message);
		return;
	}
	
});


function getReportList() {

	targetUserList.forEach(function(userName) {
	
		var url = 'https://www.fflogs.com/v1/reports/user/' + userName + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		var response = request('GET', url);
		var body = JSON.parse(response.body.toString());
		
		var lastReport = body[0];
		body.forEach(function(report) {
			if(lastReport.end < report.end) {
				lastReport = report;
			}
		});
		
		
		
		var index = targetReportList.indexOf(lastReport.id);
		if (index == -1) {
			targetReportList.push(lastReport.id);
			var message = 'Automatically added new report:\nhttps://ja.fflogs.com/reports/' + lastReport.id;
			sendDiscord(message);
		}
	
	});

}

function sendDiscord( message, channel){

	if(!discordReady) return;
	
	if(channel == undefined) channel = process.env.DISCORD_TARGET_CHANNEL
	bot.sendMessage({
		to: channel,
		message: message
	});
}
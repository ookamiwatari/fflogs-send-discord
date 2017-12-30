// .envをロード
require('dotenv').config();

var Discord = require('discord.io');
var request = require('then-request');

var bot = new Discord.Client({
	token: process.env.DISCORD_TOKEN,
	autorun: true
});

// heroku用に待ち受け
var express = require('express');
var app = express();

app.get('/', function (req, res) {
	res.send('Hello, World!');
});
app.listen(process.env.PORT || 3000);

// phantomjs用
var path = require('path');
var childProcess = require('child_process');
var phantomjs = require('phantomjs-prebuilt');
var binPath = phantomjs.path;

// ターゲットリストを宣言
var targetList = {
	users: [],
	guilds: [],
	reports: {}
};

// 環境変数からユーザリストをロード
if( process.env.DEFAULT_TARGET_USER_LIST ) targetList.users = (process.env.DEFAULT_TARGET_USER_LIST).split(",");

// 環境変数からギルドリストをロード
if( process.env.DEFAULT_TARGET_GUILD_LIST ) targetList.guilds = (process.env.DEFAULT_TARGET_GUILD_LIST).split(",");

var waitGetFightList = [];

// 起動後一定時間はdiscordにメッセージを送信しない待機
var startWait = false;

// 最新の戦闘終了時間
var lastFightTime = 0;

// 起動処理を順番に行っていく
setTimeout(startReady, process.env.START_WAIT);
setTimeout(getFightList, process.env.START_WAIT/2);
setTimeout(getReportList, process.env.START_WAIT/4);

// 1分毎にDiscordへ再接続確認を行う

setInterval(function(){
	if (bot.presenceStatus != 'online') {
		bot.connect();
		setTimeout(function(){sendDiscord("ReConnect");}, 10000);
	}
}, 30000);


// 30秒毎にlogsから戦闘を取得する
setInterval(function(){
	getFight(waitGetFightList.shift());
}, 30000);


function startReady() {
	// レポートリストを取得するループ
	setInterval(getReportList, process.env.API_INTERVAL);
	setInterval(getFightList,process.env.API_INTERVAL);

	setTimeout(function(){
		waitGetFightList = [];
		startWait = true;
		console.log("start");
		sendDiscord("start");
	}, 5000);
}

// discordに接続したら
bot.on('ready', function() {
	console.log('Logged in as %s - %s\n', bot.username, bot.id);
	sendDiscord('Logged in as %s - %s\n', bot.username, bot.id);
});

// discordからの操作用API
bot.on('message', function(user, userID, channelID, message, event) {

	// 対象のチャンネルじゃなければ終了する
	if (channelID !== process.env.DISCORD_RANDOM_CHANNEL) {
		return;
	}

	// 指定されたメッセージではなければ終了する
	var messageArray = message.split(' ');
	if (messageArray.length < 2 || messageArray[0] !== 'logs') {
		return;
	}

	// user listの命令を追加
	// ToDo: わかりやすく描画させる
	if (messageArray[1] === 'user' && messageArray[2] === 'list' && messageArray.length == 3 ) {
		sendDiscord(targetList.users.join('\n'));
	}

	// user add *の命令を追加
	if (messageArray[1] === 'user' && messageArray[2] === 'add' && messageArray.length == 4 ) {

		// その名前が存在するか確認
		var url = 'https://www.fflogs.com/v1/reports/user/' + messageArray[3] + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		request('GET', url).done(function (response) {
			if (response.statusCode == 400) {
				var message = 'User \'' + messageArray[3] + '\' cannot be found.'
				sendDiscord(message);
				return;
			}

			// 既に追加されている場合
			if (targetList.users.indexOf(messageArray[3]) >=0 ) {
				var message = 'User \'' + messageArray[3] + '\' already exists.'
				sendDiscord(message);
				return;
			}

			// リストに追加
			var message = 'User \'' + messageArray[3] + '\' was added successfully.'
			sendDiscord(message);
			targetList.users.push(messageArray[3]);
		});
	}

	// user delete *の命令を追加
	if (messageArray[1] === 'user' && messageArray[2] === 'delete' && messageArray.length == 4 ) {

		// その名前が存在するか確認
		var index = targetList.users.indexOf(messageArray[3]);
		if (index >=0 ) {
			targetList.users.splice(index,1);
			var message = 'User \'' + messageArray[3] + '\' was deleted successfully.'
			sendDiscord(message);
			return;

		} else {
			// 存在しない場合
			var message = 'User \'' + messageArray[3] + '\' is undefined.'
			sendDiscord(message);
			return;
		}
	}

	// user delete の命令を追加
	if (messageArray[1] === 'user' && messageArray[2] === 'delete' && messageArray.length == 3 ) {
		targetList.users = [];
		var message = 'UserList delete successfully.'
		sendDiscord(message);
		return;
	}

	// guild listの命令を追加
	// ToDo: わかりやすく描画させる
	if (messageArray[1] === 'guild' && messageArray[2] === 'list' && messageArray.length == 3 ) {
		sendDiscord(targetList.guilds.join('\n'));
	}

	// guild add *の命令を追加
	if (messageArray[1] === 'guild' && messageArray[2] === 'add' && messageArray.length == 4 ) {

		// その名前が存在するか確認
		var url = 'https://www.fflogs.com/v1/reports/guild/' + messageArray[3] + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		request('GET', url).done(function (response) {
			if (response.statusCode == 400) {
				var message = 'Guild \'' + messageArray[3] + '\' cannot be found.'
				sendDiscord(message);
				return;
			}

			// 既に追加されている場合
			if (targetList.guilds.indexOf(messageArray[3]) >=0 ) {
				var message = 'Guild \'' + messageArray[3] + '\' already exists.'
				sendDiscord(message);
				return;
			}

			// リストに追加
			var message = 'Guild \'' + messageArray[3] + '\' was added successfully.'
			sendDiscord(message);
			targetList.guilds.push(messageArray[3]);
		});
	}

	// guild delete *の命令を追加
	if (messageArray[1] === 'guild' && messageArray[2] === 'delete' && messageArray.length == 4 ) {

		// その名前が存在するか確認
		var index = targetList.guilds.indexOf(messageArray[3]);
		if (index >=0 ) {
			targetList.guilds.splice(index,1);
			var message = 'Guild \'' + messageArray[3] + '\' was deleted successfully.'
			sendDiscord(message);
			return;

		} else {
			// 存在しない場合
			var message = 'Guild \'' + messageArray[3] + '\' is undefined.'
			sendDiscord(message);
			return;
		}
	}

	// guild delete の命令を追加
	if (messageArray[1] === 'guild' && messageArray[2] === 'delete' && messageArray.length == 3 ) {
		targetList.guilds = [];
		var message = 'GuildList delete successfully.'
		sendDiscord(message);
		return;
	}

	// report listの命令を追加
	// ToDo: わかりやすく描画させる
	if (messageArray[1] === 'report' && messageArray[2] === 'list' && messageArray.length == 3 ) {
		var message = "";
		for(var report in targetList.reports) {
			message += report + ": " + targetList.reports[report] + "\n";
		}

		sendDiscord(message);
	}

	// report add *の命令を追加
	if (messageArray[1] === 'report' && messageArray[2] === 'add' && messageArray.length == 4 ) {

		// その名前が存在するか確認
		var url = 'https://www.fflogs.com/v1/report/fights/' + messageArray[3] + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		request('GET', url).done(function (response) {
			if (response.statusCode == 400) {
				var message = 'Report \'' + messageArray[3] + '\' cannot be found.'
				sendDiscord(message);
				return;
			}

			// 既に追加されている場合
			if ( targetList.reports[messageArray[3]] ) {
				var message = 'Report \'' + messageArray[3] + '\' already exists.'
				sendDiscord(message);
				return;
			}

			// リストに追加
			var message = 'Report \'' + messageArray[3] + '\' was added successfully.'
			sendDiscord(message);
			targetList.reports[messageArray[3]] = 0;
		});
	}

	// report delete *の命令を追加
	if (messageArray[1] === 'report' && messageArray[2] === 'delete' && messageArray.length == 4 ) {

		// その名前が存在するか確認
		if ( targetList.reports[messageArray[3]] ) {
			delete targetList.reports[messageArray[3]];
			var message = 'Report \'' + messageArray[3] + '\' was deleted successfully.'
			sendDiscord(message);
			return;

		} else {
			// 存在しない場合
			var message = 'Report \'' + messageArray[3] + '\' is undefined.'
			sendDiscord(message);
			return;
		}
	}

	// report delete の命令を追加
	if (messageArray[1] === 'report' && messageArray[2] === 'delete' && messageArray.length == 3 ) {
		targetList.reports = [];
		var message = 'ReportList delete successfully.'
		sendDiscord(message);
		return;
	}

});


function getReportList() {

	targetList.users.forEach(function(userName) {

		// レポートを取得
		var url = 'https://www.fflogs.com/v1/reports/user/' + userName + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		request('GET', url).done(function (response) {
			if (response.statusCode !== 200 ) return;

			var body = JSON.parse(response.body.toString());

			// 最新のレポートを取得
			var lastReport = body[0];
			body.forEach(function(report) {
				if(lastReport.end < report.end) {
					lastReport = report;
				}
			});

			// リストに存在するか確認して追加する
			if (targetList.reports[lastReport.id] == undefined) {
				targetList.reports[lastReport.id] = 0;
				var message = 'Automatically added new report:\nhttps://ja.fflogs.com/reports/' + lastReport.id;
				sendDiscord(message, process.env.DISCORD_REPORT_CHANNEL);
			}
		});
	});

	targetList.guilds.forEach(function(guildName) {

		// レポートを取得
		var url = 'https://www.fflogs.com/v1/reports/guild/' + guildName + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		request('GET', url).done(function (response) {
			if (response.statusCode !== 200 ) return;

			var body = JSON.parse(response.body.toString());

			// 最新のレポートを取得
			var lastReport = body[0];
			body.forEach(function(report) {
				if(lastReport.end < report.end) {
					lastReport = report;
				}
			});

			// リストに存在するか確認して追加する
			if (targetList.reports[lastReport.id] == undefined) {
				targetList.reports[lastReport.id] = 0;
				var message = 'Automatically added new report:\nhttps://ja.fflogs.com/reports/' + lastReport.id;
				sendDiscord(message, process.env.DISCORD_REPORT_CHANNEL);
			}
		});
	});
}

function getFightList() {


	for(var report in targetList.reports) {
		(function(n) {

			var url = 'https://www.fflogs.com/v1/report/fights/' + report + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;


			request('GET', url).done(function (response) {
				if (response.statusCode !== 200 ) return;

				var body = JSON.parse(response.body.toString());

				if( body.fights === undefined ) return;


				for (var i = targetList.reports[n]; i < body.fights.length; i++ ) {


					var fight = body.fights[i];

					if( !(fight.kill || (i == body.fights.length -1 && fight.boss < 2000) )) continue;
					if( fight.boss == 0 ) continue;

					fight.fightId = n;
					waitGetFightList.push(fight);
				}
				targetList.reports[n] = body.fights.length;
			});
		})(report);
	}

}

function getFight(fight) {

	if(fight == undefined) return;
	if(startWait == false) return;

	// 戦闘を取得する命令を宣言
	childArgs = [
		path.join(__dirname, 'phantomjs-script.js'),
		'https://www.fflogs.com/reports/',
		fight.fightId,
		fight.id
	];

	console.log("this fight is " + fight.fightId + "#" + fight.id);

	var message = "https://ja.fflogs.com/reports/" + fight.fightId + "#fight=" + fight.id + "&type=summary\n";

	// 敵の名前を追加
	message += "【" + fight.name + "】";
	message += fight.zoneName;
	message += " ";

	// 所要時間を追加
	var time = fight.end_time - fight.start_time;
	var timeMsg = "" + Math.floor(time / 1000 / 60) + ":" + ('00'+(Math.floor(time/1000) % 60)).slice(-2);
	if ( fight.kill == true ) {
		message += "kill ";
		message += timeMsg + "\n";
	} else if ( fight.kill == false ) {
		message += fight.bossPercentage / 100;
		message += "% wipe "
		message += timeMsg + "\n"
	} else {
		message += timeMsg + "\n";
	}


	childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
		message += '```\n'
		message += stdout.match(/.*Start_Response\s+([\s\S]*)\s+End_Response.*/)[1].slice(0,-2);
		message +='\n```'
		console.log(message);
		sendDiscord(message, process.env.DISCORD_REPORT_CHANNEL);
	});
}

function sendDiscord(message, channel){

	if(bot.bot == false || !startWait) return;

	if(channel == undefined) channel = process.env.DISCORD_RANDOM_CHANNEL

	bot.sendMessage({
		to: channel,
		message: message
	});
}

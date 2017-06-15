// .envをロード
require('dotenv').config();

var Discord = require('discord.io');
var request = require('sync-request');

var bot = new Discord.Client({
	token: process.env.DISCORD_TOKEN,
	autorun: true
});


// phantomjs用
var path = require('path')
var childProcess = require('child_process')
var phantomjs = require('phantomjs-prebuilt')
var binPath = phantomjs.path


// 環境変数からユーザリストをロード
var targetUserList = [];
if( process.env.DEFAULT_TARGET_USER_LIST ) targetUserList = (process.env.DEFAULT_TARGET_USER_LIST).split(",");

// 環境変数からギルドリストをロード
var targetGuildList = [];
if( process.env.DEFAULT_TARGET_GUILD_LIST ) targetGuildList = (process.env.DEFAULT_TARGET_GUILD_LIST).split(",");

// 環境変数からレポートリストをロード
var targetReportList = [];
if( process.env.DEFAULT_TARGET_REPORT_LIST ) targetReportList = (process.env.DEFAULT_TARGET_REPORT_LIST).split(",");

// discordに接続したか
var discordReady = false;

// 起動後一定時間はdiscordにメッセージを送信しない待機
var startWait = false;

// 最新の戦闘終了時間
var lastFightTime = 0;

// 起動処理を順番に行っていく
setTimeout(startReady, process.env.START_WAIT);
setTimeout(getFight, process.env.START_WAIT/2);
setTimeout(getReportList, process.env.START_WAIT/4);

function startReady() {
	// レポートリストを取得するループ
	setInterval(getReportList, process.env.API_INTERVAL);
	setInterval(getFight,process.env.API_INTERVAL);

	startWait = true;
	console.log("start");
	sendDiscord("start");
}

// discordに接続したら
bot.on('ready', function() {
	console.log('Logged in as %s - %s\n', bot.username, bot.id);
	discordReady = true;
});

// discordからの操作用API
bot.on('message', function(user, userID, channelID, message, event) {

	// 対象のチャンネルじゃなければ終了する
	if (channelID !== process.env.DISCORD_TARGET_CHANNEL) {
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
		sendDiscord(targetUserList.join('\n'));
	}

	// user add *の命令を追加
	if (messageArray[1] === 'user' && messageArray[2] === 'add' && messageArray.length == 4 ) {

		// その名前が存在するか確認
		var url = 'https://www.fflogs.com/v1/reports/user/' + messageArray[3] + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		var response = request('GET', url);
		if (response.statusCode == 400) {
			var message = 'User \'' + messageArray[3] + '\' cannot be found.'
			sendDiscord(message);
			return;
		}

		// 既に追加されている場合
		if (targetUserList.indexOf(messageArray[3]) >=0 ) {
			var message = 'User \'' + messageArray[3] + '\' already exists.'
			sendDiscord(message);
			return;
		}

		// リストに追加
		var message = 'User \'' + messageArray[3] + '\' was added successfully.'
		sendDiscord(message);
		targetUserList.push(messageArray[3]);
	}

	// user delete *の命令を追加
	if (messageArray[1] === 'user' && messageArray[2] === 'delete' && messageArray.length == 4 ) {

		// その名前が存在するか確認
		var index = targetUserList.indexOf(messageArray[3]);
		if (index >=0 ) {
			targetUserList.splice(index,1);
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
		targetUserList = [];
		var message = 'UserList delete successfully.'
		sendDiscord(message);
		return;
	}

	// guild listの命令を追加
	// ToDo: わかりやすく描画させる
	if (messageArray[1] === 'guild' && messageArray[2] === 'list' && messageArray.length == 3 ) {
		sendDiscord(targetGuildList.join('\n'));
	}

	// guild add *の命令を追加
	if (messageArray[1] === 'guild' && messageArray[2] === 'add' && messageArray.length == 4 ) {

		// その名前が存在するか確認
		var url = 'https://www.fflogs.com/v1/reports/guild/' + messageArray[3] + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		var response = request('GET', url);
		if (response.statusCode == 400) {
			var message = 'Guild \'' + messageArray[3] + '\' cannot be found.'
			sendDiscord(message);
			return;
		}

		// 既に追加されている場合
		if (targetGuildList.indexOf(messageArray[3]) >=0 ) {
			var message = 'Guild \'' + messageArray[3] + '\' already exists.'
			sendDiscord(message);
			return;
		}

		// リストに追加
		var message = 'Guild \'' + messageArray[3] + '\' was added successfully.'
		sendDiscord(message);
		targetGuildList.push(messageArray[3]);
	}

	// guild delete *の命令を追加
	if (messageArray[1] === 'guild' && messageArray[2] === 'delete' && messageArray.length == 4 ) {

		// その名前が存在するか確認
		var index = targetGuildList.indexOf(messageArray[3]);
		if (index >=0 ) {
			targetGuildList.splice(index,1);
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
		targetGuildList = [];
		var message = 'GuildList delete successfully.'
		sendDiscord(message);
		return;
	}

	// report listの命令を追加
	// ToDo: わかりやすく描画させる
	if (messageArray[1] === 'report' && messageArray[2] === 'list' && messageArray.length == 3 ) {
		sendDiscord(targetReportList.join('\n'));
	}

	// report add *の命令を追加
	if (messageArray[1] === 'report' && messageArray[2] === 'add' && messageArray.length == 4 ) {

		// その名前が存在するか確認
		var url = 'https://www.fflogs.com/v1/report/fights/' + messageArray[3] + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		var response = request('GET', url);
		if (response.statusCode == 400) {
			var message = 'Report \'' + messageArray[3] + '\' cannot be found.'
			sendDiscord(message);
			return;
		}

		// 既に追加されている場合
		if (targetReportList.indexOf(messageArray[3]) >=0 ) {
			var message = 'Report \'' + messageArray[3] + '\' already exists.'
			sendDiscord(message);
			return;
		}

		// リストに追加
		var message = 'Report \'' + messageArray[3] + '\' was added successfully.'
		sendDiscord(message);
		targetReportList.push(messageArray[3]);
	}

	// report delete *の命令を追加
	if (messageArray[1] === 'report' && messageArray[2] === 'delete' && messageArray.length == 4 ) {

		// その名前が存在するか確認
		var index = targetReportList.indexOf(messageArray[3]);
		if (index >=0 ) {
			targetReportList.splice(index,1);
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
		targetReportList = [];
		var message = 'ReportList delete successfully.'
		sendDiscord(message);
		return;
	}

});


function getReportList() {

	targetUserList.forEach(function(userName) {

		// レポートを取得
		var url = 'https://www.fflogs.com/v1/reports/user/' + userName + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		var response = request('GET', url);
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
		var index = targetReportList.indexOf(lastReport.id);
		if (index == -1) {
			targetReportList.push(lastReport.id);
			var message = 'Automatically added new report:\nhttps://ja.fflogs.com/reports/' + lastReport.id;
			sendDiscord(message);
		}

	});

	targetGuildList.forEach(function(guildName) {

		// レポートを取得
		var url = 'https://www.fflogs.com/v1/reports/guild/' + guildName + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		var response = request('GET', url);
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
		var index = targetReportList.indexOf(lastReport.id);
		if (index == -1) {
			targetReportList.push(lastReport.id);
			var message = 'Automatically added new report:\nhttps://ja.fflogs.com/reports/' + lastReport.id;
			sendDiscord(message);
		}

	});
}

function getFight() {

	var lastFight = null;
	var childArgs = [];
	targetReportList.forEach(function(report) {

		var url = 'https://www.fflogs.com/v1/report/fights/' + report + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
		var response = request('GET', url);
		if (response.statusCode !== 200 ) return;

		var body = JSON.parse(response.body.toString());

		if( body.fights === undefined ) return;
		if( body.fights[body.fights.length-1] === undefined ) return;
		if( body.fights[body.fights.length-1].kill === undefined ) return;

		// 新しいのが有る場合
		if(lastFightTime < body.start + body.fights[body.fights.length-1].end_time - process.env.API_INTERVAL ) {
			lastFight = body.fights[body.fights.length-1];
			lastFightTime = body.start + lastFight.end_time;

			// 戦闘を取得する命令を宣言
			childArgs = [
				path.join(__dirname, 'phantomjs-script.js'),
				'https://www.fflogs.com/reports/',
				report,
				lastFight.id
			];

		}
	});

	// 新しいのが無い場合
	if(!lastFight) return;

	var message = "";

	// 敵の名前を追加
	message += "【" + lastFight.name + "】";
	message += lastFight.zoneName;
	message += " ";

	// 所要時間を追加
	var time = lastFight.end_time - lastFight.start_time;
	var timeMsg = "" + Math.floor(time / 1000 / 60) + ":" + ('00'+(Math.floor(time/1000) % 60)).slice(-2);
	if ( lastFight.kill == true ) {
		message += "kill ";
		message += timeMsg + "\n";
	} else if ( lastFight.kill == false ) {
		message += lastFight.bossPercentage / 100;
		message += timeMsg + "\n"
	} else {
		message += timeMsg + "\n";
	}

	childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
		message += '```\n'
		message += stdout.match(/.*Start_Response\s+([\s\S]*)\s+End_Response.*/)[1].slice(0,-2);
		message +='\n```'
		console.log(message);
		sendDiscord(message);
	});

}

function sendDiscord( message, channel){

	if(!discordReady || !startWait) return;

	if(channel == undefined) channel = process.env.DISCORD_TARGET_CHANNEL

	bot.sendMessage({
		to: channel,
		message: message
	});
}
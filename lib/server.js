var Nightmare = require('nightmare');
var nightmare = Nightmare({ show: true });

var Discord = require('discord.io');
var request = require('then-request');

var common = require('./common');

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
app.listen(process.env.PORT || 8080);

// ターゲットリストを宣言
var targetList = {
	users: [],
	guilds: [],
	reports: {}
};

var characterList = [];
var bossList = [];

// キャラから取得済みのリスト
var characterScrapedList = {};

// 環境変数からユーザリストをロード
if( process.env.DEFAULT_TARGET_USER_LIST ) targetList.users = (process.env.DEFAULT_TARGET_USER_LIST).split(",");

// 環境変数からギルドリストをロード
if( process.env.DEFAULT_TARGET_GUILD_LIST ) targetList.guilds = (process.env.DEFAULT_TARGET_GUILD_LIST).split(",");

// 環境変数からキャラクターリストをロード
if( process.env.DEFAULT_CHARACTER_LIST ) characterList = (process.env.DEFAULT_CHARACTER_LIST).split(",");

// 環境変数からボスリストをロード
if( process.env.DEFAULT_BOSS_LIST ) bossList = (process.env.DEFAULT_BOSS_LIST).split(",");

var waitGetFightList = [];
var waitGetCharacterList = [];

// 起動後一定時間はdiscordにメッセージを送信しない待機
var startWait = false;

var starting = null;

var scraping = false;

// 最新の戦闘終了時間
var lastFightTime = 0;

// 起動処理を順番に行っていく
setTimeout(startReady, process.env.START_WAIT);
setTimeout(getFightList, process.env.START_WAIT/2);
setTimeout(getReportList, process.env.START_WAIT/4);

// 5秒毎にlogsから戦闘を取得するか判定する
setInterval(function(){
	getFightInterval();
}, 5000);

// 10秒毎にキャラクターページから取得するか判定する
setInterval(function(){
	getCharacterInterval();
}, 10000);

// 30分毎にキャラクターページから取得する
setInterval(function(){
	if (waitGetCharacterList.length) {
		console.log('waitGetCharacterList', waitGetCharacterList)
		return;
	}
	characterList.forEach(function(character) {
		bossList.forEach(function(boss) {
			waitGetCharacterList.push({characterId: character, bossId: boss});
		})
	});
}, 1800000);


// キャラクターページから取得する
characterList.forEach(function(character) {
	bossList.forEach(function(boss) {
		waitGetCharacterList.push({characterId: character, bossId: boss});
	})
});


// phantomjsのプロセスが動いていなければ戦闘の取得処理を実行する
function getFightInterval() {

	if(scraping) {
		console.log('scraping!');
		return;
	}

	getFight(waitGetFightList.shift());

}


// phantomjsのプロセスが動いていなければキャラクターの取得処理を実行する
function getCharacterInterval() {

	if(scraping) {
		console.log('scraping!');
		return;
	}
	
	if(waitGetFightList.length) {
		console.log ('fight found!');
		return;
	}

	if (starting == true && waitGetCharacterList.length == 0) starting = false;

	getCharacter(waitGetCharacterList.shift());

}


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

// discordから切断されたら
bot.on('disconnect', function(errMsg, code) {
	if(errMsg) {
		console.log('disconnect - errMsg', errMsg);
	}
	console.log('disconnect - code', code);
	bot.connect();

})

// discordに接続したら
bot.on('ready', function(event) {
	console.log('Logged in as %s - %s\n', bot.username, bot.id);
	sendDiscord('Logged in as %s - %s\n', bot.username, bot.id);
});

// discordからの操作用API
bot.on('message', function(user, userId, channelId, message, event) {

	var request = {
		user: user,
		userId: userId,
		channelId: channelId,
		message: message
	};

	sendDiscord(common.getApiResponse(request, targetList));

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

					if (fight.boss == 0) continue;
					if (!fight.kill && body.start + fight.end_time < new Date().getTime() - 300000) continue;

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

	scraping = true;

	console.log("this fight is " + fight.fightId + "#" + fight.id);

	var headerMessage = "https://ja.fflogs.com/reports/" + fight.fightId + "#fight=" + fight.id + "&type=summary\n";

	// 敵の名前を追加
	headerMessage += "【" + fight.name + "】";
	headerMessage += fight.zoneName;
	headerMessage += " ";

	// 所要時間を追加
	var time = fight.end_time - fight.start_time;
	var timeMsg = "" + Math.floor(time / 1000 / 60) + ":" + ('00'+(Math.floor(time/1000) % 60)).slice(-2);
	if ( fight.kill == true ) {
		headerMessage += "kill ";
		headerMessage += timeMsg + "\n";
	} else if ( fight.kill == false ) {
		headerMessage += fight.bossPercentage / 100;
		headerMessage += "% wipe "
		headerMessage += timeMsg + "\n"
	} else {
		headerMessage += timeMsg + "\n";
	}

	nightmare
		.goto('https://ja.fflogs.com/reports/' + fight.fightId + '#fight=' + fight.id + '&type=damage-done')
		.wait('svg')
		.evaluate(eva)
		.then(function (result) {

			var fflogsResponce = JSON.parse(result);

			var message = headerMessage + createResultMessage(fflogsResponce);

			console.log(message);

			sendDiscord(message, process.env.DISCORD_REPORT_CHANNEL);

			scraping = false;

		})
		.catch(function (error) {
			scraping = false;
			console.log('err', err);
			console.error('Search failed:', error);
		});

}



function getCharacter (data) {

	console.log('data0', data)

	if(!data) return;

	scraping = true;

	console.log('update call');

	update(data.characterId)
		.then(function () {
			console.log('update_then');
			return getLastFight(data.characterId, data.bossId);
		}).then(function (data) {
			console.log('data1', data);
			if(!data) return;
			var id = data.reportId + "#" + data.fightId;
			if(characterScrapedList[id]) { // 重複チェック
				console.log('characterScrapedList');
				scraping = false;
				return;
			}
			characterScrapedList[id] = true;
			return getOwner(data);
		}).then(function (data) {
			console.log('data2', data);
			if(!data) { // 途中で失敗した場合（倒してない場合）
				console.log('!data')
				scraping = false;
				return;
			}
			if(starting == null) starting = true;
			if(targetList.users.indexOf(data.owner) >= 0) { // 収集してるユーザのデータなら
				console.log('targetList.users');
				scraping = false;
				return;
			}
			if(starting == true) {
				console.log('starting');
				scraping = false;
				return;
			}
			return getFight(data.fight);
		}).catch(function(err) {
			waitGetCharacterList.push({characterId: data.characterId, bossId: data.bossId});
			scraping = false;
			console.log('err', err);
			console.log('append', {characterId: data.characterId, bossId: data.bossId});
		});

}


function createResultMessage(fflogsResponce) {
	var msg = '```\n';
	for(var name in fflogsResponce.player) {

		if(fflogsResponce.player[name].perf) {
			msg += fflogsResponce.player[name].perf;
			msg += '% ';
		}

		msg += name;

		msg += ' (';
		msg += fflogsResponce.player[name].job;
		msg += ') ';

		msg += fflogsResponce.player[name].dps;

		msg += '\n';
	}

	if(fflogsResponce.total.perf) {
		msg += fflogsResponce.total.perf;
		msg += '% ';
	}

	if(fflogsResponce.total.dps) {
		msg += fflogsResponce.total.dps;
	}

	msg += '\n```'

	return msg;

}

function sendDiscord(message, channel){

	if(bot.bot == false || !startWait || !message) return;

	if(channel == undefined) channel = process.env.DISCORD_RANDOM_CHANNEL

	bot.sendMessage({
		to: channel,
		message: message
	});
}


var eva = function() {

	var result = {
		player: {},
		total: {}
	};
	// 各々の値を取得
	for (var i = 0, size = Array.from(document.querySelectorAll('.table-icon')).length; i < size; i++) {

		var name = Array.from(document.querySelectorAll('.main-table-name'))[i].innerText.replace(/\t|(\r?\n)/g,"");

		result.player[name] = {
			name: name
		}

		if(Array.from(document.querySelectorAll('.main-table-performance'))[i]) {
			result.player[name]['perf'] = Array.from(document.querySelectorAll('.main-table-performance'))[i].innerText.replace(/\t|(\r?\n)/g,"");
		}

		if(Array.from(document.querySelectorAll('.table-icon'))[i]) {
			result.player[name]['job'] = Array.from(document.querySelectorAll('.table-icon'))[i].src.match(/\/(\w+).png/)[1];
		}

		if(Array.from(document.querySelectorAll('.main-table-number'))[i]) {
			result.player[name]['dps'] = Array.from(document.querySelectorAll('.main-table-number'))[i].innerText.replace(/\t|(\r?\n)/g,"");
		}

	}

	// totalの値を取得
	{

		result.total = {
			perf: null,
			dps: null
		};

		if(Array.from(document.querySelectorAll('.main-table-performance'))[Array.from(document.querySelectorAll('.main-table-performance')).length-1]) {
			result.total.perf = Array.from(document.querySelectorAll('.main-table-performance'))[Array.from(document.querySelectorAll('.main-table-performance')).length-1].innerText.replace(/\t|(\r?\n)/g,"");
		}
		if(Array.from(document.querySelectorAll('.main-table-number'))[Array.from(document.querySelectorAll('.main-table-number')).length-1]) {
			// dps
			result.total.dps = Array.from(document.querySelectorAll('.main-table-number'))[Array.from(document.querySelectorAll('.main-table-number')).length-1].innerText;
		}

	}

	return JSON.stringify(result);

}


var update = function (characterId) {

	console.log('update start!')

	return new Promise (function (resolve, reject) {
	
		console.log('update promise');

		var url = 'https://www.fflogs.com/character/update/' + characterId;

		try {

			request('GET', url).done(function (response) {
				if (response.statusCode !== 200 ) {
					reject();
					return;
				}

				var body = JSON.parse(response.body.toString());

				if (!body.success) {
					reject();
					return;
				}

				resolve();

			});
		
		} catch (err) {
			console.log('update error', err);
			return;
		}

	});

}


var getLastFight = function(characterId, bossId) {

	console.log('getLastFight');
	return new Promise (function (resolve, reject) {

		nightmare
			.goto('https://www.fflogs.com/character/id/' + characterId + '?mode=detailed#boss=' + bossId)
			.wait('svg')
			.evaluate(function () {
			

				try {

					console.log('nightmare_evaluate');

					let dates_element = Array.from(document.querySelectorAll('.main-table-number[nowrap]'));
					let dates = [];
					dates_element.forEach(function(date_element) {
						dates.push(new Date(date_element.innerText).getTime());
					});
					
					let href = Array.from(document.querySelectorAll('.rank-per-second a'))[dates.indexOf(Math.max.apply(null,dates))].getAttribute('href');

					let m = href.match(/\/reports\/(\w{16})#fight=(\d+)&type=damage-done/);

					return {
						reportId: m[1],
						fightId: m[2]
					};
				} catch (err) {
					console.log('nightmare_err', err);
					return;
				}
			})
			.then(function (result) {

				resolve(result);

			})
			.catch(function (error) {
				console.error('Search failed:', error);
				reject();
			});

	});

}

var getOwner = function (data) {

	return new Promise (function (resolve, reject) {

		try {

			var url = 'https://www.fflogs.com/v1/report/fights/' + data.reportId + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;

			request('GET', url).done(function (response) {

				if (response.statusCode !== 200 ) {
					reject();
					return;
				}

				var body = JSON.parse(response.body.toString());

				if (!body.owner) {
					reject();
					return;
				}

				data.owner = body.owner
				data.fight = body.fights[data.fightId-1];
				data.fight.fightId = data.reportId;

				resolve(data);
				
			});
			
		} catch(err) {
			console.log('getOwner - err', err);
			reject();
		}

	});

}



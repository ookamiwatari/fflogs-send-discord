var request = require('then-request');

module.exports = {

	getApiResponse: function (request, targetList) {

		// 対象のチャンネルじゃなければ終了する
		if (request.channelId !== process.env.DISCORD_RANDOM_CHANNEL) {
			return null;
		}

		// 指定されたメッセージではなければ終了する
		var messageArray = request.message.split(' ');
		if (messageArray.length < 2 || messageArray[0] !== 'logs') {
			return null;
		}

		// user listの命令を追加
		// ToDo: わかりやすく描画させる
		if (messageArray[1] === 'user' && messageArray[2] === 'list' && messageArray.length == 3 ) {
			var message = targetList.users.join('\n');
			return message;
		}

		// user add *の命令を追加
		if (messageArray[1] === 'user' && messageArray[2] === 'add' && messageArray.length == 4 ) {

			// その名前が存在するか確認
			var url = 'https://www.fflogs.com/v1/reports/user/' + messageArray[3] + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
			request('GET', url).done(function (response) {
				if (response.statusCode == 400) {
					var message = 'User \'' + messageArray[3] + '\' cannot be found.'
					return message;
				}

				// 既に追加されている場合
				if (targetList.users.indexOf(messageArray[3]) >=0 ) {
					var message = 'User \'' + messageArray[3] + '\' already exists.'
					return message;
				}

				// リストに追加
				var message = 'User \'' + messageArray[3] + '\' was added successfully.'
				targetList.users.push(messageArray[3]);
				return message;
			});
		}

		// user delete *の命令を追加
		if (messageArray[1] === 'user' && messageArray[2] === 'delete' && messageArray.length == 4 ) {

			// その名前が存在するか確認
			var index = targetList.users.indexOf(messageArray[3]);
			if (index >=0 ) {
				targetList.users.splice(index,1);
				var message = 'User \'' + messageArray[3] + '\' was deleted successfully.'
				return message;

			} else {
				// 存在しない場合
				var message = 'User \'' + messageArray[3] + '\' is undefined.'
				return message;
			}
		}

		// user delete の命令を追加
		if (messageArray[1] === 'user' && messageArray[2] === 'delete' && messageArray.length == 3 ) {
			targetList.users = [];
			var message = 'UserList delete successfully.'
			return message;
		}

		// guild listの命令を追加
		// ToDo: わかりやすく描画させる
		if (messageArray[1] === 'guild' && messageArray[2] === 'list' && messageArray.length == 3 ) {
			var message = targetList.guilds.join('\n');
			return message;
		}

		// guild add *の命令を追加
		if (messageArray[1] === 'guild' && messageArray[2] === 'add' && messageArray.length == 4 ) {

			// その名前が存在するか確認
			var url = 'https://www.fflogs.com/v1/reports/guild/' + messageArray[3] + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
			request('GET', url).done(function (res) {
				if (res.statusCode == 400) {
					var message = 'Guild \'' + messageArray[3] + '\' cannot be found.'
					return message;
				}

				// 既に追加されている場合
				if (targetList.guilds.indexOf(messageArray[3]) >=0 ) {
					var message = 'Guild \'' + messageArray[3] + '\' already exists.'
					return message;
				}

				// リストに追加
				var message = 'Guild \'' + messageArray[3] + '\' was added successfully.'
				targetList.guilds.push(messageArray[3]);
				return message;
			});
		}

		// guild delete *の命令を追加
		if (messageArray[1] === 'guild' && messageArray[2] === 'delete' && messageArray.length == 4 ) {

			// その名前が存在するか確認
			var index = targetList.guilds.indexOf(messageArray[3]);
			if (index >=0 ) {
				targetList.guilds.splice(index,1);
				var message = 'Guild \'' + messageArray[3] + '\' was deleted successfully.'
				return message;

			} else {
				// 存在しない場合
				var message = 'Guild \'' + messageArray[3] + '\' is undefined.'
				return message;
			}
		}

		// guild delete の命令を追加
		if (messageArray[1] === 'guild' && messageArray[2] === 'delete' && messageArray.length == 3 ) {
			targetList.guilds = [];
			var message = 'GuildList delete successfully.'
			return message;
		}

		// report listの命令を追加
		// ToDo: わかりやすく描画させる
		if (messageArray[1] === 'report' && messageArray[2] === 'list' && messageArray.length == 3 ) {
			var message = "";
			for(var report in targetList.reports) {
				message += report + ": " + targetList.reports[report] + "\n";
			}
			return message;
		}

		// report add *の命令を追加
		if (messageArray[1] === 'report' && messageArray[2] === 'add' && messageArray.length == 4 ) {

			// その名前が存在するか確認
			var url = 'https://www.fflogs.com/v1/report/fights/' + messageArray[3] + '?api_key=' + process.env.FFLOGS_PUBLIC_KEY;
			request('GET', url).done(function (res) {
				if (res.statusCode == 400) {
					var message = 'Report \'' + messageArray[3] + '\' cannot be found.'
					return message;
				}

				// 既に追加されている場合
				if ( targetList.reports[messageArray[3]] ) {
					var message = 'Report \'' + messageArray[3] + '\' already exists.'
					return message;
				}

				// リストに追加
				var message = 'Report \'' + messageArray[3] + '\' was added successfully.'
				targetList.reports[messageArray[3]] = 0;
				return message;
			});
		}

		// report delete *の命令を追加
		if (messageArray[1] === 'report' && messageArray[2] === 'delete' && messageArray.length == 4 ) {

			// その名前が存在するか確認
			if ( targetList.reports[messageArray[3]] ) {
				delete targetList.reports[messageArray[3]];
				var message = 'Report \'' + messageArray[3] + '\' was deleted successfully.'
				return message;

			} else {
				// 存在しない場合
				var message = 'Report \'' + messageArray[3] + '\' is undefined.'
				return message;
			}
		}

		// report delete の命令を追加
		if (messageArray[1] === 'report' && messageArray[2] === 'delete' && messageArray.length == 3 ) {
			targetList.reports = [];
			var message = 'ReportList delete successfully.'
			return message;
		}
	}
};

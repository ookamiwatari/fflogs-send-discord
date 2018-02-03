var system = require('system');
var args = system.args;

var page = require('webpage').create();

page.open(args[1] + args[2] + '#fight=' + args[3] + '&type=damage-done', function(status) {

		page.includeJs('https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js', function() {
			setTimeout(function () {
				console.log("Start_Response")
				console.log(page.evaluate(eva));
				console.log("End_Response");
				phantom.exit();
			}, 10000);
		});


});



var eva = function() {

	var result = {
		player: {},
		total: {}
	};
	// 各々の値を取得
	for (var i = 0, size = $(".table-icon").length; i < size; i++) {

		var name = $(".main-table-name")[i].innerText.replace(/\t|(\r?\n)/g,"");

		result.player[name] = {
			name: name
		}

		if($(".main-table-performance")[i]) {
			result.player[name]['perf'] = $(".main-table-performance")[i].innerText.replace(/\t|(\r?\n)/g,"");
		}

		if($(".table-icon")[i]) {
			result.player[name]['job'] = $(".table-icon")[i].src.match(/\/(\w+).png/)[1];
		}

		if($(".main-table-number")[i]) {
			result.player[name]['dps'] = $(".main-table-number")[i].innerText.replace(/\t|(\r?\n)/g,"");
		}

	}

	// totalの値を取得
	{

		result.total = {
			perf: null,
			dps: null
		};

		if($(".main-table-performance")[$(".main-table-performance").length-1]) {
			result.total.perf = $(".main-table-performance")[$(".main-table-performance").length-1].innerText.replace(/\t|(\r?\n)/g,"");
		}
		if($(".main-table-number")[$(".main-table-number").length-1]) {
			// dps
			result.total.dps = $(".main-table-number")[$(".main-table-number").length-1].innerText;
		}

	}

	return JSON.stringify(result);
}

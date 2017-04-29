var system = require('system');
var args = system.args;

var page = require('webpage').create();

page.open(args[1] + args[2] + '#fight=' + args[3] + '&type=damage-done', function(status) {
	
		page.includeJs('http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js', function() {
			
			console.log(page.evaluate(eva));
			phantom.exit();
			
		});
		

});



var eva = function() {

	var msg = "";
	// 各々の値を取得
	for (var i = 0, size = $(".table-icon").length; i < size; i++) {
		if($(".main-table-performance")[i]) {
			msg += $(".main-table-performance")[i].innerText;
			msg += "% ";
		}
		
		if($(".main-table-name")[i]) {
			msg += $(".main-table-name")[i].innerText.replace(/\t|\r?\n/g,"");
		}
		if($(".table-icon")[i]) {
			msg += " (";
			msg += $(".table-icon")[i].src.match(/\/(\w+).png/)[1];
			msg += ") ";
		}

		if($(".main-table-number")[i]) {
			msg += $(".main-table-number")[i].innerText;
		}
		
		msg += "\n";
	}
	
	// totalの値を取得
	{
		if($(".main-table-performance")[$(".main-table-performance").length-1]) {
			msg += $(".main-table-performance")[$(".main-table-performance").length-1].innerText;
			msg += "% "
		}

		msg += "Total ";

		if($(".main-table-number")[$(".main-table-number").length-1]) {
			msg += $(".main-table-number")[$(".main-table-number").length-1].innerText;
		}

		msg += "\n";
	}

	return msg;
}
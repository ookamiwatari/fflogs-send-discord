var path = require('path')
var childProcess = require('child_process')
var phantomjs = require('phantomjs-prebuilt')
var binPath = phantomjs.path
 
var childArgs = [
  path.join(__dirname, 'phantomjs-script.js'),
  'https://ja.fflogs.com/reports/',
  'PmYRaMwkT1vcpZh6',
  '33'
];

childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
  console.log("start");
  //var response = stdout.match(/.*Start_Response\s+([\s\S]*)\s+End_Response.*/)[1].slice(0,-1);
  //response = response.substr(0,response-1);
  console.log(stdout.match(/.*Start_Response\s+([\s\S]*)\s?End_Response.*/)[1].slice(0,-2));
  console.log("end");
})
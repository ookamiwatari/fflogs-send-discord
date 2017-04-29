var path = require('path')
var childProcess = require('child_process')
var phantomjs = require('phantomjs-prebuilt')
var binPath = phantomjs.path
 
var childArgs = [
  path.join(__dirname, 'phantomjs-script.js'),
  'https://www.fflogs.com/reports/',
  'PmYRaMwkT1vcpZh6',
  '6'
]
 console.log("start");
childProcess.execFile(binPath, childArgs, function(err, stdout, stderr) {
  console.log(stdout);
})
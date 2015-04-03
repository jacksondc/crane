/************
 *   CRANE  *
 ************/
var exec = require('child_process').exec;
var deasync = require('deasync');

//var player = exec('python3 -u player/double-negative.py'); // -u to disable output buffering
//var player = exec('java -classpath player StupidJava'); // -classpath to let us run from player directory
var player = exec('node player/pseudo-sandwich.js');

var dataset = [];

//out
player.stdout.on('data', function(data) {
    console.log('received: ' + data);
    console.log('last data: ' + JSON.stringify(dataset[dataset.length-1]));
    dataset[dataset.length-1].output = data;
    dataset[dataset.length-1].callback('', data);
});

//err
player.stderr.on('data', function(data) {
    console.log('error: ' + data);
});

//close
player.on('close', function(code) {
    console.log('closing code: ' + code);
});

//end
player.on('end', function() {
  process.stdout.end();
});

//------- API -----

//takes an object with required property command and optional property data
//DOES NOT take a callback (that's dealt with through deasync)
var sendMessage = deasync(function(params, callback) {
  var fullMessage = params.command;
  if(data)
    fullMessage += ' ' + params.data;
  dataset.push({
    input: params, callback: callback
  });
  player.stdin.write(fullMessage);
});

/************
*   GAME  *
************/

console.log('player moves ' + sendMessage({command: 'move'})); //no data
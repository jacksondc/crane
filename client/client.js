//crane
var fs = require('fs');
var stdin = process.openStdin();

var playerFile = null;
var respond = null;

stdin.on('data', function(line) {
  line = line.toString().trim();
  var lineSplit = line.split(' '); //get separator index
  var command = null;
  var data = null;

  command = lineSplit[0];
  if(lineSplit.length > 1) {
    data = lineSplit[1];
  }

  if(command === 'filename') {
    playerFile = data;
    respond = require('../player/' + playerFile + '.js').respond;
    console.log('filename 200');
  } else if(command === 'player') {
    //send response from player
    if(respond) {
      console.log('player 200 ' + respond(data));
    } else {
      console.log('player 400 player-not-initialized');
    }
  } else {
    console.log(command + ' 400 unrecognized-command');
  }
});
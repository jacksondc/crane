//crane
var vm = require("vm");
var fs = require('fs');
var path = require('path');
var stdin = process.openStdin();

var playerFile = null;
var respond = null;

function createContext(path, context) {
  context = context || {};
  var data = fs.readFileSync(path);
  vm.runInNewContext(data, context, path);
  return context;
}

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
    // __filename is the current file name, necessary because just '.' refers to the directory where the script was
    // executed from. The first '..' in '../player' goes up a level to current directory (from filename), and the
    // second one goes to '../..'
    respond = createContext(path.resolve(__filename, '../../player', playerFile + '.js')).respond; //require('../player/' + playerFile + '.js').respond;
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
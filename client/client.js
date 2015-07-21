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

function processLine(line) {
    line = line.toString().trim();
    var lineSplit = line.split(' '); //get separator index
    var id = null;
    var command = null;
    var data = null;

    id = lineSplit[0];
    command = lineSplit[1];
    if(lineSplit.length > 2) {
      data = lineSplit.slice(2).join(' ');
    }

    if(command === 'filename') {
      playerFile = data + '.js';
      try {
          respond = createContext(path.resolve(playerFile)).respond;
          if(!respond) {
              throw new Error();
          }
          console.log(id + ' 200');
      } catch(ex) {
          console.log(id + ' 400 could not find file ' + playerFile);
      }
    } else if(command === 'player') {
      //send response from player
      if(respond) {
        console.log(id + ' 200 ' + respond(data));
      } else {
        console.log(id + ' 400 player-not-initialized');
      }
    } else {
      console.log(id + ' ' + ' 400 unrecognized-command ' + command);
    }
}

stdin.on('data', function(text) {
  lines = text.toString().split('\n');
  for(var i = 0; i < lines.length; i++) {
      if(lines[i].length > 0) {
          processLine(lines[i]);
      }
  }
});
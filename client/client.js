//crane
var vm = require("vm");
var fs = require('fs');
var path = require('path');
var stdin = process.openStdin();

var respond = null;
var success = true;

try {
   var playerFile = process.argv[2] + '.js';
} catch(ex) {
  success = false;
  console.log('err received no filepath argument');
}

if(success) {
  try {
    var player = createContext(path.resolve(playerFile));
  } catch(ex) {
    success = false;
    console.log('err received invalid filepath ' + process.argv[2]);
  }
}

if(success) {
  respond = player.respond;
  if(!respond) {
    success = false;
    console.log('err player had no respond method');
  }
}

if(success) {
  stdin.on('data', function(text) {
    lines = text.toString().split('\n');
    for(var i = 0; i < lines.length; i++) {
        if(lines[i].length > 0) {
            processLine(lines[i]);
        }
    }
  });
}

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

    if(command === 'player') {
      //send response from player
      if(respond) {
        console.log(id + ' 0 ' + respond(data));
      } else {
        console.log(id + ' 1 player-not-initialized');
      }
    } else {
      console.log(id + ' 1 unrecognized-command ' + command);
    }
}
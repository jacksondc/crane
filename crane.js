/************
 *   CRANE  *
 ************/

var spawn = require('child_process').spawn;
var deasync = require('deasync');
var fs = require('fs');
var path = require('path');

var TIMEOUT_LENGTH = 1000; //milliseconds

//------- API -----

//client receives: first word is a command, second is data
//commands: filename, player
//controller receives: first word is return command, second is status, third is data

var Player = function(playerName, shell) {
  var plyr = this;

  //console.log("new player with name " + name + " shell " + shell);
  plyr.name = playerName;
  plyr.shell = shell;
  plyr.callbacks = [];

  this.getName = function() {
    return plyr.name;
  }

  this.shell.stdout.on('data', function(res) {
    //console.log('received: "' + res + '"');
    res = res.toString().trim();
    if(res.length > 0) {
      var dataSplit = res.split(' ');
      if(dataSplit.length < 2)
        throw new Error('client response from ' + playerName + ' invalid: ' + res);
      var command = dataSplit[0]; //TODO: check to see if command lines up with callback
      var status = dataSplit[1];
      var data;
      if(dataSplit.length >= 3) {
        data = dataSplit[2];
      }

      if(status != 200) {
        throw new Error('client responded with status ' + status + ' and error ' + data + '.');
      } else {
        if(plyr.callbacks.length > 0) { //we have to have a callback to send it to
          plyr.callbacks[plyr.callbacks.length-1](data);
        }
      }
    }
  });

  //err
  this.shell.stderr.on('data', function(data) {
    console.log('Help in aisle ' + plyr.name + ': ' + data);
  });

  //close
  this.shell.on('close', function(code) {
    console.log('closing code: ' + code);
  });

  //end
  this.shell.on('end', function() {
    process.stdout.end();
  });

  //private - takes a command and optional data, and passes it on to the client (NOT the player)
  this.sendRaw = function(command, data) {
    var fullMessage = command;
    if(data)
      fullMessage += ' ' + data;

      var done = false;
      var res = null;

      plyr.callbacks.push(function(returnData) {
        res = returnData;
        done = true;
      });

      //console.log(fullMessage);
      plyr.shell.stdin.write(fullMessage + "\n"); //newline to ensure it doesn't get buffered

      if(TIMEOUT_LENGTH > 0) { //otherwise no timeout
          setTimeout(function() {
            if(!done) {
              throw new Error('Player ' + plyr.name + ' timed out responding to ' + command + ' ' + data);
              done = true;
            }
          }, TIMEOUT_LENGTH);
      }

      while(!done) { //wait for response
        deasync.runLoopOnce();
        //debugger;
      }

      if(res)
        return res.toString().trim(); //because it isn't a string (who knows why)
  }

  //public - takes an object with required data string, and passes it on to the player (through the client)
  this.send = function(data) {
    // TO IMPLEMENT LATER
    //data = encodeURIComponent(data);
    return plyr.sendRaw("player", data);
  }

  //initialize - send over the name of the player
  this.sendRaw('filename', this.name);
}

//crane
module.exports.setTimeoutLength = function(timeout) {
    if(!isNaN(timeout) && isFinite(timeout) && timeout >= 0) {
        TIMEOUT_LENGTH = timeout;
    } else {
        throw new Error('timeout not valid');
    }
}

module.exports.readPlayers = function(manualPlayersList) {
  var rawPlayers;
  var players = [];

  if(manualPlayersList && manualPlayersList.length > 1) { //we need at least 2 players
    rawPlayers = manualPlayersList;
  } else {
                 // this is necessary (instead of just readdirSync('player'))
                 // because nexe doesn't like me
    rawPlayers = fs.readdirSync(path.resolve(__dirname, './player'));
  }

  for(var i = 0; i < rawPlayers.length; i++) {
    var fullFile = rawPlayers[i];
    var components = fullFile.toString().split('.'); //0: filename, 1: file extension
    var shortFile = components[0];
    var extension = components[1];
    var command = "";
    var arguments = [];
    if(extension === "js") {
      command = "node";
      arguments.push("client/client.js");
    } else if(extension === "py") {
      command = "python3"
      arguments.push("-u");
      arguments.push("client/client.py"); // -u to disable output buffering
    } else if(extension === "class") {
      command = "java";
      arguments.push("-classpath");
      arguments.push("client:player:."); // client because it needs to be able to find the file we're executing,
                                         // which is /client/Client.class. player so that it will find the player file,
                                         // in /player. "." so that it will find the Player abstract class, which is in /.
      arguments.push("Client");
    }
    if(command) { //else not a player, so ignore
      players.push( new Player(shortFile, spawn(command, arguments) ) );
    }
  }

  return players;
}

function choose(set, number) {
    //?
}

module.exports.play = function(callback, options) {
    players = module.exports.readAllPlayers( options.players ? options.players : '' );
    //for each combination of two players
    combinations = choose(players, 2);
    for(var i = 0; i < combinations.length; i++) {
        callback(combinations);
    }
}

/*   EXAMPLES
   ============

game.play(function(players) {
    console.log('game between ' + players[0] + ' and ' + players[1]);
});


game.play(10, function(players) {
    console.log('game between ' + players[0] + ' and ' + players[1]);
});


game.play(function(players) {
    console.log('game between ' + players[0] + ' and ' + players[1]);
}, {
    count: 10,
    players: ['p1', 'p2']
});*/
/*************
 *   CRANE   *
 *************/

var spawn = require('child_process').spawn,
    fs    = require('fs'),
    path  = require('path'),
    uuid  = require('node-uuid'),
    async = require('async');

var playerDirectory = path.resolve(path.dirname(require.main.filename), './players');

module.exports.setPlayersDirectory = function(filename) {
    playerDirectory = filename;
}

var TIMEOUT_LENGTH = 1000; //milliseconds

//------- API -----

//client receives: first word is a command, second is data
//commands: filename, player
//controller receives: first word is return command, second is status, third is data

var Player = function(playerName, shell) {
  var pl = this;

  pl.name = playerName;
  pl.shell = shell;
  pl.messageTable = [];
  pl.initialized = false;

  this.getName = function() {
    return pl.name;
  }

  this.shell.stdout.on('data', function(res) {
    //console.log('received ' + res + ' from ' + pl.getName());

    res = res.toString().trim();

    var lines = res.split('\n');

    for(var i = 0; i < lines.length; i++) {
        processOutput(lines[i]);
    }
  });

  function processOutput(res) {
      if(res.length > 0) {

        var dataSplit = res.split(' ');

        if(dataSplit.length < 2) {
          throw new Error('client response from ' + pl.getName() + ' too short: ' + res);
        }

        var messageId = dataSplit[0];
        var status    = dataSplit[1];
        var data      = dataSplit.length >= 3 ? dataSplit.slice(2).join(' ') : null;

        if(!pl.messageTable[messageId]) {
            throw new Error('client response from ' + pl.getName() + ' with unrecognized message id ' + messageId);
        }

        pl.messageTable[messageId].done = true;

        if(parseInt(status) === 200) {
            var callback = pl.messageTable[messageId].callback;
            if(callback) { callback(data); }
        } else {
            throw new Error('client response from ' + pl.getName() + ' with status ' + status + ' and error ' + data + '.');
        }

      }
  }

  //err
  this.shell.stderr.on('data', function(data) {
    throw new Error('Error from player ' + pl.getName() + ': ' + data);
  });

  //close
  this.shell.on('close', function(code) {
    console.log('Player ' + pl.getName() + ' closing with code: ' + code);
  });

  //end
  this.shell.on('end', function() {
    process.stdout.end();
  });

  //private - takes a command and data, passes it on to the client
  function sendRaw(command, data, cb) {

      var messageId = uuid.v1();
      var messageString = [messageId, command, data].join(' ');

      pl.messageTable[messageId] = {
              callback: cb,
              message: messageString,
              done: false
          };

      pl.shell.stdin.write(messageString + "\n"); //newline to ensure it doesn't get buffered

      if(TIMEOUT_LENGTH > 0) { //otherwise no timeout
        setTimeout(function() {
          if(!pl.messageTable[messageId].done) {
            throw new Error('Player ' + pl.name + ' timed out responding to ' + messageString);
            pl.messageTable[messageId].done = true;
          }
        }, TIMEOUT_LENGTH);
      }

  }

  //public - takes an object with required data string, and passes it on to the player (through the client)
  this.send = function(data, callback) {
      async.series([
        //first send over filename if necessary
        function(cb) {
            if(!pl.initialized) {
                //initialize player object - send over the name of the player
                sendRaw('filename', path.resolve(playerDirectory, pl.getName()), function(data) {
                  pl.initialized = true;
                  cb(null);
                });
            } else {
                cb(null);
            }
        },
        //then send actual message
        function(cb) {
            // TO IMPLEMENT LATER
            // data = encodeURIComponent(data);
            sendRaw("player", data, callback);
            cb(null);
        }
    ]);
  }

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

  if(manualPlayersList && manualPlayersList.length > 0) { //we need at least 1 player
    rawPlayers = manualPlayersList;
  } else {
    rawPlayers = fs.readdirSync(playerDirectory);
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
      players.push( new Player(shortFile, spawn(command, arguments, {cwd: __dirname}) ) );
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
};

module.exports.playAllMatches = function(players, numPlayers, eachMatch, callback) {

    var index = 0;
    var matches = [];
    for(var i = 0; i < players.length; i++) {
      for(var j = i; j < players.length; j++) {
        if(i !== j) { //don't play a bot against itself
            matches.push({
                players: [players[i], players[j]],
                index: ++index
            });
        }
      }
    }

    async.eachSeries(matches, eachMatch, callback);
};

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
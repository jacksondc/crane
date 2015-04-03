/************
 *   CRANE  *
 ************/

var spawn = require('child_process').spawn;
var deasync = require('deasync');
var fs = require('fs');

var TIMEOUT_LENGTH = 1000; //milliseconds

var arguments = process.argv.slice(2);

//------- API -----

var Player = function(name, shell) {
  var plyr = this;

  //console.log("new player with name " + name + " shell " + shell);
  plyr.name = name;
  plyr.shell = shell;
  plyr.callbacks = [];

  this.shell.stdout.on('data', function(data) {
    //console.log('received: "' + data + '"');
    //if(data != "\n") { //this happens sometimes
    if(plyr.callbacks.length > 0) { //otherwise don't bother collecting it
      plyr.callbacks[plyr.callbacks.length-1](data);
    }
    //}
  });

  //err
  this.shell.stderr.on('data', function(data) {
    console.log('error: ' + data);
  });

  //close
  this.shell.on('close', function(code) {
    console.log('closing code: ' + code);
  });

  //end
  this.shell.on('end', function() {
    process.stdout.end();
  });

  //takes an object with required property command and optional property data
  //DOES NOT take a callback (that's dealt with through deasync)
  this.sendMessage = function(command, data) {
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

      setTimeout(function() {
        if(!done) {
          console.log('timeout');
          throw new Error('Player ' + plyr.name + ' timed out!');
          done = true;
        }
      }, TIMEOUT_LENGTH);

      console.log('before deasync');
      while(!done) { //wait for response
        deasync.runLoopOnce();
      }
      console.log('after deasync');

      return res.toString(); //because isn't one (who knows why)
  }
}

//crane
module.exports = function() {
      this.readAllPlayers = function(manualPlayersList) {
        var rawPlayers;
        var players = [];

        if(manualPlayersList && manualPlayersList.length > 1) { //we need at least 2 players
          rawPlayers = manualPlayersList;
        } else {
          rawPlayers = fs.readdirSync('player');
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
            arguments.push("player/" + fullFile);
          } else if(extension === "py") {
            command = "python3"
            arguments.push("-u");
            arguments.push("player/" + fullFile); // -u to disable output buffering
          } else if(extension === "class") {
            command = "java";
            arguments.push("-classpath");
            arguments.push("player");
            arguments.push(shortFile);
          }
          if(command) { //else not a player, so ignore
            players.push( new Player(shortFile, spawn(command, arguments) ) );
          }
        }

        return players;
      }
    }
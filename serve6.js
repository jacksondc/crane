/************
 *   CRANE  *
 ************/

var spawn = require('child_process').spawn;
var deasync = require('deasync');
var fs = require('fs');

var TIMEOUT_LENGTH = 1000; //milliseconds

var arguments = process.argv.slice(2);

function readAllPlayers(manualPlayersList) {
  var rawPlayers;
  var players = [];

  if(manualPlayersList && manualPlayersList.length > 1) { //we need at least 2 players
    rawPlayers = manualPlayersList;
  } else {
    rawPlayers = fs.readdirSync('player');
  }

  for(var i = 0; i < rawPlayers.length; i++) {
    var fullFile = rawPlayers[i];
    var components = fullFile.split('.'); //0: filename, 1: file extension
    var shortFile = components[0];
    var extension = components[1];
    var command = "";
    var arguments = [];
    if(extension === "js") {
      command = "node;"
      arguments.push(fullFile);
    } else if(extension === "py") {
      command = "python3"
      arguments.push("-u");
      arguments.push("fullFile"); // -u to disable output buffering
    } else if(extension === "class") {
      command = "java";
      arguments.push("-classpath");
      arguments.push("player")
      arguments.push(shortFile); //get rid of the player part
    }
    if(command) { //else not a player, so ignore
      players.push( { name: shortFile, shell: spawn(command, arguments) } );
    }
  }

  return players;
}

var players = readAllPlayers(arguments);
console.log('players are ' + players);

//var player = {name: 'double-negative', shell: exec('python3 -u player/double-negative.py') }; // -u to disable output buffering
//var player = {name: 'StupidJava', shell: spawn('java', ['-classpath', 'player', 'StupidJava']) }; // -classpath to let us run from player directory
//var player = {name: 'pseudo-sandwich', shell: spawn('node', ['player/pseudo-sandwich.js']) }; // -classpath to let us run from player directory
//var player = players[0];

console.log('player is ' + player.name);

var dataset = [];

//out
player.shell.stdout.on('data', function(data) {
  console.log('received: "' + data + '"');
  if(data != "\n") { //this happens sometimes
    if(dataset.length > 0) {
      dataset[dataset.length-1].output = data;
      dataset[dataset.length-1].callback(data);
    }
  }
});

//err
player.shell.stderr.on('data', function(data) {
    console.log('error: ' + data);
});

//close
player.shell.on('close', function(code) {
    console.log('closing code: ' + code);
});

//end
player.shell.on('end', function() {
  process.stdout.end();
});

//------- API -----

//takes an object with required property command and optional property data
//DOES NOT take a callback (that's dealt with through deasync)
function sendMessage(params) {

  var fullMessage = params.command;
  if(params.data)
    fullMessage += ' ' + params.data;

  var done = false;
  var res = null;

  dataset.push({
    input: params, callback: function(data) {
      res = data;
      done = true;
    }
  });

  console.log(fullMessage);
  params.player.shell.stdin.write(fullMessage + "\n");

  setTimeout(function() {
    if(!done) {
      throw new Error('player ' + params.player.name + ' timed out!');
      done = true;
    }
  }, 1000);

  while(!done) { //wait for response
    deasync.runLoopOnce();
  }

  return res;
}

/************
*   GAME  *
************/
var firstPlayer = sendMessage({command: 'move', player: players[0]});
var secondPlayer = sendMessage({command: 'move', player: player[1]});
console.log('player 1 moves ' + firstPlayer + ', player 2 moves ' + secondPlayer); //no data
console.log('Winner is ' + determineWinner(players[0].name, players[1].name, firstPlayer, secondPlayer)); //no data

function determineWinner(firstName, secondName, firstMove, secondMove) {
  firstMove = firstMove.trim().toLowercase();
  secondMove = secondMove.trim().toLowercase();

  if(firstMove === secondMove) {
    return "tie";
  } else if( (firstMove === "scissors" && secondMove == "paper") ||
             (firstMove === "rock" && secondMove == "scissors") ||
             (firstMove === "paper" && secondMove == "rock") ) {
    return firstName + " wins!";
  } else {
    return secondName + " wins!";
  }
}

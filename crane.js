/*************
 *   CRANE   *
 *************/

var spawn = require('child_process').spawn,
    fs    = require('fs'),
    path  = require('path'),
    uuid  = require('node-uuid'),
    async = require('async'),
    _     = require('lodash'),
    Table = require('cli-table');

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

  this.getName = function() {
    return pl.name;
  }

  this.shell.stdout.on('data', function(res) {
    if(res.toString().substr(0, 4) === 'log ') {
      console.log('Log from client ' + pl.getName() + ': ' + res.toString().substr(4));
    } else if(res.toString().substr(0, 4) === 'err ') {
      throw new Error('Error from client ' + pl.getName() + ': ' + res.toString().substr(4));
    } else {
      res = res.toString().trim();

      var lines = res.split('\n');

      for(var i = 0; i < lines.length; i++) {
          processOutput(lines[i]);
      }
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
            throw new Error('client response from client for ' + pl.getName() + ' with unrecognized message id ' + messageId);
        }

        pl.messageTable[messageId].done = true;

        if(parseInt(status) === 0) {
          var callback = pl.messageTable[messageId].callback;
          if(callback) { callback(data); }
        } else if(parseInt(status) === 1) {
          throw new Error('client response from ' + pl.getName() + ' with status ' + status + ' and error ' + data + '.');
        } else {
          throw new Error('client response from client for ' + pl.getName() + ' with unrecognized status code ' + status);
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
      sendRaw("player", data, callback);
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
    var dot = fullFile.lastIndexOf('.');

    var shortName = fullFile.substring(0, dot); //e.g. player-1
    var filePathNoExtension = playerDirectory + '/' + shortName //e.g. players/player-1
    var extension = fullFile.substring(dot+1); //eg js

    var command = "";
    var args = [];

    if(extension === "js") {
      command = "node";
      args.push("client/client.js");
      args.push(filePathNoExtension)
    } else if(extension === "py") {
      command = "python3"
      args.push("-u");
      args.push("client/client.py"); // -u to disable output buffering
      args.push(filePathNoExtension)
    } else if(extension === "class") {
      command = "java";
      args.push("-classpath"); args.push("client");
      args.push("Client");
      args.push(filePathNoExtension)
    }
    if(command) { //else not a player, so ignore
      players.push( new Player(shortName, spawn(command, args, {cwd: __dirname}) ) );
    }
  }

  return players;
}

module.exports.playAllMatches = function(players, numMatches, eachMatch, callback) {
    var index = 0;
    var matches = [];
    for(var i = 0; i < players.length; i++) {
      for(var j = i; j < players.length; j++) {
        if(i !== j) { //don't play a bot against itself
            matches.push({
                players: _.shuffle([players[i], players[j]]),
                index: ++index
            });
        }
      }
    }

    async.eachSeries(matches, eachMatch, callback);
};

function forEachCombinationOfTwo(players, fn) {
  for(var i = 0; i < players.length; i++) {
    for(var j = i; j < players.length; j++) {
      if(i !== j) { //don't play a bot against itself
          fn(players[i], players[j]);
      }
    }
  }
}

function areSignificant(players, scores, matches, cumulativeScores, options) {

  //first: 1st place, second: 2nd place
  var first = cumulativeScores[0].score;
  var second = cumulativeScores[1].score;
  var realDifference = first - second;

  var firstName = cumulativeScores[0].player.getName();
  var secondName = cumulativeScores[1].player.getName();

  var firstScores = [];
  var secondScores = [];

  // console.log('first place is ' + firstName);
  // console.log('second place is ' + secondName);

  for(var i = 0; i < scores.length; i++) {
    var match = matches[i];
    var firstPlayerIndex = _.findIndex(match.players, function(pl) { return pl.getName() === firstName; });
    var secondPlayerIndex = _.findIndex(match.players, function(pl) { return pl.getName() === secondName; });
    // console.log('all players are ' + JSON.stringify(_.map(match.players, function(pl) { return pl.getName(); })));
    // console.log('first player is at ' + firstPlayerIndex);
    // console.log('second player is at ' + secondPlayerIndex);
    if(firstPlayerIndex >= 0) firstScores.push(scores[i][firstPlayerIndex]);
    if(secondPlayerIndex >= 0) secondScores.push(scores[i][secondPlayerIndex]);
  }

  // console.log('realDifference: ' + realDifference);
  // console.log('firstScores is ' + JSON.stringify(firstScores));
  // console.log('secondScores is ' + JSON.stringify(secondScores));

  var positives = 0; //real difference comes up by chance
  var negatives = 0; //real difference does not come up by chance

  for(var i = 0; i < options.numRandomizations; i++) {
    //re-randomize
    var allScores = _.shuffle(firstScores.concat(secondScores));
    var groupA = allScores.slice(0, allScores.length / 2);
    var groupB = allScores.slice(allScores.length / 2);
    var sumA = _.sum(groupA);
    var sumB = _.sum(groupB);
    var difference = sumA - sumB;

    //console.log('trial with difference ' + difference);

    if(difference >= realDifference) positives++;
      else negatives++;
  }

  var prob = positives / (positives + negatives);

  // console.log(positives + ' positives and ' + negatives + ' negatives');

  return prob < options.pValueThreshold;
}

module.exports.playTournament = function(players, eachMatch, options) {

  //default options
  if(options.printTable === undefined) options.printTable = true;
  if(options.rounds === undefined) options.rounds = 100;
  if(options.numRandomizations === undefined) options.numRandomizations = 1000;
  if(options.pValueThreshold === undefined) options.pValueThreshold = 0.05;

  if(options.rounds === 'UNTIL_SIGNIFICANT') {
    var numRounds = 0;

    if(!options.significanceThreshold) options.significanceThreshold = 0.05;

    var cumulativeMatches = [];

    var index = 0;

    function runOneRound(results) {
      numRounds++;

      var currentMatches = [];

      forEachCombinationOfTwo(players, function(playerA, playerB) {
        var match = {
            players: _.shuffle([playerA, playerB]),
            index: ++index
        };
        currentMatches.push(match);
        cumulativeMatches.push(match);
      });

      async.mapSeries(currentMatches, eachMatch, function(err, newResults) {
        var allResults = results.concat(newResults);

        // console.log('finished a round with cumulative results ' + JSON.stringify(allResults));

        if(err) {
          if(options.callback) options.callback(err);
          else throw err;
        }

        var cumulativeScores = getScoreTable(players, getPlayerScores(players, cumulativeMatches, allResults), options.numRounds);

        if(areSignificant(players, allResults, cumulativeMatches, cumulativeScores, _.pick(options, 'numRandomizations', 'pValueThreshold'))) {
          resolveTournament(null, cumulativeMatches, allResults);
        } else {
          runOneRound( allResults );
        }

      });
    }

    runOneRound([]);

  } else {

    var index = 0;
    var matches = [];
    forEachCombinationOfTwo(players, function(playerA, playerB) {
      for(var k = 0; k < options.rounds; k++) {
        matches.push({
            players: _.shuffle([playerA, playerB]),
            index: ++index
        });
      }
    });

    async.mapSeries(matches, eachMatch, function(err, results) {
        resolveTournament(err, matches, results);
      });

  }

  function resolveTournament(err, matches, scores) {

    if(err) {
      if(options.callback) options.callback(err);
      else throw err;
    }

    var playerScores = getPlayerScores(players, matches, scores);

    var index = 0;

    // console.log('results is ' + _.map(results, function(res) { return '(' + res + ', ' + _.map(names(matches[index++].players)) + ')'}));

    // console.log('player scores is ' + JSON.stringify(playerScores));

    //turn it into a table and sort
    var robustNumRounds = options.rounds === 'UNTIL_SIGNIFICANT' ? numRounds : options.rounds;
    var scoreTable = getScoreTable(players, playerScores, robustNumRounds);

    //add ranks
    for(var i = 0; i < scoreTable.length; i++) {
      scoreTable[i].rank = (i+1); //start indices at 1
    }

    if(options.printTable) {
      var SCORE_WIDTH = 10;

      //copy into Table table
      var table = new Table({
          head: ['Rank', 'Player', 'Score', 'Avg Score'],
          colWidths: [10, 20, SCORE_WIDTH + 2, SCORE_WIDTH + 2] // +2 because of cli-table (idk why)
      });

      _.each(scoreTable, function(row) {
        table.push([
          row.rank,
          row.player.getName(),
          rightAlignNum(Math.round(row.score), SCORE_WIDTH),
          rightAlignNum(row.averageScore.toFixed(2), SCORE_WIDTH)
        ]);
      });

      console.log(table.toString());
      console.log(''); //newline
    }

    if(options.callback) {
      options.callback(null, scoreTable);
    }
  }
};


function getScoreTable(players, playerScores, numRounds) {
  var scoreTable = [];

  for(var i = 0; i < players.length; i++) {
    var score = playerScores[players[i].getName()];
    var avgScore = score / numRounds;
    scoreTable.push({
        player: players[i],
        score: score,
        averageScore: avgScore
      });
  }

  scoreTable = _.sortByOrder(scoreTable, 'score', 'desc');

  return scoreTable;
}

function getPlayerScores(players, matches, results) {

  var playerScores = {};

  //set each player's starting score to 0
  for(var i = 0; i < players.length; i++) {
    playerScores[players[i].getName()] = 0;
  }

  //add in all the reported scores
  for(var i = 0; i < results.length; i++) {
    var match = matches[i];
    var scores = results[i];
    for(var j = 0; j < scores.length; j++) {
      var score = scores[j];
      var playerName = match.players[j].getName();
      playerScores[playerName] += score;
    }
  }

  return playerScores;
}

function rightAlignNum(number, width, precision) {
  number = number + "";
  while(number.length < width) {
    number = " " + number;
  }
  return number;
}

function getBaseLog(x, y) {
  return Math.log(y) / Math.log(x);
}

function twoByCeil(x) {
  return Math.pow(2, Math.ceil(getBaseLog(2,x)));
}

var TreeNode = function(parent) {
  this.parent = parent;
  this.first = null;
  this.second = null;
  this.parentPosition = null;
  this.value = null;
};

TreeNode.prototype.print = function(depth, maxDepth) {
  var DEPTH_INCREMENT = 6;

  if(!depth) {
    //find deepest child
    maxDepth = 0;
    function getNextDepth(node, depth) {
      if(depth > maxDepth) maxDepth = depth;
      if(node.first) { getNextDepth(node.first, depth+1); }
      if(node.second) { getNextDepth(node.second, depth+1); }
    }
    getNextDepth(this, 0);
    depth = maxDepth * DEPTH_INCREMENT;
  }


  var indent = "";
  for(var i = 0; i < depth; i++) indent += " ";
  var bars = "";
  for(var i = 0; i < (maxDepth-depth); i++) bars += "     |";

  depth-=DEPTH_INCREMENT;

  if(this.first) this.first.print(depth, maxDepth);

  if(this.value === "BRANCH") console.log(indent + "|-----|");
    else if(this.value.toString) console.log(indent + this.value.toString() + " ----|" + bars);
    else console.log(indent + this.value);

  if(this.second) this.second.print(depth, maxDepth);
};

module.exports.playBracket = function(players, eachMatch, options) {

  //get seeds with a tournament
  this.playTournament(players, eachMatch, {
      numRounds: options && options.numSeedRounds,
      printTable: false,
      callback: theActualBracketPart
    });

  var theActualBracketPart = function(err, results) {
    if(err) {
      if(options.callback) options.callback(err);
      else throw err;
    }

    var bigSize = twoByCeil(results.length);

    //(results are guarranteed to be in order from playTournament)
    var index = 0;
    var seeds = _.map(results, function(pl) {
      var node = new TreeNode(null);
      pl.toString = function() { return this.rank + ": " + this.player.getName(); }
      node.value = pl;
      return node;
    });
    var seedPreserve = _.cloneDeep(seeds);

    // FAKE FILLLER DATA
    seeds = [];
    for(var i = 0; i < 8; i++) {
      var t = new TreeNode();
      t.value = {
        rank: i+1,
        toString: function() {return this.rank;}
      }
      seeds.push( t );
    }

    var round = 0;
    root = seeds.shift();
    var next = root;

    while(seeds.length) {

      var roundLength = Math.pow(2, round);
      var fillers = Math.max(0, Math.pow(2,round) - seeds.length);

      var seedsForRound = [];

      for(var i = 0; i < roundLength - fillers; i++) {
        //insert at first position
        //(put them in backwards order for correct insertion into tree)
        seedsForRound.splice(0, 0, seeds.shift());
      }

      for(var i = 0; i < fillers; i++) {
        //insert some fillers at the front
        seedsForRound.splice(0, 0, null);
      }

      //do a round
      for(var i = 0; i < roundLength; i++) {

        var roundReferences = [];

        var dropValue = next.value;
        var opponentIndex = dropValue.rank - 1; //for 0-based

        //if it's not a filler, drop it
        if(seedsForRound[opponentIndex]) {

          next.value = "BRANCH";

          next.first = new TreeNode(next);
          next.first.value = dropValue;
          next.first.parentPosition = "first";

          next.second = seedsForRound[opponentIndex];
          next.second.parent = next;
          next.second.parentPosition = "second";

        }

        //move next
        if ( i === roundLength - 1 ) { //last round
          next = root;
          for(var j = 0; j < (round + 1); j++) {
            next = next.first;
          }
        } else {
          //go up the tree if necessary
          var levelsUp = 0;
          while(next.parentPosition === "second") {
            levelsUp++
            next = next.parent;
          }

          //we've gotten to a place where we're first - execute the move to second
          next = next.parent.second;

          //go back down the tree on the other side
          for(var j = 0; j < levelsUp; j++) {
            next = next.first;
          }
        }

      }

      round++;
    }

    root.print();
  }
};

function names(players) {
  return _.map(players, function(pl) { return pl.getName(); });
}
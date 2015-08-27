var game = require('../../crane');
var async = require('async');
var _ = require('lodash');

game.setTimeoutLength(500);

var arguments = process.argv.slice(2);

var players = game.readPlayers(arguments);

//play every combination of matches

function getWinnerString(scores, firstName, secondName) {
  if(_.isEqual(scores, [0,0])) {
    return "It's a tie!";
  } else if( _.isEqual(scores, [1,-1]) ) {
    return firstName + " wins!";
  } else {
    return secondName + " wins!";
  }
}

function getScores(firstMove, secondMove) {
  firstMove = firstMove.trim().toLowerCase();
  secondMove = secondMove.trim().toLowerCase();

  if(firstMove === secondMove) {
    return [0,0];
  } else if( (firstMove === "scissors" && secondMove == "paper"   ) ||
             (firstMove === "rock"     && secondMove == "scissors") ||
             (firstMove === "paper"    && secondMove == "rock"    ) ) {
    return [1,-1];
  } else {
    return [-1,1];
  }
}

function playMatch(match, done) {
    //each match
    var playerMoves = [];

    async.parallel([
        function(cb) {
            match.players[0].send('move', function(move) {
                cb(null, move);
            });
        },
        function(cb) {
            match.players[1].send('move', function(move) {
                cb(null, move);
            });
        },
    ], function(err, moves) {
        if(err) throw err;

        var scores = getScores(moves[0], moves[1]);

        console.log('GAME %d', match.index);
        console.log('%s vs %s', match.players[0].getName(), match.players[1].getName());
        console.log('%s moves %s, %s moves %s', match.players[0].getName(), moves[0], match.players[1].getName(), moves[1]);
        console.log(getWinnerString(scores, match.players[0].getName(), match.players[1].getName()));
        console.log(''); //newline*/

        done(null, scores);
    });

}

//start it off
game.playTournament(players, playMatch, {
  callback: function() {
    console.log('All done!');
  }
});
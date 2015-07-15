var game = require('../../crane');
var async = require('async');

game.setTimeoutLength(500);

var arguments = process.argv.slice(2);

var players = game.readPlayers(arguments);

//play every combination of matches

function determineWinner(firstName, secondName, firstMove, secondMove) {
  firstMove = firstMove.trim().toLowerCase();
  secondMove = secondMove.trim().toLowerCase();

  if(firstMove === secondMove) {
    return "It's a tie!";
  } else if( (firstMove === "scissors" && secondMove == "paper") ||
    (firstMove === "rock" && secondMove == "scissors") ||
    (firstMove === "paper" && secondMove == "rock") ) {
    return firstName + " wins!";
  } else {
    return secondName + " wins!";
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

        console.log('ROUND %d', match.index);
        console.log('%s vs %s', match.players[0].getName(), match.players[1].getName());
        console.log('%s moves %s, %s moves %s', match.players[0].getName(), moves[0], match.players[1].getName(), moves[1]);
        console.log(determineWinner(match.players[0].getName(), match.players[1].getName(), moves[0], moves[1]));
        console.log(''); //newline

        done();
    });

}

//start it off
game.playAllMatches(players, 2, playMatch, function() {
    console.log('All done!');
});
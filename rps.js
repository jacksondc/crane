var game = require('./crane');

game.setTimeoutLength(500);

var arguments = process.argv.slice(2);

var players = game.readPlayers(arguments);

//play every combination of matches!
var count = 0;
for(var i = 0; i < players.length; i++) {
  for(var j = i; j < players.length; j++) {
    if(i !== j) { //don't play a bot against itself
      console.log('round ' + (++count) + ' - ' + players[i].getName() + ' vs '+ players[j].getName());
      var firstPlayerMove = players[i].send('move');
      var secondPlayerMove = players[j].send('move');
      console.log('player 1 moves ' + firstPlayerMove + ', player 2 moves ' + secondPlayerMove); //no data
      console.log('winner: ' + determineWinner(players[i].getName(), players[j].getName(), firstPlayerMove, secondPlayerMove));
      console.log(''); //newline
    }
  }
}

function determineWinner(firstName, secondName, firstMove, secondMove) {
  //console.log('type is ' + typeof(firstMove) + ' and is ' + firstMove + ' and trim is ' + firstMove.trim);
  firstMove = firstMove.trim().toLowerCase();
  secondMove = secondMove.trim().toLowerCase();

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
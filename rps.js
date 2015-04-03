var Crane = require('./crane');

/************
*   GAME  *
************/

var game = new Crane();
var players = game.readAllPlayers(arguments);

var firstPlayer = players[0];
var secondPlayer = players[1];

for(var i = 0; i < 3; i++) {
  console.log('round ' + i);
  var firstPlayerMove = firstPlayer.sendMessage('move');
  var secondPlayerMove = secondPlayer.sendMessage('move');
  console.log('player 1 moves ' + firstPlayerMove + ', player 2 moves ' + secondPlayerMove); //no data
  console.log('winner: ' + determineWinner(firstPlayer.name, secondPlayer.name, firstPlayerMove, secondPlayerMove))
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
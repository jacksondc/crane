# Overview
Crane is a generic king-of-the-hill game controller that neatly abstracts game and communication logic.

DISCLAIMER: This is way before alpha. It's like version -1. I wouldn't recommend using it yet.

# Server
The game logic is specific to a game and must (at the moment) be written in JavaScript. Run this file to run the whole simulation. For instance, here's a demo with rock paper scissors:

```js
var game = require('./crane');

var arguments = process.argv.slice(2);

var players = game.readAllPlayers(arguments);

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
```

The important parts:

1. Import crane with `require('./crane');`
2. Use `readAllPlayers()` to get player objects for each file in the /player directory.
3. For each player object, call `send()` to synchronously get data from that player.

# Client
In the /client directory (which you shouldn't have to touch) are clients written in different languages - currently Java, Python (3, although 2 might work too - I'm not sure), and JavaScript. When reading in players from the /player directory, Crane will choose a client to use for that player based on its file extension.

Player files will vary slightly based on the language. The basic idea is (A) they should be as short and simple as possible, (B) they should be able to retain state across rounds, and (C) the only required method is the `respond()` method.

Here are examples of players for the rock paper scissors game:

##JavaScript
```js
this.respond = function(command) {
  if(command === "move")
    return move;
  else
    return "err";
}

//initialize things outside respond
move = "rock";
```

The only caveat here is that you need to use this.respond instead of respond. I'll try to fix that later.

##Python
```py
def respond(command) :
  if(command == "move") :
    return move
  else :
    return "err"

move = "rock"
```

Straightforward as it gets.

##Java
```java
public class JavaPlayer {
  public String move = "";
  public String respond(String command) {
    if(command.equals("move")) {
      return move;
      } else {
        return "err";
      }
    }

    public JavaPlayer() {
      move = "scissors";
    }
  }
}
```

A tad more verbose.

# Writing a Client
If you want to use a language that doesn't already have a client, you'll have to write your own. Here's the idea:

1. The client is executed through the command line. All messages are sent through standard output and received through standard input.
2. The first word (up to a space) of each message from the server is considered the command. Everything after that is data, which should be used differently depending on the command.
3. Responses from the client come in this format: the first word is the same as the command received. The second word is a status code: 200 for okay, 400 for error. Anything after that is data, which will be sent back to the game component.
4. All messages should get trimmed (whitespace removed from either side) before passed on to the player (the server separates messages on different lines, but the player should never see those.)
5. Each client passes along messages from one player.
6. The first message a client receives will have the command "filename", followed by the filename (without file extension) of its player. The client is in charge of somehow importing this file and calling its `respond()` method. For instance, the JavaScript file uses Node's require: `require('../player/' + playerFile + '.js')` (here, `playerFile` is the filename received from the server).
7. All subsequent messages will have the command "player", possibly followed by data, which should be passed as arguments to the player's `respond()` method.

Look at the existing clients to get a better feel for how they are implemented.

# TODO
- Add custom timeout option
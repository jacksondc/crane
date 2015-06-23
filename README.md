# Overview
Crane solves some common problems in writing games for AI players, ideally for small games and short competitions. It provides an API to communicate between a game and its players.

**Version:** -1.

# Game
The game logic is specific to a game and must (at the moment) be written in JavaScript. Run this file to run the whole simulation. For instance, here's a demo with rock paper scissors:

```js
var game = require('./crane');

var arguments = process.argv.slice(2);

var players = game.readPlayers(arguments);

//play every combination of matches
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
2. Use `readPlayers()` to get player objects. If a list of file names in the `/player` directory is provided as the first argument, it will only load those players. Otherwise it will load all players in the `/player` directory.
3. For each player object, call `send()` to synchronously get data from that player.

##Settings
There's only one optional setting right now, `setTimeoutLength()`, which accepts a number of milliseconds after which Crane will stop listening for a player response and throw an error (defaults to 1000). The rock paper scissors game could use it like this:

```js
game.setTimeoutLength(500);
```

# Player
In the /client directory (which you shouldn't have to touch) are clients written in different languages - currently Java, Python (3, although 2 might work too - I'm not sure), and JavaScript. When reading in players from the /player directory, Crane will choose a client to use for that player based on its file extension.

Player files will vary slightly based on the language. The basic idea is (A) they should be as short and simple as possible, (B) they should be able to retain state across rounds, and (C) the only required method is the `respond()` method.

Here are examples of players for the rock paper scissors game:

##JavaScript
```js
//initialize things here if necessary
var move = "rock";

function respond(command) {
  if(command === "move")
    return move;
  else
    return "err";
}
```

##Python
```py
move = "rock"

def respond(command) :
    if(command == "move") :
        return move
    else :
        return "err"
```

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
```

# Writing a Client
If you want to use a language that doesn't already have a client, you'll have to write your own. Here's the idea:

1. The client is executed through the command line. All messages are sent through standard output and received through standard input.
2. The first word (up to a space) of each message from the server is considered the command. Everything after that is data, which should be used differently depending on the command.
3. Responses from the client come in this format: the first word is the same as the command received. The second word is a status code: 200 for okay, 400 for error. Anything after that is data, which will be sent back to the game component.
4. All messages should get trimmed (whitespace removed from either side) before passed on to the player (the server separates messages on different lines, but the player should never see those.)
5. Each client passes along messages from one player.
6. The first message a client receives will have the command "filename", followed by the filename (without file extension) of its player. The client is in charge of somehow importing this file and calling its `respond()` method. For instance, the JavaScript file uses Node's require: `require('../player/' + playerFile + '.js')` (here, `playerFile` is the filename received from the server). The response should look like "filename 200" (no data is necessary).
7. All subsequent messages will have the command "player", possibly followed by data, which should be passed as arguments to the player's `respond()` method. The response should look like "player 200 ", followed by whatever the player returned from that method.

Look at the existing clients to get a better idea of how they are implemented.

# To Do
- Escape newline characters
# Overview
Crane is a toolkit for writing games for AI players. It provides an API to communicate between a game written in JavaScript and players written in other languages.

**Version -1.**

# Quick start
##Player
Put players in the `/players` directory. Each player must define the method `respond`, which takes a string command and returns a string response:

```js
function respond(command) {
  if(command === "move")
    return "rock";
  else
    return "err";
}
```

Crane currently supports players written in Python 3, JavaScript, and Java. For other languages, you'll need to [write a client](#writing-a-client).

##Game
Put `crane.js` in the same folder as your game, then require it:

```js
var crane = require('./crane');

```

Call `readPlayers` to get a list of all players:

```js
var players = crane.readPlayers();
```

Communicate with players using `send`:

```js
var playerMove = players[0].send('move'); //rock
```

For a full example, see the [rock paper scissors](https://github.com/jacksondc/crane/tree/master/examples/rps) game.

#Game API
##readPlayers([players])
Returns an array of `Player` objects corresponding to files in the `/players` directory. Players not written in supported languages will be ignored. To receive players only for specific objects, pass in their filenames as an array.

```js
crane.readPlayers(['python-player.py', 'js-player.js']); //only pick these two players
```

##setTimoutLength(length)
Sets the amount of time, in milliseconds, that Crane will wait for player responses before throwing an error. Defaults to 1000.

```js
crane.setTimeoutLength(500); //wait half a second for responses
```

##Player.send(message)
Accepts a string message, which will be passed into the player's `respond` method as its only argument. Returns a string message returned by the `respond` method.

```js
var response = player.send("move")
```

Messages are passed through stdin/stdout and aren't sanitized at all. Special characters or newlines will likely mess everything up. Whitespace is preserved as long as it doesn't start or end the message.

#Player API
A player only needs to implement one method, `respond`, which accepts a single string argument, a message from the game, and returns a string to the game.  Full examples of players written in all supported languages can be found in the [rock paper scissors](https://github.com/jacksondc/crane/tree/master/examples/rps/players) game.

```js
function respond(message) {
  return "response";
}
```

#Language Notes
Crane currently has clients for Python 3, JavaScript, and Java (it will recognize files with the extensions `.py`, `.js` and `.class`.) It assumes python is accessible with `python3`, node with `node`, and Java with `java`.

# Writing a Client
If you want to use a language that doesn't already have a client, you'll have to write your own. Here's the general framework:

1. A new client is initialized for each player, so the same client might be running multiple times at once.
2. The client is executed through the command line. All messages are sent through standard output and received through standard input.
3. The client will receive one argument, the filename (without file extension) of its player. The client must then import this file and find its `respond` method.
3. Each line is considered a message. If multiple lines are received at once, split them before processing.
4. The first word (up to a space) of each message from the server is a unique message ID. The second word is a command. Anything after that is data.
5. The first word of every response from the client is the same message ID. The second word is a status code: 200 for okay, 400 for error. Anything after that is data, which will be sent back to the game.
6. There is (currently) only one valid command, player, which may be followed by data. If there is data, it should be passed as an argument to the player's `respond()` method. Before sending data to the player, remove whitespace (especially newlines) from either side. Whatever `respond()` returns should be data in the client's response to the game.
7. Clients can also send messages that are not responses to server messages, by replacing the first token (normally the id) with 'err' or 'log' (depending on the type of message). This is useful for debugging or for errors finding the player file before the first message arrives.

Look at the existing [clients](https://github.com/jacksondc/crane/tree/master/client) for more implementation specifics.

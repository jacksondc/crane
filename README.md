# Overview
Crane is a toolkit for writing games for AI players. It provides an API to communicate between a game written in JavaScript and players written in other languages, as well as utilities for running tournaments.

**Version -1. All APIs unstable.**

# Quick start
## Player
Put players in the `/players` directory. Each player must define the method `respond`, which takes a string command and returns a string response:

```js
function respond(command) {
  return (command === move) ? "rock" : "err";
}
```

Crane currently supports players written in Python 3, JavaScript, and Java. For other languages, you'll need to [write a client](#writing-a-client).

## Game
Install with npm:

```bash
npm install --save @jacksondc/crane
```

Require:

```js
var crane = require('@jacksondc/crane');

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

# Game API
## readPlayers([players])
Returns an array of `Player` objects corresponding to files in the `/players` directory. Players not written in supported languages will be ignored. To receive players only for specific objects, pass in their filenames as an array.

```js
crane.readPlayers(['python-player.py', 'js-player.js']); //only pick these two players
```

## setTimoutLength(length)
Sets the amount of time, in milliseconds, that Crane will wait for player responses before throwing an error. Defaults to 1000.

```js
crane.setTimeoutLength(500); //wait half a second for responses
```

## Player.send(message)
Accepts a string message, which will be passed into the player's `respond` method as its only argument. Returns a string message returned by the `respond` method.

```js
var response = player.send("move")
```

Messages are passed through stdin/stdout and aren't sanitized at all. Special characters or newlines will likely mess everything up. Whitespace is preserved as long as it doesn't start or end the message.

# Player API
A player only needs to implement one method, `respond`, which accepts a single string argument, a message from the game, and returns a string to the game.  Full examples of players written in all supported languages can be found in the [rock paper scissors](https://github.com/jacksondc/crane/tree/master/examples/rps/players) game.

```js
function respond(message) {
  return "response";
}
```

# Language Notes
Crane currently has clients for Python 3, JavaScript, and Java (it will recognize files with the extensions `.py`, `.js` and `.class`.) It assumes python is executable as `python3`, node as `node`, and Java as `java`.

# Automating Gameplay
## playTournament(players, eachMatch, [options])
*NOTE: playTournament currently only plays two-player games.*

Plays some number of matches between each player in the tournament and tallies up the results, which are passed to the callback and (optionally) printed in a table. Matches between the same combinations of players will be played back-to-back.

**Arguments**
1. `players`: An array of player objects (from `readPlayers`) to consider for games in the tournament
2. `eachRound`: A function to execute each round
3. `options.callback`: A callback to execute when the tournament is finished
4. `options.rounds`: the number of times to play each combination of opponents against each other (default 100). Can also be set to `'UNTIL_SIGNIFICANT'`, which plays until the first-place player has a statistically-significant lead over the second-place player
5. `options.numRandomizations`: the number of times to re-randomize score datasets in testing statistical significance (default 1000). Ignored unless `options.rounds` is set to `'UNTIL_SIGNIFICANT'`
5. `options.pValueThreshold`: the probability of a random outcome of the a gap between the two leading players greater than or equal to the actual gap below which no more rounds will be played (default 0.05). Ignored unless `options.rounds` is set to `'UNTIL_SIGNIFICANT'`
5. `options.printTable`: set to false to suppress table printing (default true)

The `eachMatch` function accepts two arguments, a match object and a callback. The match object consists of a `players` array at `match.players` with all the participating players and a match number at `match.index` (an integer starting at one). The callback accepts two arguments: an error and a score array, where each score is for the player at the corresponding index of in the `players` array.

`options.callback` will be passed two arguments: an error and an array of results. Results will be sorted with best performers (lowest ranks) at the beginning. Each entry in `results` has a player object at `result.player`, a cumulative score (across all matches played) at `result.score`, and an average score at `result.avgScore`.

An example call to `playTournament` and possible output:

```js
game.playTournament(game.readPlayers(), function(match, cb) {
  // ...
  cb(null, [1, -1]); //win for player 0
}, {
  callback: function(err, results) {
    console.log('%s wins with %d points', results[0].player.getName(), results[0].score);
  },
  numRounds: 5
});
```

```sh
┌──────────┬────────────────────┬────────────┬────────────┐
│ Rank     │ Player             │ Score      │ Avg Score  │
├──────────┼────────────────────┼────────────┼────────────┤
│ 1        │ python-player      │          5 │       1.00 │
├──────────┼────────────────────┼────────────┼────────────┤
│ 2        │ js-player          │          1 │       0.20 │
├──────────┼────────────────────┼────────────┼────────────┤
│ 3        │ JavaPlayer         │         -6 │      -1.20 │
└──────────┴────────────────────┴────────────┴────────────┘

python-player wins with 5 points
```

# Writing a Client
If you want to use a language that doesn't already have a client, you'll have to write your own. Here's the general framework:

1. A new client is initialized for each player, so the same client might be running multiple times at once.
2. The client is executed through the command line. All messages are sent through standard output and received through standard input.
3. The client will receive one argument, the filename (without file extension) of its player. The client must then import this file and find its `respond` method.
3. Each line is considered a message. If multiple lines are received at once, split them before processing.
4. The first word (up to a space) of each message from the server is a unique message ID. The second word is a command. Anything after that is data.
5. The first word of every response from the client is the same message ID. The second word is a status code: 0 for okay, 1 for error. Anything after that is data, which will be sent back to the game.
6. There is (currently) only one valid command, player, which may be followed by data. If there is data, it should be passed as an argument to the player's `respond()` method. Before sending data to the player, remove whitespace (especially newlines) from either side. Whatever `respond()` returns should be data in the client's response to the game.
7. Clients can also send messages that are not responses to server messages, by replacing the first token (normally the id) with 'err' or 'log' (depending on the type of message). This is useful for debugging or for errors finding the player file before the first message arrives.

Look at the existing [clients](https://github.com/jacksondc/crane/tree/master/client) for more implementation specifics.

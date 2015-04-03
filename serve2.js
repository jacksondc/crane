var fs = require('fs');

function engine() {
  //get players
  var players = fs.readdirSync('player');

  //somehow run a client (we can't do this bc of language barrier)
  for(var i = 0; i < players.length; i++) {
    var fullFile = players[i];
    var components = fullFile.split('.');
    var extension = components[components.length-1];
    if(extension == "js") {
      eval(fs.readFileSync(fullFile).toString());
    }
  }

  var players = [
    {
      home: 'http://localhost:7070'
    },
    {
      home: 'http://localhost:7071'
    }
  ];

  /*var gameInProgress = true;
  var index = 0;
  while(gameInProgress) {
    console.log("Round " + ++index);
    for(var i = 0; i < players.length; i++) {
      var player = players[i];
      var req = httpsync.get(player.home);
      var res = req.end();
      var data = Number(res.data.toString());
      if(data > 4) {
        console.log("Player " + i + " wins with " + data);
        gameInProgress = false;
      }
    }
  }*/
}

engine();
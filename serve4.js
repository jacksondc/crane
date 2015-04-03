var spawn = require('child_process').spawn;
var ps    = spawn('python3', ['player/double-negative.py']);

ps.stdout.on('data', function (data) {
  console.log(data.toString());
});

ps.stderr.on('data', function (data) {
  console.log('ps stderr: ' + data.toString());
});

ps.on('close', function (code) {
  if (code !== 0) {
    console.log('ps process exited with code ' + code);
  }
});
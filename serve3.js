var child = require('child_process');

var player = child.spawn('python3', ['player/double-negative.py']);

player.stdin.setEncoding = 'utf-8';
player.stdin.write('hello');

player.stdin.on('end', function() {
  console.log('REPL stream ended.');
});

player.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});

player.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});
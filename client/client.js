var http = require('http');

var arguments = process.argv.slice(2);

http.createServer(function (req, res) {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  var response = getMove();
  res.end(response + ''); //must be a string
}).listen(arguments[0], '127.0.0.1');

console.log('Server running at http://localhost:' + arguments[0] + '/');
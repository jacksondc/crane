//crane
var stdin = process.openStdin();
stdin.on('data', function(line) {
  line = line.toString();
  var i = line.indexOf(' '); //get separator index
  var command = null;
  var data = null;
  if(i > 0) {
    command = line.slice(0,i);
    data    = line.slice(i+1);
  } else {
    command = line;
    //data still null
  }
  //send response
  console.log(respond(command, data));
});

//client
function respond(command, data) {
  if(command == "move")
    return "rock";
  else
    return "err";
}

//initialize things here if necessary
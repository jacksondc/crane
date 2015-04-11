this.respond = function(command) {
  if(command === "move")
    return move;
  else
    return "err";
}

//initialize things here if necessary
var move = "rock";
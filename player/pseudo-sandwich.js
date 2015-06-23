//initialize things here if necessary
var move = "rock";

function respond(command) {
  if(command === "move")
    return move;
  else
    return "err";
}
//initialize things globally if necessary
var move = "rock";

function respond(command) {
  if(command === "move")
    return Math.random() < 0.5 ? "rock" : "paper";
  else
    return "err";
}
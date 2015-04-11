public class JavaPlayer {
  public String move = "";
  public String respond(String command) {
    if(command.equals("move")) {
      return move;
    } else {
      return "err";
    }
  }

  public JavaPlayer() {
    move = "scissors";
  }
}
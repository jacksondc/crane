import java.io.*; // for printwriter
import java.util.*; //for scanner

public class StupidJava {
  public void log(String message) {
    try {
      PrintWriter writer = new PrintWriter("stupidjava-log.txt", "UTF-8");
      writer.println(message);
      writer.close();
    } catch (Exception ex) {
      System.out.println("got exception " + ex);
    }
  }

  public String respond(String data) {
    return "scissors";
  }

  public StupidJava() {}
}
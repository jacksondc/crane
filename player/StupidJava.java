import java.io.*; // for printwriter
import java.util.*; //for scanner

public class StupidJava {
  public static void log(String message) {
    try {
      PrintWriter writer = new PrintWriter("stupidjava-log.txt", "UTF-8");
      writer.println(message);
      writer.close();
    } catch (Exception ex) {
      System.out.println("got exception " + ex);
    }
  }
  public static void main(String[] args) {

    Scanner s = new Scanner(System.in);

    while(true){
      String myInput = s.nextLine();
      System.out.println("scissors");
      log("Java got " + myInput + " " + System.currentTimeMillis());
    }

  }
}
//compile with: javac -classpath '.:..' Client.java
import java.io.*; // for printwriter
import java.util.*; //for scanner
import java.net.*; //for URL
import java.lang.reflect.*; //for getting respond method

public class Client {
  /*public static void log(String message) {
    try {
      PrintWriter writer = new PrintWriter("stupidjava-log.txt", "UTF-8");
      writer.println(message);
      writer.close();
    } catch (Exception ex) {
      System.out.println("got exception " + ex);
    }
  }*/

  public static void main(String[] args) {
    Scanner s = new Scanner(System.in);
    Object player = null;
    Method respond = null;

    while(true){
      String[] input = s.nextLine().trim().split(" ");
      String id = null;
      String command = null;
      String data = null;

      id        = input[0];
      command   = input[1];
      if(input.length > 2) {
        data    = input[2];
      }

      if(command.equals("filename")) {

        // Create a File object on the root of the directory containing the class file
        File file = new File(data);

        try {
          // Convert File to a URL
          URL url = file.toURI().resolve(".").toURL();
          URL[] urls = new URL[]{url};

          // Create a new class loader with the directory
          ClassLoader cl = new URLClassLoader(urls);

          // Load in the class; MyClass.class should be located in
          // the directory file:/c:/myclasses/com/mycompany
          Class cls = cl.loadClass(file.getName());
          player = cls.newInstance();

          Class[] cArg = new Class[1];
          cArg[0] = String.class;

          respond = cls.getMethod("respond", cArg);
          System.out.println(id + " 200");
        } catch (Exception ex) {
          System.out.println(id + " 400 " + ex.toString());
        }

      } else if(command.equals("player")) {
          if(player == null || respond == null) {
            System.out.println(id + " 400 player-not-initialized");
          } else {
            try {
              System.out.println(id + " 200 " + respond.invoke(player, data));
            } catch(Exception ex) {
              System.out.println(id + " 400 " + ex.toString());
            }
          }
      } else {
        System.out.println(id + " 400 unrecognized-command " + command);
      }
    }

  }
}
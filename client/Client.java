//compile with: javac -classpath '.:..' Client.java
import java.io.*; // for printwriter
import java.util.*; //for scanner
import java.net.*; //for URL
import java.lang.reflect.*; //for getting respond method

public class Client {

  public static void main(String[] args) {
    Scanner s = new Scanner(System.in);

    Object player = null;
    Method respond = null;
    Class playerClass = null;
    String filename = "";

    boolean success = true;

    try {
      filename = args[0];

      // Create a File object on the root of the directory containing the class file
      File file = new File(filename);

      // Convert File to a URL
      URL url = file.toURI().resolve(".").toURL();
      URL[] urls = new URL[]{url};

      // Create a new class loader with the directory
      ClassLoader cl = new URLClassLoader(urls);

      // Load in the class; MyClass.class should be located in
      // the directory file:/c:/myclasses/com/mycompany
      Class cls = cl.loadClass(file.getName());

      playerClass = cls;
      player = cls.newInstance();


      Class[] cArg = new Class[1];
      cArg[0] = String.class;

      respond = cls.getMethod("respond", cArg);
    } catch(ArrayIndexOutOfBoundsException ex) {
      success = false;
      System.out.println("err received no filepath argument");
    } catch(MalformedURLException | ClassNotFoundException | InstantiationException ex) {
      success = false;
      System.out.printf("err received invalid filepath %s", filename);
    } catch(IllegalAccessException ex) {
      success = false;
      System.out.printf("err access denied for player %s", filename);
    } catch(NoSuchMethodException ex) {
      success = false;
      System.out.println("err player had no respond method");
    }

    if(success) {
      while(true) {
        String[] input = s.nextLine().trim().split(" ");
        String id = null;
        String command = null;
        String data = null;

        id        = input[0];
        command   = input[1];
        if(input.length > 2) {
          data    = String.join(" ", Arrays.copyOfRange(input, 2, input.length));
        }

        if(command.equals("player")) {
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
}
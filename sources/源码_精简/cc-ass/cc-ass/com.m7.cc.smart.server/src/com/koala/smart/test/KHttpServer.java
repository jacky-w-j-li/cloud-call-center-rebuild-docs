package com.koala.smart.test;

import java.io.File;
import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.Hashtable;

public class KHttpServer extends Thread {

    public static final String VERSION = "xxxxxxxxxxxxxxxxxx";
    public static final Hashtable MIME_TYPES = new Hashtable();
    
    static {
        String image = "image/";
        MIME_TYPES.put(".gif", image + "gif");
        MIME_TYPES.put(".jpg", image + "jpeg");
        MIME_TYPES.put(".jpeg", image + "jpeg");
        MIME_TYPES.put(".png", image + "png");
        String text = "text/";
        MIME_TYPES.put(".html", text + "html");
        MIME_TYPES.put(".htm", text + "html");
        MIME_TYPES.put(".txt", text + "plain");
    }
    
    public KHttpServer(File rootDir, int port) throws IOException {
    	super("Http server");
        _rootDir = rootDir.getCanonicalFile();
        if (!_rootDir.isDirectory()) {
            throw new IOException("Not a directory.");
        }
        _serverSocket = new ServerSocket(port);
        start();
    }
    
    public void run() {
        while (_running) {
            try {
                Socket socket = _serverSocket.accept();
                System.out.println(socket.getInetAddress().getHostAddress()+":"+socket.getInetAddress().getHostName()+":"+socket.getPort()+":local port="+socket.getLocalPort());
                KRequestThread requestThread = new KRequestThread(socket, _rootDir);
                requestThread.start();
            }
            catch (IOException e) {
                System.exit(1);
            }
        }
    }
    
    // Work out the filename extension.  If there isn't one, we keep
    // it as the empty string ("").
    public static String getExtension(java.io.File file) {
        String extension = "";
        String filename = file.getName();
        int dotPos = filename.lastIndexOf(".");
        if (dotPos >= 0) {
            extension = filename.substring(dotPos);
        }
        return extension.toLowerCase();
    }
    
    public static void main(String[] args) {
        try {
            KHttpServer server = new KHttpServer(new File("./"), 9090);
        }
        catch (IOException e) {
            System.out.println(e);
        }
    }
    
    private File _rootDir;
    private ServerSocket _serverSocket;
    private boolean _running = true;

}
package com.koala.smart.test;

import java.io.BufferedInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URLDecoder;
import java.util.Date;
import java.util.Hashtable;

import com.koala.smart.server.Session;
import com.koala.smart.server.exception.AppException;
import com.koala.smart.server.exception.SessionException;
import com.koala.smart.server.listener.DataListener;
import com.koala.smart.server.listener.SessionListener;

public class C5RequestHandler implements DataListener, SessionListener {
	private static final Hashtable<String, String> MIME_TYPES = new Hashtable<String, String>();
	private File _rootDir;
	private Hashtable<String, String> requests = new Hashtable<String, String>();

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

	public C5RequestHandler() {
		File file = new File("./");
		try {
			_rootDir = file.getCanonicalFile();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	private static void sendHeader(Session session, int code,
			String contentType, long contentLength, long lastModified)
			throws IOException {
		try {
			session.send(("HTTP/1.0 "
					+ code
					+ " OK\r\n"
					+ "Date: "
					+ new Date().toString()
					+ "\r\n"
					+ "Server: JibbleWebServer/1.0\r\n"
					+ "Content-Type: "
					+ contentType
					+ "\r\n"
					+ "Expires: Thu, 01 Dec 1994 16:00:00 GMT\r\n"
					+ ((contentLength != -1) ? "Content-Length: "
							+ contentLength + "\r\n" : "") + "Last-modified: "
					+ new Date(lastModified).toString() + "\r\n" + "\r\n")
					.getBytes());
		} catch (AppException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (SessionException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	private static void sendError(Session session, int code,
			String message) throws IOException {
		message = message + "<hr>" + KHttpServer.VERSION;
		sendHeader(session, code, "text/html", message.length(), System
				.currentTimeMillis());
		try {
			session.send(message.getBytes());
		} catch (AppException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (SessionException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}
	}

	public void handleByte(Session session, byte[] command) {
		System.out.println(session.getId());
		InputStream reader = null;
		
		StringBuffer sb = new StringBuffer();
		sb.append(new String(command));
		String request = sb.toString();
		if(requests.containsKey(session.getId())){
			String a = requests.remove(session.getId());
			if(request.contains("\r\n\r\n")){
				request = a+request;
				String[] b = request.split("\r\n\r\n");
				if(b.length > 2){
					requests.put(session.getId(), b[1]);
				}
				request = b[0];
			}else {
				a = a + request;
				requests.put(session.getId(), a);
				return;
			}
		}else {
			if(request.contains("\r\n\r\n")){
				String[] b = request.split("\r\n\r\n");
				if(b.length > 2){
					requests.put(session.getId(), b[1]);
				}
				request = b[0];
			}else {
				requests.put(session.getId(), request);
				return;
			}
		}
		System.out.println(request);
		request = request.substring(0, request.indexOf("\r\n"));
		try{
			if (request == null
					|| (!request.startsWith("GET") && !request
							.startsWith("POST"))
					|| !(request.endsWith("HTTP/1.0") || request
							.endsWith("HTTP/1.1"))) {
				// Invalid request type (no "GET")
				sendError(session, 500, "Invalid Method.");
				session.close();
				return;
			}

			String path = request.substring(4, request.length() - 9);
			if (path.startsWith("/action")) {
				sendHeader(session, 200, "text/plain", -1, System
						.currentTimeMillis());
				session.send(("server get your action: " + path.substring(path
						.indexOf('-') + 1 )+" "+System.currentTimeMillis()).getBytes());
				session.close();
				return;
			}
			if (request.startsWith("GET")) {
				File file = new File(_rootDir, URLDecoder.decode(path, "UTF-8"))
						.getCanonicalFile();
				if (file.isDirectory()) {
					// Check to see if there is an index file in the directory.
					File indexFile = new File(file, "index.html");
					if (indexFile.exists() && !indexFile.isDirectory()) {
						file = indexFile;
					}
				}

				if (!file.toString().startsWith(_rootDir.toString())) {
					// Uh-oh, it looks like some lamer is trying to take a peek
					// outside of our web root directory.
					sendError(session, 403, "Permission Denied.");
				} else if (!file.exists()) {
					// The file was not found.
					sendError(session, 404, "File Not Found.");
				} else if (file.isDirectory()) {
					// print directory listing
					if (!path.endsWith("/")) {
						path = path + "/";
					}
					File[] files = file.listFiles();
					sendHeader(session, 200, "text/html", -1, System
							.currentTimeMillis());
					String title = "Index of " + path;
					session.send(("<html><head><title>" + title
									+ "</title></head><body><h3>Index of "
									+ path + "</h3><p>\n").getBytes());
					for (int i = 0; i < files.length; i++) {
						file = files[i];
						String filename = file.getName();
						String description = "";
						if (file.isDirectory()) {
							description = "&lt;DIR&gt;";
						}
						session.send(("<a href=\"" + path + filename + "\">"
								+ filename + "</a> " + description + "<br>\n")
								.getBytes());
					}
					session.send(("</p><hr><p>" + KHttpServer.VERSION + "</p></body><html>")
									.getBytes());
				} else {
					reader = new BufferedInputStream(new FileInputStream(file));

					String contentType = (String) KHttpServer.MIME_TYPES
							.get(KHttpServer.getExtension(file));
					if (contentType == null) {
						contentType = "application/octet-stream";
					}

					sendHeader(session, 200, contentType, file.length(), file
							.lastModified());
					System.out.println("file size: "+file.length());
					byte[] buffer = new byte[4096];
					int bytesRead;
					while ((bytesRead = reader.read(buffer)) != -1) {
						byte[] data = new byte[bytesRead];
						System.arraycopy(buffer, 0, data, 0, bytesRead);
						session.send(data);
					}
					reader.close();
				}
//				String line = "";
//				while ((line = in.readLine()) != null) {
//					if (line.equalsIgnoreCase(""))
//						break;
//					System.out.println("get: " + line);
//				}
			} else if (request.startsWith("POST")) {
//				String line = "";
//				while ((line = in.readLine()) != null) {
//					if (line.equalsIgnoreCase(""))
//						break;
//					System.out.println("post: " + line);
//				}

			}
			System.err.println("To close session: "+session.getId());
			Thread.currentThread().sleep(5000);
			session.close();
		}catch (Exception e){
			e.printStackTrace();
		}
		
	}

	public void newSession(Session session) {
		// TODO Auto-generated method stub

	}

	public void sessionClosed(Session session) {
		System.err.println("session closed: "+session.getId());
	}

	public void sessionTimeout(Session session, long time) {
		// TODO Auto-generated method stub

	}

	public void handleString(Session session, String command) {
		// TODO Auto-generated method stub
		
	}

}

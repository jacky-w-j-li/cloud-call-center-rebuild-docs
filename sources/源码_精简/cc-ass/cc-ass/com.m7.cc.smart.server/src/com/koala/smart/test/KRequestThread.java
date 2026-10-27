package com.koala.smart.test;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.Socket;
import java.net.URLDecoder;
import java.util.Date;

public class KRequestThread extends Thread {
	private File _rootDir;
	private Socket _socket;

	public KRequestThread(Socket socket, File rootDir) {
		super("request thread");
		_socket = socket;
		_rootDir = rootDir;
	}

	private static void sendHeader(BufferedOutputStream out, int code,
			String contentType, long contentLength, long lastModified)
			throws IOException {
		out.write(("HTTP/1.0 "
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
				+ ((contentLength != -1) ? "Content-Length: " + contentLength
						+ "\r\n" : "") + "Last-modified: "
				+ new Date(lastModified).toString() + "\r\n" + "\r\n")
				.getBytes());
	}

	private static void sendError(BufferedOutputStream out, int code,
			String message) throws IOException {
		message = message + "<hr>" + KHttpServer.VERSION;
		sendHeader(out, code, "text/html", message.length(), System
				.currentTimeMillis());
		out.write(message.getBytes());
		out.flush();
		out.close();
	}

	public void run() {
		InputStream reader = null;
		try {
			_socket.setSoTimeout(30000);
			InputStream in = _socket.getInputStream();
			byte[] data = new byte[512];
			int a = -1;
			StringBuffer sb = new StringBuffer();
//			while(
					a = in.read(data);
//					!= 0){
				sb.append(new String(data, 0, a));
//			}
			
			String request = sb.toString();
			System.out.println(request);
			request = request.substring(0, request.indexOf("\r\n"));
//			BufferedReader in = new BufferedReader(new InputStreamReader(
//					));
			BufferedOutputStream out = new BufferedOutputStream(_socket
					.getOutputStream());

//			String request = in.readLine();
			if (request == null
					|| (!request.startsWith("GET") && !request
							.startsWith("POST"))
					|| !(request.endsWith("HTTP/1.0") || request
							.endsWith("HTTP/1.1"))) {
				// Invalid request type (no "GET")
				sendError(out, 500, "Invalid Method.");
				return;
			}

			String path = request.substring(4, request.length() - 9);

			if (path.startsWith("/action")) {
				sendHeader(out, 200, "text/plain", -1, System
						.currentTimeMillis());
				out.write(("server get your action: " + path.substring(path
						.indexOf('-') + 1 )+" "+System.currentTimeMillis()).getBytes());
				out.flush();
				out.close();
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
					sendError(out, 403, "Permission Denied.");
				} else if (!file.exists()) {
					// The file was not found.
					sendError(out, 404, "File Not Found.");
				} else if (file.isDirectory()) {
					// print directory listing
					if (!path.endsWith("/")) {
						path = path + "/";
					}
					File[] files = file.listFiles();
					sendHeader(out, 200, "text/html", -1, System
							.currentTimeMillis());
					String title = "Index of " + path;
					out
							.write(("<html><head><title>" + title
									+ "</title></head><body><h3>Index of "
									+ path + "</h3><p>\n").getBytes());
					for (int i = 0; i < files.length; i++) {
						file = files[i];
						String filename = file.getName();
						String description = "";
						if (file.isDirectory()) {
							description = "&lt;DIR&gt;";
						}
						out.write(("<a href=\"" + path + filename + "\">"
								+ filename + "</a> " + description + "<br>\n")
								.getBytes());
					}
					out
							.write(("</p><hr><p>" + KHttpServer.VERSION + "</p></body><html>")
									.getBytes());
				} else {
					reader = new BufferedInputStream(new FileInputStream(file));

					String contentType = (String) KHttpServer.MIME_TYPES
							.get(KHttpServer.getExtension(file));
					if (contentType == null) {
						contentType = "application/octet-stream";
					}

					sendHeader(out, 200, contentType, file.length(), file
							.lastModified());

					byte[] buffer = new byte[4096];
					int bytesRead;
					while ((bytesRead = reader.read(buffer)) != -1) {
						out.write(buffer, 0, bytesRead);
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

			out.flush();
			out.close();
		} catch (IOException e) {
			if (reader != null) {
				try {
					reader.close();
				} catch (Exception anye) {
					// Do nothing.
				}
			}
		}
	}

}
package com.dishui.util;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.logging.Logger;

public class HttpProvider {
	private static final int BUFFER_SIZE = 4096;

    private static  Logger log= Logger.getLogger(HttpProvider.class.getName());
	public static String sendGet(String url) throws Exception {
		return sendGet(url, 3000);
	}

	public static String sendGet(String url, int timeout) throws Exception {
		String result = "";
		HttpURLConnection con = null;
		BufferedReader in = null;
		try {
			URL httpUrl = new URL(url);
			con = (HttpURLConnection) httpUrl.openConnection();
			con.setRequestMethod("GET");
			con.setReadTimeout(timeout);
			con.setConnectTimeout(timeout);
			int responseCode = con.getResponseCode();
            log.info("Get  return ["+responseCode+"] from "+url);
			if (responseCode == HttpURLConnection.HTTP_OK) {
				in = new BufferedReader(new InputStreamReader(con.getInputStream(), "UTF-8"));
				String line;
				while ((line = in.readLine()) != null) {
					result += line;
				}
				return result;
			} else {

			}
		} catch (IOException e) {
			throw e;
		} finally {
			if (in != null)
				in.close();
			try {
				con.getInputStream().close();
			} catch (Throwable e) {

			}
			try {
				con.getOutputStream().close();
			} catch (Throwable e) {

			}
			con.disconnect();
		}
		return result;
	}
	
	public static String sendPost(String url,String data) throws Exception {
        log.info("Post send ["+data+"] to "+url);
		return sendPost(url,data.getBytes("UTF-8"), 3000);
	}

	public static String sendPost(String url, byte[] data, int timeout) throws Exception {
		HttpURLConnection con = null;
		BufferedReader in = null;
		String result = "";
		try {

			URL httpUrl = new URL(url);
			con = (HttpURLConnection) httpUrl.openConnection();
			con.setRequestMethod("POST");
			con.setDoOutput(true);
			con.setConnectTimeout(timeout);
			con.setReadTimeout(timeout);
			OutputStream out = con.getOutputStream();
			out.write(data);
			out.flush();
			out.close();
			int responseCode = con.getResponseCode();
            log.info("Post return ["+responseCode+"] from "+url);
			if (responseCode == HttpURLConnection.HTTP_OK) {
				in = new BufferedReader(new InputStreamReader(con.getInputStream(), "UTF-8"));
				String line;
				while ((line = in.readLine()) != null) {
					result += line;
				}
			} else {
				throw new IOException();
			}

		} catch (IOException e) {
			throw e;
		} finally {
			if (in != null) {
				try {
					if (in != null)
						in.close();
				} catch (IOException e) {
				}
			}

			if (con != null) {
				try {
					con.getInputStream().close();
				} catch (Throwable e) {

				}
				try {
					con.getOutputStream().close();
				} catch (Throwable e) {

				}
				con.disconnect();
			}

		}
		return result;
	}

	public static String downloadFile(String fileURL, String saveDir)
			throws Exception {
		String saveFilePath = null;

		URL url = new URL(fileURL);
		HttpURLConnection httpConn = (HttpURLConnection) url.openConnection();
		int responseCode = httpConn.getResponseCode();

		// always check HTTP response code first
		if (responseCode == HttpURLConnection.HTTP_OK) {
			String fileName = "";
			String disposition = httpConn.getHeaderField("Content-Disposition");

			if (disposition != null) {
				// extracts file name from header field
				int index = disposition.indexOf("filename=");
				if (index > 0) {
					fileName = disposition.substring(index + 10,
							disposition.length() - 1);
				}
			} else {
				// extracts file name from URL
				fileName = fileURL.substring(fileURL.lastIndexOf("/") + 1,
						fileURL.length());
			}

			// opens input stream from the HTTP connection
			InputStream inputStream = httpConn.getInputStream();
			saveFilePath = saveDir + File.separator + fileName;

			// opens an output stream to save into file
			FileOutputStream outputStream = new FileOutputStream(saveFilePath);

			int bytesRead = -1;
			byte[] buffer = new byte[BUFFER_SIZE];
			while ((bytesRead = inputStream.read(buffer)) != -1) {
				outputStream.write(buffer, 0, bytesRead);
			}

			outputStream.close();
			inputStream.close();
		}else {
			throw new Exception("response not ok");
		}

		httpConn.disconnect();

		return saveFilePath;
	}

}

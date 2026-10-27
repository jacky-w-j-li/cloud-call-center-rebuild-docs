package com.dishui.util;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.net.URLEncoder;

public class HttpProvider {

    public static  void main(String [] args) throws Exception {
        String url = "http://7xsg8k.com2.z0.glb.qiniucdn.com/email/2016-05-05/1462415016389/5f2a8660-1268-11e6-accf-a9192ddea335/0 (1).png";
        URL url1 = new URL(url);
        URI uri = new URI(url1.getProtocol(), url1.getUserInfo(), url1.getHost(), url1.getPort(), url1.getPath(), url1.getQuery(), url1.getRef());
        url = uri.toASCIIString();
//        System.out.println(uri.toASCIIString());
        String fileName = "";
//        if(url.lastIndexOf("/") != -1){
//            int index = url.lastIndexOf("/");
//            url = url.substring(0,index+1) + URLEncoder.encode(url.substring(index + 1), "utf-8");
//        }
//        System.out.println(url);
        sendGetForFile(url,fileName);
    }

    public static boolean sendGetForFile(String url ,String fileName) throws Exception {
        if(url != null ){
            URL url1 = new URL(url);
            URI uri = new URI(url1.getProtocol(), url1.getUserInfo(), url1.getHost(), url1.getPort(), url1.getPath(), url1.getQuery(), url1.getRef());
            url = uri.toASCIIString();
        }
        boolean result = false;
        HttpURLConnection con = null;
        BufferedReader in = null;
        try {
            URL httpUrl = new URL(url);
            con = (HttpURLConnection) httpUrl.openConnection();
            con.setRequestMethod("GET");
            int responseCode = con.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                InputStream inStream = con.getInputStream();
                FileOutputStream fs = new FileOutputStream(fileName);
                byte[] buffer = new byte[1204];
                int bytesum = 0;
                int byteread = 0;
                while ((byteread = inStream.read(buffer)) != -1) {
                    bytesum += byteread;
                    fs.write(buffer, 0, byteread);
                }
                result = true;
            } else {
                throw new IOException();
            }
        } catch (Exception e){
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
        }
        return result;
    }

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
        return sendPost(url,data.getBytes("UTF-8"), 20000 , "UTF-8");
	}

    public static String sendPost(String url , String data , String encoding) throws Exception {
        return sendPost(url,data.getBytes(encoding), 20000 , encoding);
    }

	public static String sendPost(String url, byte[] data, int timeout , String encoding) throws Exception {
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
			if (responseCode == HttpURLConnection.HTTP_OK) {
				in = new BufferedReader(new InputStreamReader(con.getInputStream(), encoding));
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

}

package com.m7.cc.url;

import java.io.BufferedInputStream;
import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * 
 * @author Cai Zhibin
 *
 */
public class HttpProvider {
	
	public static String sendPost(String url, byte[] data, int timeout) throws Exception{
		HttpURLConnection con = null;
		BufferedReader in = null;
		try {
			String result = "";
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
				in = new BufferedReader(new InputStreamReader(con
						.getInputStream()));
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
			if (in != null) {
				try {
					if (in != null)
						in.close();
				} catch (IOException e) {
				}
			}
			
			if (con != null) {
				try{
					con.getInputStream().close();
				} catch (Throwable e){
					
				}
				try{
					con.getOutputStream().close();
				} catch (Throwable e){
					
				}
				con.disconnect();
			}
		}
		return null;
	}
	
	public static String sendPost(String url, byte[] data) throws Exception{
		return sendPost(url, data, 10000);
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
				in = new BufferedReader(new InputStreamReader(con
						.getInputStream()));
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
			if(in != null)
				in.close();
			if(con != null) {
				try{
					con.getInputStream().close();
				} catch (Throwable e){
					
				}
				try{
					con.getOutputStream().close();
					con.disconnect();
				} catch (Throwable e){
					
				}
			}
			
		}
		return result;
	}
	
	public static String sendGet(String url) throws Exception {
		return sendGet(url, 10000);
	}
	
	public static String sendFile(String url, String filename) throws Exception{
		File file = new File(filename);
		if(!file.exists())
			throw new Exception("File ["+filename+"] not found");
		HttpURLConnection con = null;
		BufferedReader in = null;
		BufferedOutputStream out = null;
		InputStream fileIn = null;
		String result = null;
		try{
			
			URL httpUrl = new URL(url);
			con = (HttpURLConnection) httpUrl.openConnection();
			con.setRequestMethod("POST");
			con.setDoOutput(true);
			con.setReadTimeout(3600000);
			out = new BufferedOutputStream(con.getOutputStream());
			
			fileIn = new BufferedInputStream(new FileInputStream(file));
			byte[] data = new byte[1024];
			int count = -1;
			while((count = fileIn.read(data)) != -1){
				out.write(data, 0, count);
			}
			out.flush();
			out.close();
			
			int responseCode = con.getResponseCode();
			if (responseCode == HttpURLConnection.HTTP_OK) {
				in = new BufferedReader(new InputStreamReader(con
						.getInputStream()));
				String line;
				result = "";
				while ((line = in.readLine()) != null) {
					result += line;
				}
				return result;
			} else {

			}
		} catch (Exception e){
			throw e;
		} finally {
			try{
				if(in != null)
					in.close();
			}catch (Exception e){}
			try{
				if(in != null)
					out.close();
			}catch (Exception e){}
			try{
				con.getInputStream().close();
			} catch (Throwable e){
				
			}
			try{
				con.getOutputStream().close();
			} catch (Throwable e){
				
			}
			con.disconnect();
			
		}
		
		return result;
	}
}

package com.dishui.http;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.logging.Logger;

/**
 * 
 * @author Cai Zhibin
 *
 */
public class HttpProvider {
	private static Logger log = Logger.getLogger(HttpProvider.class.getName());
	
	public static String sendPost(String url, byte[] data) throws Exception{
		HttpURLConnection con = null;
		BufferedReader in = null;
		try {
			String result = "";
			URL httpUrl = new URL(url);
			con = (HttpURLConnection) httpUrl.openConnection();
			con.setRequestMethod("POST");
			con.setDoOutput(true);
			con.setConnectTimeout(10000);
			con.setReadTimeout(10000);
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
	
	public static String sendGet(String url) throws Exception {
		String result = "";
		System.out.println("Call url: "+url);
		HttpURLConnection con = null;
		BufferedReader in = null;
		try {
			URL httpUrl = new URL(url);
			con = (HttpURLConnection) httpUrl.openConnection();
			con.setRequestMethod("GET");
			con.setReadTimeout(10000);
			int responseCode = con.getResponseCode();
			log.info("Get return ["+responseCode+"] from "+url);
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
			fileIn.close();
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

    public static String sendSolrPost(String url, String data) throws Exception{
        HttpURLConnection con = null;
        BufferedReader in = null;
        try {
            String result = "";
            URL httpUrl = new URL(url);
            con = (HttpURLConnection) httpUrl.openConnection();
            con.setRequestMethod("POST");
            con.setDoOutput(true);
            con.setConnectTimeout(10000);
            con.setReadTimeout(10000);
            con.setRequestProperty("Accept", "application/json");
            con.setRequestProperty("Content-Type", "application/json");
            con.connect();

            OutputStreamWriter out = new OutputStreamWriter(con.getOutputStream(), "UTF-8");
            out.append(data);
            out.flush();
            out.close();

            int responseCode = con.getResponseCode();
            if (responseCode == HttpURLConnection.HTTP_OK) {
                in = new BufferedReader(new InputStreamReader(con.getInputStream()));
                String line;
                while ((line = in.readLine()) != null) {
                    line = new String(line.getBytes(), "UTF-8");
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
	public static String sendGet2Solr(String url) throws Exception {
		String result = "";
		System.out.println("Call url: "+url);
		HttpURLConnection con = null;
		BufferedReader in = null;
		try {
			URL httpUrl = new URL(url);
			con = (HttpURLConnection) httpUrl.openConnection();
			con.setRequestMethod("GET");
			con.setReadTimeout(10000);
            con.setRequestProperty("Accept", "application/json");
            con.setRequestProperty("Content-Type", "application/json");
			int responseCode = con.getResponseCode();
			log.info("Get return ["+responseCode+"] from "+url);
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

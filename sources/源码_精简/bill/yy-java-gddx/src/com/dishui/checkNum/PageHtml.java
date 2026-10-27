package com.dishui.checkNum;

import java.io.IOException;
import org.apache.commons.httpclient.HttpStatus;
import org.apache.http.HttpEntity;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.util.EntityUtils;


/**
 * Created by liutianyu on 2016/9/27.
 */
public class PageHtml {
	
	/**
	 * 获取网页html
	 * 
	 */
	public  String getPageHtml(String currentUrl)  {
		HttpClient httpClient=new DefaultHttpClient();
		httpClient = HttpsClient.getNewHttpsClient(httpClient);
		String html = "";
		HttpGet request = new HttpGet(currentUrl);  
		HttpResponse response = null;
		 try {
			 response = httpClient.execute(request);
             if(response.getStatusLine().getStatusCode() == HttpStatus.SC_OK){
            	HttpEntity mEntity = response.getEntity();
                html = EntityUtils.toString(mEntity);
                //html=new String(html.getBytes("ISO8859-1"),"UTF-8");
                
             }
         }catch(IOException e){
        	 e.printStackTrace();
         }
         return html.toString();
     }
	
	
	
	
}

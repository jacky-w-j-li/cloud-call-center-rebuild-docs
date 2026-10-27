package com.dishui.service;

import java.security.MessageDigest;
import java.util.HashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.db.mango.MongoProvider;
import com.dishui.util.HttpProvider;
import com.mongodb.BasicDBObject;


public class SmsDisTask implements Runnable{

	private String url;
	private String data;
	private Logger log = Logger.getLogger(SmsDisTask.class.getName());
	
	public SmsDisTask(String url){
		this.url = url;
	}
	public SmsDisTask(String url,String data){
		this.url = url;
		this.data = data;
	}
	
	@Override
	public void run() {
		String res = "";
		try {
			if (url.indexOf("[post]") != -1) {
				url = url.substring(0,url.indexOf("[post]"));
				log.log(Level.WARNING, "sms_dis url:"+url);
				res = HttpProvider.sendPost(url,data.getBytes("UTF-8"),60);
			} else {
				res = HttpProvider.sendGet(url);
//				if(res.equals("200")){
//		  			MongoProvider.update("cc", "app_sms_dispatch", new BasicDBObject("_id",curDisMsg.get("_id")),new BasicDBObject("dis_state", "success"));
//		  		}else{
//		  			MongoProvider.update("cc", "app_sms_dispatch", new BasicDBObject("_id",curDisMsg.get("_id")),new BasicDBObject("dis_state", "fail"));
//		  		}
			}
			log.log(Level.WARNING, "sms_dis res:"+res);
			
			
			
		} catch (Exception e) {
			
			log.log(Level.WARNING, "sms_dis url resp:"+url, e);
		}
	}

}

package com.m7.cc.ass.server.webcall.dispatcher;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.url.HttpProvider;
import com.m7.cc.util.log.IceLogger;

public class WebCallTask implements Runnable{
	private String url;
	private String actionid;
	private String reason;
	private String callbacktype;
	private static Logger log = IceLogger.getLogger(ASConfig.getInstance().getLogDir(),
			"webcall_callback_url", "ALL", false);
	
	public WebCallTask(String url,String actionid,String reason,String callbacktype){
		this.url = url;
		this.actionid = actionid;
		this.reason = reason;
		this.callbacktype = callbacktype;
	}
	@Override
	public void run() {
		log.setUseParentHandlers(false);
		String geturl=url;
		String data="actionid="+actionid+"&Message="+reason;
		String Messageres = "";
		log.log(Level.INFO,geturl+"?"+data);
		try {
			if(callbacktype.equals("get")){
				 Messageres = HttpProvider.sendGet(geturl+"?"+data);
			}else if(callbacktype.equals("post")){
				 Messageres = HttpProvider.sendPost(geturl, data.getBytes("UTF-8"));
			}
			log.log(Level.INFO,geturl+"callback:"+Messageres);
		} catch (Exception e) {
			log.log(Level.WARNING,"&actionid="+actionid+"&Message="+reason+"has send error!!",e);
		}
	
	}
}

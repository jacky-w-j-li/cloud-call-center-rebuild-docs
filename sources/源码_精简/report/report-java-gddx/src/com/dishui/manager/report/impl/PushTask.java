package com.dishui.manager.report.impl;

import com.dishui.util.HttpProvider;
import com.mongodb.util.JSON;

import java.net.URLEncoder;
import java.util.Hashtable;
import java.util.logging.Level;
import java.util.logging.Logger;

public class PushTask implements Runnable{
    private Logger log = Logger.getLogger(PushTask.class.getName());

	private String ip;
    private String port;
    private String account;
    private String eventName;
    private String userId;
    private Hashtable<String,Object> dataMap;

	public PushTask(String ip,String port,String account,String userId, String eventName, Hashtable<String,Object> dataMap){
		this.ip = ip;
        this.port = port;
        this.account = account;
        this.userId = userId;
        this.eventName = eventName;
        this.dataMap = dataMap;
	}
	
	@Override
	public void run() {
		try {
//推送事件结构
//        {
//            eventData:{
//                Account:"",
//                Event:"",
//                Data:{具体业务数据},
//            },
//            userId : ""
//        }
            Hashtable<String, Object> subMap = new Hashtable<String, Object>();
            subMap.put("Account", account);
            subMap.put("Event", eventName);
            subMap.put("Data", dataMap);
            Hashtable<String, Object> map = new Hashtable<String, Object>();
            map.put("userId", userId);
            map.put("eventData", subMap);

            String url = "http://"+ip+":"+port+"/push?msg="+ URLEncoder.encode(JSON.serialize(map),"UTF-8");
            log.log(Level.INFO, "push url = " + url);
            String res = HttpProvider.sendGet(url);
        } catch (Exception e) {
			log.log(Level.WARNING, "push task has err", e);
		}
	}
}

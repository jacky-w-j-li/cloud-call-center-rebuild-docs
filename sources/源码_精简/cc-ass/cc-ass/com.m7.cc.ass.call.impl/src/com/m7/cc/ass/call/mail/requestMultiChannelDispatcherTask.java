package com.m7.cc.ass.call.mail;

import java.util.logging.Level;
import java.util.logging.Logger;

import com.m7.cc.ass.config.ASConfig;
import com.m7.cc.url.HttpProvider;

public class requestMultiChannelDispatcherTask implements Runnable{

	private String _id;
	private String type;
	private String status;
	private int syncType = 1;//1.sync type 1.status  2.user 3.webchat user
	private String userId;
	private String webchatSid;
	private String msgType;
	private Logger log = Logger.getLogger(requestMultiChannelDispatcherTask.class.getName());
	
	public requestMultiChannelDispatcherTask(String _id,String type,String status){
		this._id = _id;
		this.type = type;
		this.status = status;
	}
	
	public requestMultiChannelDispatcherTask(String _id,String type,String userId, int syncType){
		this._id = _id;
		this.type = type;
		this.userId = userId;
		this.syncType = syncType;
	}
	
	public requestMultiChannelDispatcherTask(String _id,String webchatSid,String type,String userId,String msgtype, int syncType){
		this._id = _id;
		this.webchatSid = webchatSid;
		this.type = type;
		this.userId = userId;
		this.msgType = msgtype;
		this.syncType = syncType;
	}
	
	public requestMultiChannelDispatcherTask(String _id,String webchatSid,String type,String status,String msgtype,String syncType){
		this._id = _id;
		this.webchatSid = webchatSid;
		this.type = type;
		this.status = status;
		this.msgType = msgtype;
		this.syncType = 4;
	}

	@Override
	public void run() {
		String data = null;
		if(syncType == 1){
			data = "data={\"_id\":\""+this._id+"\", \"type\":\""+this.type+"\", \"status\":\""+this.status+"\"}";			
		}else if(syncType == 2){
			data = "data={\"_id\":\""+this._id+"\", \"type\":\""+this.type+"\", \"user\":\""+this.userId+"\"}";
		}else if(syncType == 3){
			data = "data={\"_id\":\""+this._id+"\", \"sid\":\""+this.webchatSid+"\", \"type\":\""+this.type+"\", \"msgType\":\""+this.msgType+"\", \"user\":\""+this.userId+"\"}";
		}else if(syncType == 4){
			data = "data={\"_id\":\""+this._id+"\", \"sid\":\""+this.webchatSid+"\", \"type\":\""+this.type+"\", \"msgType\":\""+this.msgType+"\", \"status\":\""+this.status+"\"}";
		}
		try {
			String res = HttpProvider.sendPost(ASConfig.getInstance().getMultiChannelDispatcherUrl(), data.getBytes("UTF-8"));
			log.log(Level.INFO, "requestMultiChannelDispatcher "+data+". response = "+res);
		} catch (Exception e) {
			log.log(Level.WARNING, "requestMultiChannelDispatcher "+data+" failed!", e);
		}
	}
}
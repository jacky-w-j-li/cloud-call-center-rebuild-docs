package com.dishui.service;



import java.io.UnsupportedEncodingException;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.logging.Level;
import java.util.logging.Logger;

import com.dishui.db.mango.MongoProvider;
import com.dishui.sms.YTXSmsMaster;
import com.dishui.util.HttpProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class SmsDispatchService {
     private static Logger log = Logger.getLogger(SmsDispatchService.class.getName());
	 public static SmsDispatchService instance;
	 private Thread smsThread;
     private ExecutorService excutor;
	 private boolean running = true;
	 private long waitTime = 1000;
	 private boolean isSending = false;
	 public static SmsDispatchService getInstance(){
	        if(instance == null){
	            new SmsDispatchService();
	        }
	        return instance;
	    }
	 private SmsDispatchService(){
	        instance = this;
	        excutor = Executors.newCachedThreadPool();
	        this.smsThread = new Thread("sms dispatch send thread") {
	            @Override
	            public void run() {
	                while (running) {
	                    try {
	                        if (!isSending) {
	                            isSending = true;
	                            try {
	                            	processSmsDispatch();
	                            } catch (Exception e) {
	                                log.log(Level.WARNING, "", e);
	                            } finally {
	                                isSending = false;
	                            }
	                        } else {
	                            log.log(Level.WARNING, "sms dispatch process is still running!,wait ........");
	                        }
	                    } catch (Exception e) {
	                        log.log(Level.WARNING, "", e);
	                    }
	                    try {
	                        sleep(waitTime);
	                    } catch (Exception e) {
	                        log.log(Level.WARNING, "", e);
	                    }
	                }
	            }
	        };
	        this.smsThread.setDaemon(true);
	        this.smsThread.start();
	    }
	   public void processSmsDispatch() {
		  String resp = "";
	      DBObject findNewDis = new BasicDBObject();
	      findNewDis.put("dis_state", "ready");
	      List<DBObject> list = MongoProvider.find("cc", "app_sms_dispatch", findNewDis);
	      if(list.size()>0){
	    	  log.info("短信推送"+list.size()+" 条 ");
	            for(int i=0 ;i<list.size() ;i++){
	            	DBObject curDisMsg = list.get(i);
	            	MongoProvider.update("cc", "app_sms_dispatch", new BasicDBObject("_id",curDisMsg.get("_id")),new BasicDBObject("$set", new BasicDBObject("dis_state", "already")));
	            	String data = "{\"msgid\":\""+curDisMsg.get("_id").toString()+"\",\"mobilenum\":\""+curDisMsg.get("mobilenum").toString()+"\",\"smscode\":\""+curDisMsg.get("7moorcode").toString()+"\",\"smsmsg\":\""+curDisMsg.get("7moormsg").toString()+"\",\"arrtime\":\""+curDisMsg.get("arr_time").toString()+"\"}";
			  		try { 
			  			excutor.execute(new SmsDisTask(curDisMsg.get("dis_url").toString(),data));
			  		} catch (Exception e) {
			  			// TODO Auto-generated catch block
			  			e.printStackTrace();
			  		}
			  		
	            }
	      }
	   }
}

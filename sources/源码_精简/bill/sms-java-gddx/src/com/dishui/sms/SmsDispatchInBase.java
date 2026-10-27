package com.dishui.sms;

import java.text.DateFormat;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.UUID;

import com.dishui.db.mango.MongoProvider;
import com.mongodb.BasicDBObject;
import com.mongodb.DBObject;

public class SmsDispatchInBase {
	public static SmsDispatchInBase instance;
	public static SmsDispatchInBase getInstance(){
		 if(instance == null){
			 return  new SmsDispatchInBase();
	        }
	        return instance;
	}
	public void inbase(String msgid,String code,String account,String mobnum,int type){
		String dis_code = "000010"; 
		String dis_msg = "其他"; 
		if(type == 1){
			 dis_code = "000001";//状态码
	   	     dis_msg = "发送失败："+code;//状态日志
		 }else if(type == 0){
			 DBObject codeDoc = MongoProvider.findOne("smscode_7moor",new BasicDBObject("_id", code));
	         if(codeDoc != null){
	    	     dis_code = codeDoc.get("7moormsg_code").toString();//状态码
	      	     dis_msg = codeDoc.get("7moormsg").toString();//状态日志
	         }
		 }
		 
	   	 Date date=new Date();
	     DateFormat format=new SimpleDateFormat("yyyy-MM-dd HH:mm:ss");
	     String time=format.format(date);
         
         DBObject accserDoc =  MongoProvider.findOne("platform_account_product",new BasicDBObject("_id",account+"_cc"));
         if(accserDoc.get("open_sms_dispatch")!=null){
	         if(accserDoc.get("open_sms_dispatch").toString().equals("true")){
	        	 if(accserDoc.get("sms_dispatch_url")!=null){
		    	  String dis_url =  accserDoc.get("sms_dispatch_url").toString();//推送的URL
		    	  String dis_msg_id = UUID.randomUUID().toString();//msg_id
		    	  MongoProvider.insert("cc","app_sms_dispatch", new BasicDBObject("_id",msgid)
		    	  .append("7moormsg", dis_msg)
		    	  .append("7moorcode", dis_code)
		    	  .append("dis_url", dis_url)
		    	  .append("arr_time", time)
		    	  .append("mobilenum", mobnum)
		    	  .append("dis_state", "ready"));
	        	 }
	        }
         }
	}
	public void inbase(String msgid,String code,String account,String date,String mobnum){
		   String dis_code = "000010";//状态码
   	       String dis_msg = "其他";//状态日志
   	       
           DBObject codeDoc = MongoProvider.findOne("smscode_7moor",new BasicDBObject("_id", code));
           if(codeDoc != null){
        	   dis_code = codeDoc.get("7moormsg_code").toString();//状态码
          	   dis_msg = codeDoc.get("7moormsg").toString();//状态日志
           }
           DBObject accserDoc =  MongoProvider.findOne("platform_account_product",new BasicDBObject("_id",account+"_cc"));
           if(accserDoc.get("open_sms_dispatch")!=null){
        	   if(accserDoc.get("open_sms_dispatch").toString().equals("true")){
        		   if(accserDoc.get("sms_dispatch_url")!=null){
             	  String dis_url =  accserDoc.get("sms_dispatch_url").toString();//推送的URL
             	  String dis_msg_id = UUID.randomUUID().toString();//msg_id
             	//时间
             	  MongoProvider.insert("cc","app_sms_dispatch", new BasicDBObject("_id",msgid)
             	  .append("7moormsg", dis_msg)
             	  .append("7moorcode", dis_code)
             	  .append("dis_url", dis_url)
             	  .append("arr_time", date)
             	  .append("mobilenum", mobnum)
             	  .append("dis_state", "ready"));
        		   }
                }
           }
           
           
	}
}
